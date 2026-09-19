import {v} from 'convex/values';
import {mutation, query} from './_generated/server';
import {requireOperator} from './model/requireOperator';
import {controlledReplyValidator, loadControlledReply} from './model/controlledReply';
import {loadReplyOperationScope} from './model/replyScope';

const key = 'atlas-controlled-reply' as const;

export const recalculate = mutation({
  args: {operationId: v.id('externalOperations')},
  returns: v.object({
    evaluationsUpdated: v.number(),
    hardFailures: v.number(),
    unknowns: v.number(),
  }),
  handler: async (ctx, args) => {
    await requireOperator(ctx);
    const {proof} = await loadControlledReply(ctx, args.operationId);
    const {operation, project, brief, supplier} = await loadReplyOperationScope(
      ctx,
      args.operationId,
    );
    const requirements = await ctx.db
      .query('requirements')
      .withIndex('by_briefId_and_displayOrder', (q) => q.eq('briefId', brief._id))
      .take(100);
    const claims = await ctx.db
      .query('capabilityClaims')
      .withIndex('by_agentMailMessageId', (q) =>
        q.eq('agentMailMessageId', operation.sourceMessageId!),
      )
      .take(65);
    const now = Date.now();
    for (const result of proof.evaluations) {
      const requirement = requirements.find((r) => r.key === result.requirementKey)!;
      const sharedKey =
        result.requirementKey === 'moq_preferred'
          ? 'moq_max'
          : result.requirementKey === 'production_time_preferred'
            ? 'production_time'
            : result.requirementKey;
      const claim =
        claims.find((c) => c.key === result.requirementKey) ??
        claims.find((c) => c.key === sharedKey);
      const existing = await ctx.db
        .query('requirementEvaluations')
        .withIndex('by_supplierId_and_projectId_and_requirementId', (q) =>
          q
            .eq('supplierId', supplier._id)
            .eq('projectId', project._id)
            .eq('requirementId', requirement._id),
        )
        .unique();
      const fields = {
        projectId: project._id,
        supplierId: supplier._id,
        requirementId: requirement._id,
        outcome: result.outcome,
        reasonCode: 'controlled_reply_evidence_v2',
        displayValue: result.outcome === 'unknown' ? 'Unknown' : 'See exact reply evidence',
        evidenceClaimIds: result.supportingExcerpt && claim ? [claim._id] : [],
        evaluatorVersion: 'requirements.v2',
        evaluatedAt: now,
      };
      if (existing) await ctx.db.replace(existing._id, fields);
      else await ctx.db.insert('requirementEvaluations', fields);
    }
    const hard = proof.evaluations.filter((e) => e.type === 'hard');
    const hardFailures = hard.filter((e) => e.outcome === 'fail').length;
    const unknowns = proof.evaluations.filter((e) => e.outcome === 'unknown').length;
    const soft = proof.evaluations.filter(
      (e) => e.type === 'soft' && e.outcome !== 'not_applicable',
    );
    const totalWeight = soft.reduce((sum, e) => sum + e.weight, 0);
    const earnedWeight = soft.reduce((sum, e) => sum + (e.outcome === 'pass' ? e.weight : 0), 0);
    const appearance = await ctx.db
      .query('projectSuppliers')
      .withIndex('by_projectId_and_supplierId', (q) =>
        q.eq('projectId', project._id).eq('supplierId', supplier._id),
      )
      .unique();
    const quote = proof.quote;
    const commercial = quote
      ? [
          quote.unitPrice,
          quote.currency,
          quote.quoteBasis === 'unknown' ? undefined : quote.quoteBasis,
          quote.moq,
          quote.productionMaxDays,
          quote.sampleTerms,
          quote.shippingIncluded,
          quote.paymentTerms,
        ]
      : [];
    if (appearance)
      await ctx.db.patch(appearance._id, {
        eligibility: hardFailures
          ? 'hard_failure'
          : hard.some((e) => e.outcome === 'unknown')
            ? 'provisionally_unqualified'
            : 'eligible',
        preferenceFit: totalWeight ? Math.round((100 * earnedWeight) / totalWeight) : 0,
        evidenceCoverage: Math.round(
          (100 * proof.evaluations.filter((e) => !!e.supportingExcerpt).length) /
            Math.max(1, proof.evaluations.length),
        ),
        commercialCompleteness: Math.round(
          (100 * commercial.filter((value) => value !== undefined && value !== '').length) / 8,
        ),
        openQuestionCount: unknowns,
        latestActivityAt: now,
      });
    return {evaluationsUpdated: proof.evaluations.length, hardFailures, unknowns};
  },
});

export const preview = query({
  args: {operationId: v.id('externalOperations')},
  returns: v.object({proof: controlledReplyValidator, fingerprint: v.string()}),
  handler: async (ctx, args) => {
    await requireOperator(ctx);
    return loadControlledReply(ctx, args.operationId);
  },
});

export const publish = mutation({
  args: {operationId: v.id('externalOperations'), expectedFingerprint: v.string()},
  returns: v.boolean(),
  handler: async (ctx, args) => {
    await requireOperator(ctx);
    const {fingerprint} = await loadControlledReply(ctx, args.operationId);
    if (args.expectedFingerprint !== fingerprint)
      throw new Error('Controlled reply changed after publication review.');
    const existing = await ctx.db
      .query('controlledReplyPublications')
      .withIndex('by_key', (q) => q.eq('key', key))
      .unique();
    if (existing?.fingerprint === fingerprint && existing.status === 'published') return false;
    const fields = {
      key,
      operationId: args.operationId,
      fingerprint,
      publishedAt: Date.now(),
      status: 'published' as const,
    };
    if (existing) await ctx.db.replace(existing._id, fields);
    else await ctx.db.insert('controlledReplyPublications', fields);
    return true;
  },
});

export const unpublish = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await requireOperator(ctx);
    const existing = await ctx.db
      .query('controlledReplyPublications')
      .withIndex('by_key', (q) => q.eq('key', key))
      .unique();
    if (existing) await ctx.db.patch(existing._id, {status: 'withdrawn'});
    return null;
  },
});

// Intentionally public: no caller-controlled IDs and no private fields in the DTO.
export const getPublished = query({
  args: {},
  returns: v.union(v.null(), controlledReplyValidator),
  handler: async (ctx) => {
    const publication = await ctx.db
      .query('controlledReplyPublications')
      .withIndex('by_key', (q) => q.eq('key', key))
      .unique();
    if (!publication || publication.status !== 'published') return null;
    try {
      const {proof, fingerprint} = await loadControlledReply(ctx, publication.operationId);
      return fingerprint === publication.fingerprint ? proof : null;
    } catch {
      return null;
    }
  },
});
