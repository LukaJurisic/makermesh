import {SessionIdArg} from 'convex-helpers/server/sessions';
import {DAY, MINUTE, RateLimiter} from '@convex-dev/rate-limiter';
import type {WithoutSystemFields} from 'convex/server';
import {v} from 'convex/values';
import type {Doc} from './_generated/dataModel';
import type {MutationCtx} from './_generated/server';
import {components, internal} from './_generated/api';
import {internalMutation, mutation, query} from './_generated/server';
import {DEMO_BASELINE_SLUG, DEMO_PROJECT_SLUG} from './fixtures/demoData';
import {loadPublicDemoResearch, publicDemoResearchValidator} from './model/publicDemoResearch';
import {
  productEventTypeValidator,
  projectStageValidator,
  rankingWeightsValidator,
} from './model/validators';

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;
const MAX_COMMANDS_PER_SESSION = 128;
const DEFAULT_WEIGHTS = {
  preferenceFit: 40,
  evidenceCoverage: 30,
  commercialCompleteness: 20,
  leadTime: 10,
  price: 0,
} as const;

type DemoCommandScope =
  | 'approve_brief'
  | 'start_research_replay'
  | 'approve_fixture_outreach'
  | 'apply_fixture_reply'
  | 'set_stage'
  | 'set_preference_weights'
  | 'reset_demo';

const publicDemoLimiter = new RateLimiter(components.rateLimiter, {
  sessionCreateGlobal: {kind: 'token bucket', rate: 1_000, period: MINUTE, capacity: 5_000},
  sessionCommand: {kind: 'token bucket', rate: 120, period: MINUTE, capacity: 80},
});

const stateValidator = v.object({
  currentStage: projectStageValidator,
  briefApproved: v.boolean(),
  researchStarted: v.boolean(),
  outreachApproved: v.boolean(),
  replyApplied: v.boolean(),
  selectedSupplierIds: v.array(v.id('supplierEntities')),
  replayStep: v.number(),
  weights: rankingWeightsValidator,
  presentationMode: v.boolean(),
});

const sessionResultValidator = v.object({
  sessionId: v.string(),
  expiresAt: v.number(),
  baseline: v.object({
    version: v.number(),
    sourceMode: v.union(v.literal('fixture'), v.literal('captured_live')),
    captureLabel: v.string(),
    capturedAt: v.number(),
  }),
  project: v.object({
    title: v.string(),
    slug: v.string(),
    buyerName: v.string(),
    destination: v.string(),
  }),
  metrics: v.object({
    sourcesAnalyzed: v.number(),
    makersDiscovered: v.number(),
    claimsExtracted: v.number(),
    openQuestions: v.number(),
    repliesReceived: v.number(),
  }),
  activity: v.array(
    v.object({
      id: v.string(),
      provider: v.union(
        v.literal('convex'),
        v.literal('openai'),
        v.literal('firecrawl'),
        v.literal('agentmail'),
      ),
      label: v.string(),
      status: v.union(
        v.literal('queued'),
        v.literal('running'),
        v.literal('completed'),
        v.literal('failed'),
        v.literal('cancelled'),
      ),
      occurredAt: v.number(),
      latencyMs: v.optional(v.number()),
      fixture: v.boolean(),
    }),
  ),
  research: publicDemoResearchValidator,
  state: stateValidator,
});

function validateCommandId(commandId: string) {
  if (!/^[a-zA-Z0-9_-]{8,128}$/.test(commandId)) {
    throw new Error('Invalid command identifier.');
  }
}

function validateWeights(weights: {
  preferenceFit: number;
  evidenceCoverage: number;
  commercialCompleteness: number;
  leadTime: number;
  price: number;
}) {
  const values = Object.values(weights);
  if (
    !values.every((value) => Number.isFinite(value) && Number.isInteger(value) && value >= 0) ||
    values.reduce((sum, value) => sum + value, 0) !== 100
  ) {
    throw new Error('Ranking weights must be non-negative integers totaling 100.');
  }
}

async function getActiveSession(ctx: MutationCtx, sessionId: string) {
  const session = await ctx.db
    .query('demoSessions')
    .withIndex('by_sessionId', (query) => query.eq('sessionId', sessionId))
    .unique();
  if (!session || session.status !== 'active' || session.expiresAt <= Date.now()) {
    throw new Error('Demo session is missing or expired.');
  }
  const state = await ctx.db
    .query('demoSessionState')
    .withIndex('by_sessionId', (query) => query.eq('sessionId', sessionId))
    .unique();
  if (!state) throw new Error('Demo session state is missing.');
  return {session, state};
}

