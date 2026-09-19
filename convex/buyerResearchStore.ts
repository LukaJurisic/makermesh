import {v} from 'convex/values';
import {internalQuery, internalMutation} from './_generated/server';
import schema from './schema';
import {researchBrief, researchSource} from './model/buyerResearch';
import {sha256Hex} from './model/mailboxAllowlist';

export const context = internalQuery({
  args: {requestId: v.id('buyerResearchRequests')},
  returns: v.union(v.null(), schema.doc('buyerResearchRequests')),
  handler: (ctx, args) => ctx.db.get(args.requestId),
});
export const pages = internalQuery({
  args: {requestId: v.id('buyerResearchRequests')},
  returns: v.array(schema.doc('buyerResearchPages')),
  handler: (ctx, args) =>
    ctx.db
      .query('buyerResearchPages')
      .withIndex('by_request', (q) => q.eq('requestId', args.requestId))
      .take(4),
});

export const claim = internalMutation({
  args: {
    requestId: v.id('buyerResearchRequests'),
    stage: v.union(v.literal('compile'), v.literal('search'), v.literal('extract')),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const r = await ctx.db.get(args.requestId);
    if (!r || r.expiresAt <= Date.now()) return false;
    const budget = await ctx.db
      .query('buyerResearchBudget')
      .withIndex('by_key', (q) => q.eq('key', 'public'))
      .unique();
    if (!budget?.enabled) throw new Error('Research paused.');
    if (args.stage === 'compile') {
      if (r.status !== 'compiling' || r.compileClaimed) return false;
      await ctx.db.patch(r._id, {compileClaimed: true});
    }
    if (args.stage === 'search') {
      if (r.status !== 'searching' || !r.approvedAt || r.searchClaimed) return false;
      await ctx.db.patch(r._id, {searchClaimed: true});
    }
    if (args.stage === 'extract') {
      if (r.status !== 'reading' || !r.approvedAt || r.extractClaimed) return false;
      await ctx.db.patch(r._id, {extractClaimed: true, status: 'extracting'});
    }
    return true;
  },
});

export const saveBrief = internalMutation({
  args: {requestId: v.id('buyerResearchRequests'), inScope: v.boolean(), brief: researchBrief},
  returns: v.null(),
  handler: async (ctx, args) => {
    const r = await ctx.db.get(args.requestId);
    if (!r || r.status !== 'compiling' || !r.compileClaimed)
      throw new Error('Brief persistence is stale.');
    if (
      args.brief.requirements.length < 1 ||
      args.brief.requirements.length > 12 ||
      new Set(args.brief.requirements.map((x) => x.key)).size !== args.brief.requirements.length
    )
      throw new Error('Invalid research requirements.');
    const briefHash = await sha256Hex(JSON.stringify(args.brief));
    await ctx.db.patch(r._id, {
      brief: args.brief,
      briefHash,
      status: args.inScope ? 'review' : 'out_of_scope',
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const savePages = internalMutation({
  args: {
    requestId: v.id('buyerResearchRequests'),
    pages: v.array(
      v.object({url: v.string(), title: v.string(), text: v.string(), observedAt: v.number()}),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const r = await ctx.db.get(args.requestId);
    if (!r || r.status !== 'searching' || !r.searchClaimed || !r.approvedAt)
      throw new Error('Research persistence is stale.');
    if (
      args.pages.length > 3 ||
      args.pages.some((p) => p.text.length > 5000 || p.title.length > 160)
    )
      throw new Error('Research result exceeds limits.');
    for (const page of args.pages)
      await ctx.db.insert('buyerResearchPages', {requestId: r._id, ...page});
    await ctx.db.patch(r._id, {status: 'reading', updatedAt: Date.now()});
    return null;
  },
});

export const complete = internalMutation({
  args: {requestId: v.id('buyerResearchRequests'), results: v.array(researchSource)},
  returns: v.null(),
  handler: async (ctx, args) => {
    const r = await ctx.db.get(args.requestId);
    if (!r || r.status !== 'extracting' || !r.extractClaimed || !r.approvedAt || !r.brief)
      throw new Error('Research completion is stale.');
    const pages = await ctx.db
      .query('buyerResearchPages')
      .withIndex('by_request', (q) => q.eq('requestId', r._id))
      .take(4);
    if (
      args.results.length > 3 ||
      new Set(args.results.map((x) => x.url)).size !== args.results.length
    )
      throw new Error('Invalid research result count.');
    for (const source of args.results) {
      const page = pages.find((p) => p.url === source.url);
      if (
        !page ||
        source.title !== page.title ||
        source.observedAt !== page.observedAt ||
        source.facts.length > 4 ||
        (source.locationExcerpt !== undefined &&
          (!source.locationExcerpt ||
            source.locationExcerpt.length > 200 ||
            !page.text.includes(source.locationExcerpt))) ||
        source.facts.some(
          (f) =>
            !f.excerpt ||
            f.excerpt.length > 200 ||
            !page.text.includes(f.excerpt) ||
            !r.brief!.requirements.some((req) => req.key === f.requirementKey),
        )
      )
        throw new Error('Research evidence changed or is unsupported.');
    }
    await ctx.db.patch(r._id, {status: 'complete', results: args.results, updatedAt: Date.now()});
    return null;
  },
});
export const fail = internalMutation({
  args: {requestId: v.id('buyerResearchRequests'), error: v.string()},
  returns: v.null(),
  handler: async (ctx, args) => {
    const r = await ctx.db.get(args.requestId);
    if (r && !['complete', 'out_of_scope'].includes(r.status))
      await ctx.db.patch(r._id, {
        status: 'failed',
        error: args.error.slice(0, 180),
        updatedAt: Date.now(),
      });
    return null;
  },
});

export const cleanupExpired = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const records = await ctx.db
      .query('buyerResearchRequests')
      .withIndex('by_expiresAt', (q) => q.lte('expiresAt', Date.now()))
      .take(20);
    for (const r of records) {
      const pages = await ctx.db
        .query('buyerResearchPages')
        .withIndex('by_request', (q) => q.eq('requestId', r._id))
        .take(4);
      for (const page of pages) await ctx.db.delete(page._id);
      await ctx.db.delete(r._id);
    }
    return records.length;
  },
});

export const expireRequest = internalMutation({
  args: {requestId: v.id('buyerResearchRequests')},
  returns: v.null(),
  handler: async (ctx, args) => {
    const r = await ctx.db.get(args.requestId);
    if (!r || r.expiresAt > Date.now()) return null;
    const pages = await ctx.db
      .query('buyerResearchPages')
      .withIndex('by_request', (q) => q.eq('requestId', r._id))
      .take(4);
    for (const page of pages) await ctx.db.delete(page._id);
    await ctx.db.delete(r._id);
    return null;
  },
});
