import {v} from 'convex/values';
import {mutation} from './_generated/server';
import {DEMO_BASELINE_SLUG} from './fixtures/demoData';
import {CONTROLLED_SMOKE_SLUG} from './model/controlledDemo';
import {requireOperator} from './model/requireOperator';

const MAX_SOURCE_OPERATIONS = 10;
const MAX_SOURCE_USAGE_EVENTS = 20;
const MAX_SOURCE_CLAIMS = 50;
const MAX_CAPTURE_EVENTS = 2;

const captureStatusValidator = v.union(
  v.literal('published'),
  v.literal('retired'),
  v.literal('draft'),
);

function validateExistingCapture(
  baseline: {
    sourceMode: 'fixture' | 'captured_live';
    captureScope?: 'research_only';
    captureSourceProjectId?: string;
    captureSourceBriefId?: string;
    captureSourceOpenAIOperationId?: string;
    captureSourceRunId?: string;
    captureEvents?: Array<{provider: string; operation: string}>;
  },
  expected: {
    projectId: string;
    briefId: string;
    openAIOperationId: string;
    discoveryRunId: string;
  },
) {
  if (
    baseline.sourceMode !== 'captured_live' ||
    baseline.captureScope !== 'research_only' ||
    baseline.captureSourceProjectId !== expected.projectId ||
    baseline.captureSourceBriefId !== expected.briefId ||
    baseline.captureSourceOpenAIOperationId !== expected.openAIOperationId ||
    baseline.captureSourceRunId !== expected.discoveryRunId ||
    baseline.captureEvents?.length !== MAX_CAPTURE_EVENTS ||
    baseline.captureEvents[0]?.provider !== 'openai' ||
    baseline.captureEvents[0]?.operation !== 'compile_brief' ||
    baseline.captureEvents[1]?.provider !== 'firecrawl' ||
    baseline.captureEvents[1]?.operation !== 'search_and_durable_crawl'
  ) {
    throw new Error('Existing captured research proof has inconsistent provenance.');
  }
}