async function beginCommand(
  ctx: MutationCtx,
  sessionId: string,
  commandId: string,
  scope: DemoCommandScope,
  expiresAt: number,
) {
  validateCommandId(commandId);
  const key = `demo:${sessionId}:${expiresAt}:${commandId}`;
  const existing = await ctx.db
    .query('idempotencyRecords')
    .withIndex('by_key', (query) => query.eq('key', key))
    .unique();
  if (existing) {
    if (existing.scope !== scope || existing.subjectKey !== sessionId) {
      throw new Error('Command identifier was already used for a different operation.');
    }
    return false;
  }
  const session = await ctx.db
    .query('demoSessions')
    .withIndex('by_sessionId', (query) => query.eq('sessionId', sessionId))
    .unique();
  if (!session || session.status !== 'active' || session.expiresAt !== expiresAt) {
    throw new Error('Demo session is missing or expired.');
  }
  const commandCount = session.commandCount ?? 0;
  if (commandCount >= MAX_COMMANDS_PER_SESSION) {
    throw new Error('This demo session has reached its 24-hour command limit.');
  }
  const commandLimit = await publicDemoLimiter.limit(ctx, 'sessionCommand', {key: sessionId});
  if (!commandLimit.ok) throw new Error('Demo command capacity is temporarily unavailable.');
  await ctx.db.insert('idempotencyRecords', {
    key,
    scope,
    subjectKey: sessionId,
    expiresAt,
    createdAt: Date.now(),
  });
  await ctx.db.patch(session._id, {commandCount: commandCount + 1});
  return true;
}

function toState(state: Doc<'demoSessionState'>) {
  return {
    currentStage: state.currentStage,
    briefApproved: Boolean(state.briefApprovedAt),
    researchStarted: state.replayStep >= 2,
    outreachApproved: state.outreachState !== 'draft',
    replyApplied: state.replyApplied,
    selectedSupplierIds: state.selectedSupplierIds,
    replayStep: state.replayStep,
    weights: state.weights,
    presentationMode: state.presentationMode,
  };
}

export const createSession = mutation({
  args: {...SessionIdArg},
  returns: v.object({sessionId: v.string(), expiresAt: v.number(), created: v.boolean()}),
  handler: async (ctx, args) => {
    if (!/^[a-zA-Z0-9_-]{20,128}$/.test(args.sessionId)) {
      throw new Error('Invalid anonymous session identifier.');
    }
    const now = Date.now();
    const existing = await ctx.db
      .query('demoSessions')
      .withIndex('by_sessionId', (query) => query.eq('sessionId', args.sessionId))
      .unique();
    if (existing && existing.status === 'active' && existing.expiresAt > now) {
      const existingBaseline = await ctx.db.get(existing.baselineId);
      if (
        existingBaseline?.status === 'published' &&
        existingBaseline.slug === DEMO_BASELINE_SLUG
      ) {
        return {sessionId: args.sessionId, expiresAt: existing.expiresAt, created: false};
      }
    }
    const creationLimit = await publicDemoLimiter.limit(ctx, 'sessionCreateGlobal');
    if (!creationLimit.ok) {
      throw new Error('Demo session capacity is temporarily unavailable; use captured fallback.');
    }
    const baseline = await ctx.db
      .query('demoBaselines')
      .withIndex('by_slug_and_status', (query) =>
        query.eq('slug', DEMO_BASELINE_SLUG).eq('status', 'published'),
      )
      .order('desc')
      .first();
    if (!baseline) throw new Error('Published demo baseline is missing.');
    const baselineAppearances = await ctx.db
      .query('projectSuppliers')
      .withIndex('by_projectId_and_stage', (query) =>
        query.eq('projectId', baseline.baselineProjectId),
      )
      .take(11);
    if (baselineAppearances.length > 10) throw new Error('Demo baseline maker limit exceeded.');
    const baselineSuppliers = await Promise.all(
      baselineAppearances.map((appearance) => ctx.db.get(appearance.supplierId)),
    );
    const atlas = baselineSuppliers.find(
      (supplier) => supplier?.slug === 'atlas-clay-studio' && supplier.demoSupplier,
    );
    if (!atlas) throw new Error('Atlas demonstration supplier is missing.');

    const expiresAt = now + SESSION_DURATION_MS;
    const initialState = {
      sessionId: args.sessionId,
      currentStage: 'brief',
      replayStep: 0,
      selectedSupplierIds: [atlas._id],
      outreachState: 'draft',
      replyApplied: false,
      weights: {...DEFAULT_WEIGHTS},
      presentationMode: false,
      updatedAt: now,
    } satisfies WithoutSystemFields<Doc<'demoSessionState'>>;
    if (existing) {
      await ctx.db.replace(existing._id, {
        sessionId: args.sessionId,
        baselineId: baseline._id,
        status: 'active',
        createdAt: now,
        lastActivityAt: now,
        expiresAt,
        commandCount: 0,
      });
      const oldState = await ctx.db
        .query('demoSessionState')
        .withIndex('by_sessionId', (query) => query.eq('sessionId', args.sessionId))
        .unique();
      if (oldState) await ctx.db.replace(oldState._id, initialState);
      else await ctx.db.insert('demoSessionState', initialState);
    } else {
      await ctx.db.insert('demoSessions', {
        sessionId: args.sessionId,
        baselineId: baseline._id,
        status: 'active',
        createdAt: now,
        lastActivityAt: now,
        expiresAt,
        commandCount: 0,
      });
      await ctx.db.insert('demoSessionState', initialState);
    }
    await ctx.scheduler.runAt(expiresAt, internal.demo.expireSession, {
      sessionId: args.sessionId,
    });
    return {sessionId: args.sessionId, expiresAt, created: true};
  },
});

