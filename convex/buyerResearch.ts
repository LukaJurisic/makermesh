import {v} from 'convex/values';
import {SessionIdArg} from 'convex-helpers/server/sessions';
import {DAY, HOUR, RateLimiter} from '@convex-dev/rate-limiter';
import {components, internal} from './_generated/api';
import {mutation, query} from './_generated/server';
import {buyerWorkflow} from './buyerResearchWorkflow';
import {
  researchInput,
  researchBrief,
  researchState,
  researchSource,
  validateResearchInput,
  validateSession,
} from './model/buyerResearch';
import {requireOperator} from './model/requireOperator';
const limits = new RateLimiter(components.rateLimiter, {
  visitorHour: {kind: 'fixed window', rate: 2, period: HOUR},
  visitorDay: {kind: 'fixed window', rate: 3, period: DAY},
  globalDay: {kind: 'fixed window', rate: 10, period: DAY},
});

export const configureBudget = mutation({
  args: {enabled: v.boolean(), remaining: v.number()},
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireOperator(ctx);
    if (!Number.isInteger(args.remaining) || args.remaining < 0 || args.remaining > 25)
      throw new Error('Choose a total allowance from 0 to 25 research requests.');
    const existing = await ctx.db
      .query('buyerResearchBudget')
      .withIndex('by_key', (q) => q.eq('key', 'public'))
      .unique();
    if (existing) await ctx.db.patch(existing._id, args);
    else await ctx.db.insert('buyerResearchBudget', {key: 'public', ...args});
    return null;
  },
});
export const availability = query({
  args: {},
  returns: v.object({enabled: v.boolean()}),
  handler: async (ctx) => {
    const b = await ctx.db
      .query('buyerResearchBudget')
      .withIndex('by_key', (q) => q.eq('key', 'public'))
      .unique();
    return {enabled: !!b?.enabled && b.remaining > 0};
  },
});

export const create = mutation({
  args: {...SessionIdArg, input: researchInput, requestKey: v.string()},
  returns: v.id('buyerResearchRequests'),
  handler: async (ctx, args) => {
    validateSession(args.sessionId);
    validateResearchInput(args.input);
    if (!/^[a-zA-Z0-9_-]{8,80}$/.test(args.requestKey)) throw new Error('Invalid request key.');
    const existing = await ctx.db
      .query('buyerResearchRequests')
      .withIndex('by_session_and_key', (q) =>
        q.eq('sessionId', args.sessionId).eq('requestKey', args.requestKey),
      )
      .unique();
    if (existing) {
      if (JSON.stringify(existing.input) !== JSON.stringify(args.input))
        throw new Error('Request key already used for a different brief.');
      return existing._id;
    }
    const b = await ctx.db
      .query('buyerResearchBudget')
      .withIndex('by_key', (q) => q.eq('key', 'public'))
      .unique();
    if (!b?.enabled || b.remaining < 1)
      throw new Error(
        'Live research is at capacity. You can still save a draft and explore the example.',
      );
    await limits.limit(ctx, 'visitorHour', {key: args.sessionId, throws: true});
    await limits.limit(ctx, 'visitorDay', {key: args.sessionId, throws: true});
    await limits.limit(ctx, 'globalDay', {throws: true});
    const now = Date.now();
    const requestId = await ctx.db.insert('buyerResearchRequests', {
      sessionId: args.sessionId,
      requestKey: args.requestKey,
      input: args.input,
      status: 'compiling',
      createdAt: now,
      updatedAt: now,
      expiresAt: now + 2 * DAY,
    });
    await ctx.db.patch(b._id, {remaining: b.remaining - 1});
    await ctx.scheduler.runAt(now + 2 * DAY, internal.buyerResearchStore.expireRequest, {
      requestId,
    });
    await buyerWorkflow.start(
      ctx,
      internal.buyerResearchWorkflow.compile,
      {requestId},
      {startAsync: true},
    );
    return requestId;
  },
});

export const approve = mutation({
  args: {...SessionIdArg, requestId: v.id('buyerResearchRequests'), expectedBriefHash: v.string()},
  returns: v.null(),
  handler: async (ctx, args) => {
    validateSession(args.sessionId);
    const r = await ctx.db.get(args.requestId);
    if (!r || r.sessionId !== args.sessionId)
      throw new Error('Request is not available in this browser session.');
    if (r.expiresAt <= Date.now()) throw new Error('This research request has expired.');
    if (!r.brief || r.briefHash !== args.expectedBriefHash)
      throw new Error('Brief changed after review.');
    if (r.approvedAt) return null;
    if (r.status !== 'review') throw new Error('Brief is not ready for approval.');
    const b = await ctx.db
      .query('buyerResearchBudget')
      .withIndex('by_key', (q) => q.eq('key', 'public'))
      .unique();
    if (!b?.enabled) throw new Error('Live research is temporarily paused.');
    await ctx.db.patch(r._id, {approvedAt: Date.now(), status: 'searching', updatedAt: Date.now()});
    await buyerWorkflow.start(
      ctx,
      internal.buyerResearchWorkflow.research,
      {requestId: r._id},
      {startAsync: true},
    );
    return null;
  },
});

export const get = query({
  args: {...SessionIdArg, requestId: v.string()},
  returns: v.union(
    v.null(),
    v.object({
      input: researchInput,
      status: researchState,
      brief: v.union(v.null(), researchBrief),
      briefHash: v.union(v.null(), v.string()),
      results: v.array(researchSource),
      error: v.union(v.null(), v.string()),
      sourceCount: v.number(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    validateSession(args.sessionId);
    const id = ctx.db.normalizeId('buyerResearchRequests', args.requestId);
    if (!id) return null;
    const r = await ctx.db.get(id);
    if (!r || r.sessionId !== args.sessionId) return null;
    const pages = await ctx.db
      .query('buyerResearchPages')
      .withIndex('by_request', (q) => q.eq('requestId', r._id))
      .take(4);
    return {
      input: r.input,
      status: r.status,
      brief: r.brief ?? null,
      briefHash: r.briefHash ?? null,
      results: r.results ?? [],
      error: r.error ?? null,
      sourceCount: pages.length,
      createdAt: r.createdAt,
    };
  },
});