export const captureResearchProof = mutation({
  args: {discoveryRunId: v.id('discoveryRuns')},
  returns: v.object({
    baselineId: v.id('demoBaselines'),
    version: v.number(),
    created: v.boolean(),
    status: captureStatusValidator,
  }),
  handler: async (ctx, args) => {
    await requireOperator(ctx);
    const run = await ctx.db.get(args.discoveryRunId);
    if (
      !run ||
      run.provider !== 'firecrawl' ||
      run.status !== 'completed' ||
      run.completedAt === undefined ||
      !run.externalReference ||
      !Number.isFinite(run.resultCount) ||
      !Number.isInteger(run.resultCount) ||
      run.resultCount < 1 ||
      run.resultCount > 10
    ) {
      throw new Error('Only a completed controlled Firecrawl run can be captured.');
    }
    const project = await ctx.db.get(run.projectId);
    if (
      !project ||
      project.slug !== CONTROLLED_SMOKE_SLUG ||
      project.dataMode !== 'live' ||
      !project.demoMode ||
      project.status !== 'reviewing_candidates' ||
      project.currentApprovedBriefId !== run.briefId
    ) {
      throw new Error('The discovery run is outside the controlled research-only project scope.');
    }
    const brief = await ctx.db.get(run.briefId);
    if (
      !brief ||
      brief.projectId !== project._id ||
      brief.approvedAt === undefined ||
      !brief.extractionModel ||
      /fixture|manual/iu.test(brief.promptVersion)
    ) {
      throw new Error('The controlled live brief lacks auditable OpenAI provenance.');
    }

    const operations = await ctx.db
      .query('externalOperations')
      .withIndex('by_provider_and_operation_and_projectId_and_idempotencyKey', (index) =>
        index
          .eq('provider', 'openai')
          .eq('operation', 'compile_brief')
          .eq('projectId', project._id),
      )
      .take(MAX_SOURCE_OPERATIONS + 1);
    if (operations.length > MAX_SOURCE_OPERATIONS) {
      throw new Error('Controlled OpenAI operation history exceeds the capture limit.');
    }
    const openAIOperation = operations.find(
      (operation) =>
        operation.status === 'completed' && operation.resultReference === String(brief._id),
    );
    if (!openAIOperation) throw new Error('Completed OpenAI brief operation is missing.');

    const usageEvents = await ctx.db
      .query('usageEvents')
      .withIndex('by_projectId_and_occurredAt', (index) => index.eq('projectId', project._id))
      .take(MAX_SOURCE_USAGE_EVENTS + 1);
    if (usageEvents.length > MAX_SOURCE_USAGE_EVENTS) {
      throw new Error('Controlled usage history exceeds the capture limit.');
    }
    const openAIUsage = usageEvents.find(
      (event) =>
        event.provider === 'openai' &&
        event.operation === 'compile_brief' &&
        event.status === 'completed' &&
        !event.cached,
    );
    if (!openAIUsage) throw new Error('Completed non-cached OpenAI usage proof is missing.');
    if (usageEvents.some((event) => event.provider === 'agentmail')) {
      throw new Error('Research-only capture cannot include AgentMail usage.');
    }

    const firecrawlUsage = await ctx.db
      .query('usageEvents')
      .withIndex('by_discoveryRunId', (index) => index.eq('discoveryRunId', run._id))
      .unique();
    if (
      !firecrawlUsage ||
      firecrawlUsage.projectId !== project._id ||
      firecrawlUsage.provider !== 'firecrawl' ||
      firecrawlUsage.operation !== 'search_and_durable_crawl' ||
      firecrawlUsage.status !== 'completed' ||
      firecrawlUsage.cached
    ) {
      throw new Error('Completed non-cached Firecrawl usage proof is missing.');
    }

    const [outreach, thread, quote, sourceClaims] = await Promise.all([
      ctx.db
        .query('outreachDrafts')
        .withIndex('by_projectId_and_status', (index) => index.eq('projectId', project._id))
        .take(1),
      ctx.db
        .query('mailThreads')
        .withIndex('by_projectId_and_supplierId', (index) => index.eq('projectId', project._id))
        .take(1),
      ctx.db
        .query('quotes')
        .withIndex('by_projectId_and_supplierId', (index) => index.eq('projectId', project._id))
        .take(1),
      ctx.db
        .query('capabilityClaims')
        .withIndex('by_projectId_and_supplierId', (index) => index.eq('projectId', project._id))
        .take(MAX_SOURCE_CLAIMS + 1),
    ]);
    if (sourceClaims.length > MAX_SOURCE_CLAIMS) {
      throw new Error('Controlled claim history exceeds the capture limit.');
    }
    if (
      outreach.length > 0 ||
      thread.length > 0 ||
      quote.length > 0 ||
      sourceClaims.some((claim) => claim.agentMailMessageId)
    ) {
      throw new Error('Research-only capture cannot include supplier outreach or reply data.');
    }

    const existing = await ctx.db
      .query('demoBaselines')
      .withIndex('by_captureSourceRunId', (index) => index.eq('captureSourceRunId', run._id))
      .unique();
    if (existing) {
      validateExistingCapture(existing, {
        projectId: String(project._id),
        briefId: String(brief._id),
        openAIOperationId: String(openAIOperation._id),
        discoveryRunId: String(run._id),
      });
      return {
        baselineId: existing._id,
        version: existing.version,
        created: false,
        status: existing.status,
      };
    }

    const published = await ctx.db
      .query('demoBaselines')
      .withIndex('by_slug_and_status', (index) =>
        index.eq('slug', DEMO_BASELINE_SLUG).eq('status', 'published'),
      )
      .take(2);
    if (published.length !== 1) {
      throw new Error('Exactly one published demo baseline is required before capture.');
    }
    const latest = await ctx.db
      .query('demoBaselines')
      .withIndex('by_slug_and_version', (index) => index.eq('slug', DEMO_BASELINE_SLUG))
      .order('desc')
      .first();
    if (!latest) throw new Error('Demo baseline history is missing.');

    const captureEvents = [
      {
        provider: 'openai' as const,
        operation: 'compile_brief' as const,
        label: 'OpenAI structured the controlled sourcing brief',
        occurredAt: openAIUsage.occurredAt,
      },
      {
        provider: 'firecrawl' as const,
        operation: 'search_and_durable_crawl' as const,
        label: `Firecrawl completed a durable crawl with ${run.resultCount} pages stored`,
        occurredAt: firecrawlUsage.occurredAt,
        resultCount: run.resultCount,
      },
    ].sort((left, right) => left.occurredAt - right.occurredAt);
    const version = latest.version + 1;
    const baselineId = await ctx.db.insert('demoBaselines', {
      slug: DEMO_BASELINE_SLUG,
      version,
      baselineProjectId: published[0]!.baselineProjectId,
      capturedAt: Date.now(),
      sourceMode: 'captured_live',
      captureLabel:
        'Live research proof captured from a controlled OpenAI brief compilation and Firecrawl crawl. The displayed maker network, sources, claims, metrics, quotes, email activity, and passport remain fictional demonstration fixtures; no supplier outreach is represented by this capture.',
      captureScope: 'research_only',
      captureSourceProjectId: project._id,
      captureSourceBriefId: brief._id,
      captureSourceOpenAIOperationId: openAIOperation._id,
      captureSourceRunId: run._id,
      captureEvents,
      status: 'published',
    });
    await ctx.db.patch(published[0]!._id, {status: 'retired'});
    return {baselineId, version, created: true, status: 'published' as const};
  },
});