export const getSession = query({
  args: {...SessionIdArg},
  returns: v.union(v.null(), sessionResultValidator),
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('demoSessions')
      .withIndex('by_sessionId', (query) => query.eq('sessionId', args.sessionId))
      .unique();
    if (!session || session.status !== 'active') return null;
    const state = await ctx.db
      .query('demoSessionState')
      .withIndex('by_sessionId', (query) => query.eq('sessionId', args.sessionId))
      .unique();
    const baseline = await ctx.db.get(session.baselineId);
    if (!state || !baseline) return null;
    if (baseline.status !== 'published' || baseline.slug !== DEMO_BASELINE_SLUG) return null;
    const project = await ctx.db.get(baseline.baselineProjectId);
    if (
      !project ||
      project.slug !== DEMO_PROJECT_SLUG ||
      project.dataMode !== 'demo_baseline' ||
      !project.demoMode
    )
      return null;
    const research = await loadPublicDemoResearch(ctx, project);
    if (!research) return null;
    const metrics = await ctx.db
      .query('projectMetrics')
      .withIndex('by_projectId', (query) => query.eq('projectId', project._id))
      .unique();
    if (!metrics) return null;
    const activity = await ctx.db
      .query('activityEvents')
      .withIndex('by_projectId_and_publicSafe_and_occurredAt', (query) =>
        query.eq('projectId', project._id).eq('publicSafe', true),
      )
      .order('desc')
      .take(20);
    return {
      sessionId: args.sessionId,
      expiresAt: session.expiresAt,
      baseline: {
        version: baseline.version,
        sourceMode: baseline.sourceMode,
        captureLabel: baseline.captureLabel,
        capturedAt: baseline.capturedAt,
      },
      project: {
        title: project.title,
        slug: project.slug,
        buyerName: project.buyerName,
        destination: project.destination,
      },
      metrics: {
        sourcesAnalyzed: metrics.sourcesAnalyzed,
        makersDiscovered: metrics.makersDiscovered,
        claimsExtracted: metrics.claimsExtracted,
        openQuestions: metrics.openQuestions,
        repliesReceived: metrics.repliesReceived,
      },
      activity: activity.map((event) => ({
        id: event._id,
        provider: event.provider,
        label: event.label,
        status: event.status,
        occurredAt: event.occurredAt,
        ...(typeof event.safeMetadata.latencyMs === 'number'
          ? {latencyMs: event.safeMetadata.latencyMs}
          : {}),
        fixture: event.safeMetadata.fixture === true,
      })),
      research,
      state: toState(state),
    };
  },
});

export const approveBrief = mutation({
  args: {...SessionIdArg, commandId: v.string()},
  returns: v.null(),
  handler: async (ctx, args) => {
    const {session, state} = await getActiveSession(ctx, args.sessionId);
    if (
      !(await beginCommand(ctx, args.sessionId, args.commandId, 'approve_brief', session.expiresAt))
    )
      return null;
    const now = Date.now();
    await ctx.db.patch(state._id, {
      briefApprovedAt: state.briefApprovedAt ?? now,
      currentStage: 'research',
      replayStep: Math.max(state.replayStep, 1),
      updatedAt: now,
    });
    await ctx.db.patch(session._id, {lastActivityAt: now});
    return null;
  },
});

export const startResearchReplay = mutation({
  args: {...SessionIdArg, commandId: v.string()},
  returns: v.null(),
  handler: async (ctx, args) => {
    const {session, state} = await getActiveSession(ctx, args.sessionId);
    if (!state.briefApprovedAt) throw new Error('Approve the brief before research.');
    if (
      !(await beginCommand(
        ctx,
        args.sessionId,
        args.commandId,
        'start_research_replay',
        session.expiresAt,
      ))
    ) {
      return null;
    }
    const now = Date.now();
    await ctx.db.patch(state._id, {replayStep: Math.max(state.replayStep, 2), updatedAt: now});
    await ctx.db.patch(session._id, {lastActivityAt: now});
    return null;
  },
});

export const approveFixtureOutreach = mutation({
  args: {...SessionIdArg, commandId: v.string()},
  returns: v.null(),
  handler: async (ctx, args) => {
    const {session, state} = await getActiveSession(ctx, args.sessionId);
    if (state.replayStep < 2) throw new Error('Review research before outreach approval.');
    if (
      !(await beginCommand(
        ctx,
        args.sessionId,
        args.commandId,
        'approve_fixture_outreach',
        session.expiresAt,
      ))
    ) {
      return null;
    }
    const now = Date.now();
    await ctx.db.patch(state._id, {
      outreachState: 'approved',
      replayStep: Math.max(state.replayStep, 3),
      updatedAt: now,
    });
    await ctx.db.patch(session._id, {lastActivityAt: now});
    return null;
  },
});

export const applyFixtureReply = mutation({
  args: {...SessionIdArg, commandId: v.string()},
  returns: v.null(),
  handler: async (ctx, args) => {
    const {session, state} = await getActiveSession(ctx, args.sessionId);
    if (state.outreachState !== 'approved') {
      throw new Error('Approve the controlled draft before applying a reply.');
    }
    if (
      !(await beginCommand(
        ctx,
        args.sessionId,
        args.commandId,
        'apply_fixture_reply',
        session.expiresAt,
      ))
    ) {
      return null;
    }
    const now = Date.now();
    await ctx.db.patch(state._id, {
      outreachState: 'replied',
      replyApplied: true,
      currentStage: 'compare',
      replayStep: Math.max(state.replayStep, 4),
      updatedAt: now,
    });
    await ctx.db.patch(session._id, {lastActivityAt: now});
    return null;
  },
});

export const setStage = mutation({
  args: {...SessionIdArg, stage: projectStageValidator, commandId: v.string()},
  returns: v.null(),
  handler: async (ctx, args) => {
    const {session, state} = await getActiveSession(ctx, args.sessionId);
    if (!(await beginCommand(ctx, args.sessionId, args.commandId, 'set_stage', session.expiresAt)))
      return null;
    const now = Date.now();
    await ctx.db.patch(state._id, {currentStage: args.stage, updatedAt: now});
    await ctx.db.patch(session._id, {lastActivityAt: now});
    return null;
  },
});

export const setPreferenceWeights = mutation({
  args: {...SessionIdArg, weights: rankingWeightsValidator, commandId: v.string()},
  returns: v.null(),
  handler: async (ctx, args) => {
    validateWeights(args.weights);
    const {session, state} = await getActiveSession(ctx, args.sessionId);
    if (
      !(await beginCommand(
        ctx,
        args.sessionId,
        args.commandId,
        'set_preference_weights',
        session.expiresAt,
      ))
    ) {
      return null;
    }
    const now = Date.now();
    await ctx.db.patch(state._id, {weights: args.weights, updatedAt: now});
    await ctx.db.patch(session._id, {lastActivityAt: now});
    return null;
  },
});

export const resetOwnDemo = mutation({
  args: {...SessionIdArg, commandId: v.string()},
  returns: v.null(),
  handler: async (ctx, args) => {
    const {session, state} = await getActiveSession(ctx, args.sessionId);
    if (!(await beginCommand(ctx, args.sessionId, args.commandId, 'reset_demo', session.expiresAt)))
      return null;
    const now = Date.now();
    const overrides = await ctx.db
      .query('demoRequirementOverrides')
      .withIndex('by_sessionId_and_requirementKey', (query) =>
        query.eq('sessionId', args.sessionId),
      )
      .take(101);
    const events = await ctx.db
      .query('demoSessionEvents')
      .withIndex('by_sessionId_and_occurredAt', (query) => query.eq('sessionId', args.sessionId))
      .take(101);
    if (overrides.length > 100 || events.length > 100) {
      throw new Error('Demo overlay exceeds the safe reset limit.');
    }
    await ctx.db.replace(state._id, {
      sessionId: state.sessionId,
      currentStage: 'brief',
      replayStep: 0,
      selectedSupplierIds: state.selectedSupplierIds,
      outreachState: 'draft',
      replyApplied: false,
      weights: DEFAULT_WEIGHTS,
      presentationMode: false,
      updatedAt: now,
    });
    for (const override of overrides) await ctx.db.delete(override._id);
    for (const event of events) await ctx.db.delete(event._id);
    await ctx.db.patch(session._id, {lastActivityAt: now});
    return null;
  },
});

export const trackProductEvent = mutation({
  args: {...SessionIdArg, eventType: productEventTypeValidator},
  returns: v.null(),
  handler: async (ctx, args) => {
    const {session} = await getActiveSession(ctx, args.sessionId);
    const existing = await ctx.db
      .query('productEvents')
      .withIndex('by_sessionId_and_eventType', (index) =>
        index.eq('sessionId', args.sessionId).eq('eventType', args.eventType),
      )
      .first();
    if (existing) return null;
    const baseline = await ctx.db.get(session.baselineId);
    const now = Date.now();
    await ctx.db.insert('productEvents', {
      sessionId: args.sessionId,
      ...(baseline ? {projectId: baseline.baselineProjectId} : {}),
      eventType: args.eventType,
      occurredAt: now,
      expiresAt: now + 30 * DAY,
    });
    return null;
  },
});

export const expireSession = internalMutation({
  args: {sessionId: v.string()},
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('demoSessions')
      .withIndex('by_sessionId', (query) => query.eq('sessionId', args.sessionId))
      .unique();
    if (!session || session.status === 'expired') return null;
    if (session.expiresAt > Date.now()) {
      await ctx.scheduler.runAt(session.expiresAt, internal.demo.expireSession, args);
      return null;
    }
    await ctx.db.patch(session._id, {status: 'expired'});
    const state = await ctx.db
      .query('demoSessionState')
      .withIndex('by_sessionId', (query) => query.eq('sessionId', args.sessionId))
      .unique();
    if (state) await ctx.db.delete(state._id);
    await ctx.scheduler.runAfter(0, internal.demo.cleanupExpiredSessionRows, {
      sessionId: args.sessionId,
      expectedExpiresAt: session.expiresAt,
    });
    return null;
  },
});

export const cleanupExpiredSessionRows = internalMutation({
  args: {sessionId: v.string(), expectedExpiresAt: v.number()},
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('demoSessions')
      .withIndex('by_sessionId', (query) => query.eq('sessionId', args.sessionId))
      .unique();
    if (!session || session.status !== 'expired' || session.expiresAt !== args.expectedExpiresAt)
      return null;
    const overrides = await ctx.db
      .query('demoRequirementOverrides')
      .withIndex('by_sessionId_and_requirementKey', (query) =>
        query.eq('sessionId', args.sessionId),
      )
      .take(100);
    for (const override of overrides) await ctx.db.delete(override._id);
    const events = await ctx.db
      .query('demoSessionEvents')
      .withIndex('by_sessionId_and_occurredAt', (query) => query.eq('sessionId', args.sessionId))
      .take(100);
    for (const event of events) await ctx.db.delete(event._id);
    const idempotencyRecords = await ctx.db
      .query('idempotencyRecords')
      .withIndex('by_subjectKey', (query) => query.eq('subjectKey', args.sessionId))
      .take(100);
    for (const record of idempotencyRecords) await ctx.db.delete(record._id);
    if (overrides.length === 100 || events.length === 100 || idempotencyRecords.length === 100) {
      await ctx.scheduler.runAfter(0, internal.demo.cleanupExpiredSessionRows, args);
      return null;
    }
    await ctx.db.delete(session._id);
    return null;
  },
});
