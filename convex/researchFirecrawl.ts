import {FirecrawlClient} from '@firecrawl/firecrawl-convex';
import {z} from 'zod';
import {v} from 'convex/values';
import {components, internal} from './_generated/api';
import type {Id} from './_generated/dataModel';
import {env, action, internalMutation, query} from './_generated/server';
import {
  requireCurrentApprovedBrief,
  requireLiveProjectStatus,
  transitionProject,
} from './model/projectState';
import {requireOperator} from './model/requireOperator';

const OPERATION_LEASE_MS = 5 * 60 * 1000;
const MAX_OPERATION_ATTEMPTS = 3;

const firecrawl = new FirecrawlClient(components.firecrawl);

type ResearchReservation = {
  created: boolean;
  operationId: Id<'externalOperations'>;
  discoveryRunId: Id<'discoveryRuns'>;
  existingCrawlId: string | null;
  attempt: number;
};

type StartResearchResult = {
  discoveryRunId: Id<'discoveryRuns'>;
  crawlId: string | null;
  reused: boolean;
};

const searchResponseSchema = z
  .object({
    web: z
      .array(
        z
          .object({
            url: z.string().url().optional(),
            title: z.string().optional(),
            description: z.string().optional(),
          })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough();

const progressValidator = v.union(
  v.null(),
  v.object({
    runId: v.id('discoveryRuns'),
    status: v.union(
      v.literal('queued'),
      v.literal('searching'),
      v.literal('crawling'),
      v.literal('extracting'),
      v.literal('deduplicating'),
      v.literal('completed'),
      v.literal('partially_completed'),
      v.literal('failed'),
      v.literal('cancelled'),
    ),
    query: v.string(),
    crawlUrl: v.union(v.null(), v.string()),
    resultCount: v.number(),
    crawl: v.union(
      v.null(),
      v.object({
        status: v.union(
          v.literal('scraping'),
          v.literal('completed'),
          v.literal('failed'),
          v.literal('cancelled'),
        ),
        total: v.union(v.null(), v.number()),
        completed: v.union(v.null(), v.number()),
        pageCount: v.number(),
        creditsUsed: v.union(v.null(), v.number()),
        unstored: v.union(v.null(), v.number()),
        truncated: v.boolean(),
        updatedAt: v.number(),
      }),
    ),
  }),
);

function assertPublicHttpsUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  if (url.protocol !== 'https:' || !url.hostname.includes('.')) {
    throw new Error('Crawl URL must be a public HTTPS URL.');
  }
  if (
    url.hostname === 'localhost' ||
    url.hostname.endsWith('.local') ||
    url.hostname.endsWith('.internal')
  ) {
    throw new Error('Private crawl targets are not permitted.');
  }
  const hostname = url.hostname.toLocaleLowerCase('en-US').replace(/^\[|\]$/gu, '');
  if (hostname.includes(':')) throw new Error('IP-literal crawl targets are not permitted.');
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/u.exec(hostname);
  if (ipv4) {
    const octets = ipv4.slice(1).map(Number);
    if (octets.some((octet) => octet > 255)) throw new Error('Invalid crawl target address.');
    const [first, second] = octets;
    if (
      first === 0 ||
      first === 10 ||
      first === 127 ||
      (first === 100 && second! >= 64 && second! <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second! >= 16 && second! <= 31) ||
      (first === 192 && second === 168)
    ) {
      throw new Error('Private crawl targets are not permitted.');
    }
  }
  return url.toString();
}

async function sha256Hex(value: string) {
  const digest = new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)),
  );
  return [...digest].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export const reserveOperation = internalMutation({
  args: {
    projectId: v.id('projects'),
    briefId: v.id('briefs'),
    query: v.string(),
    crawlUrl: v.string(),
    idempotencyKey: v.string(),
    requestHash: v.string(),
  },
  returns: v.object({
    created: v.boolean(),
    operationId: v.id('externalOperations'),
    discoveryRunId: v.id('discoveryRuns'),
    existingCrawlId: v.union(v.null(), v.string()),
    attempt: v.number(),
  }),
  handler: async (ctx, args): Promise<ResearchReservation> => {
    const existingOperation = await ctx.db
      .query('externalOperations')
      .withIndex('by_provider_and_operation_and_projectId_and_idempotencyKey', (index) =>
        index
          .eq('provider', 'firecrawl')
          .eq('operation', 'search_and_durable_crawl')
          .eq('projectId', args.projectId)
          .eq('idempotencyKey', args.idempotencyKey),
      )
      .unique();
    const existingRun = await ctx.db
      .query('discoveryRuns')
      .withIndex('by_projectId_and_briefId_and_idempotencyKey', (index) =>
        index
          .eq('projectId', args.projectId)
          .eq('briefId', args.briefId)
          .eq('idempotencyKey', args.idempotencyKey),
      )
      .unique();
    if (existingOperation && existingRun) {
      if (
        existingOperation.requestHash !== args.requestHash ||
        existingOperation.briefId !== args.briefId ||
        existingRun.query !== args.query ||
        existingRun.crawlUrl !== args.crawlUrl
      ) {
        throw new Error('The research request identifier was reused with different scope.');
      }
      const attempt = existingOperation.attempt ?? 1;
      if (existingOperation.status === 'completed') {
        return {
          created: false,
          operationId: existingOperation._id,
          discoveryRunId: existingRun._id,
          existingCrawlId: existingRun.externalReference ?? null,
          attempt,
        };
      }
      const now = Date.now();
      if (
        (existingOperation.status === 'queued' || existingOperation.status === 'running') &&
        (existingOperation.leaseExpiresAt ?? 0) > now
      ) {
        return {
          created: false,
          operationId: existingOperation._id,
          discoveryRunId: existingRun._id,
          existingCrawlId: existingRun.externalReference ?? null,
          attempt,
        };
      }
      const project = await ctx.db.get(args.projectId);
      requireLiveProjectStatus(project, ['researching', 'error'], 'Research retry');
      await requireCurrentApprovedBrief(ctx, project, args.briefId);
      if (existingRun.externalReference) {
        const resumeCount =
          typeof existingOperation.safeMetadata.resumeCount === 'number'
            ? existingOperation.safeMetadata.resumeCount
            : 0;
        if (resumeCount >= MAX_OPERATION_ATTEMPTS) {
          throw new Error('Research resume limit reached.');
        }
        const resumed = await firecrawl.resumeCrawl(ctx, existingRun.externalReference);
        if (resumed) {
          await ctx.db.patch(existingOperation._id, {
            status: 'running',
            leaseExpiresAt: now + OPERATION_LEASE_MS,
            errorCode: undefined,
            safeMetadata: {...existingOperation.safeMetadata, resumeCount: resumeCount + 1},
            updatedAt: now,
          });
          await ctx.db.patch(existingRun._id, {
            status: 'crawling',
            errorCode: undefined,
            completedAt: undefined,
          });
          if (project.status === 'error') {
            await transitionProject(ctx, project, 'researching', now);
          }
        } else {
          const crawl = await firecrawl.getCrawl(ctx, existingRun.externalReference);
          const reconciledStatus = crawl?.status === 'completed' ? 'completed' : 'failed';
          await ctx.db.patch(existingOperation._id, {
            status: reconciledStatus,
            errorCode:
              reconciledStatus === 'failed' ? 'FIRECRAWL_RECONCILIATION_REQUIRED' : undefined,
            safeMetadata: {...existingOperation.safeMetadata, resumeCount: resumeCount + 1},
            updatedAt: now,
          });
          await ctx.db.patch(existingRun._id, {
            status: reconciledStatus,
            resultCount: crawl?.pageCount ?? existingRun.resultCount,
            completedAt: now,
            errorCode:
              reconciledStatus === 'failed' ? 'FIRECRAWL_RECONCILIATION_REQUIRED' : undefined,
          });
          if (reconciledStatus === 'completed') {
            const researching =
              project.status === 'error'
                ? await transitionProject(ctx, project, 'researching', now)
                : project;
            if (researching.status === 'researching') {
              await transitionProject(ctx, researching, 'reviewing_candidates', now);
            }
          } else if (project.status === 'researching') {
            await transitionProject(ctx, project, 'error', now);
          }
        }
        return {
          created: false,
          operationId: existingOperation._id,
          discoveryRunId: existingRun._id,
          existingCrawlId: existingRun.externalReference,
          attempt,
        };
      }
      if (attempt >= MAX_OPERATION_ATTEMPTS) throw new Error('Research retry limit reached.');
      const nextAttempt = attempt + 1;
      if (existingOperation.sideEffectStartedAt) {
        throw new Error('Research external state is unknown and requires reconciliation.');
      }
      await ctx.db.patch(existingOperation._id, {
        status: 'queued',
        attempt: nextAttempt,
        leaseExpiresAt: now + OPERATION_LEASE_MS,
        errorCode: undefined,
        updatedAt: now,
      });
      await ctx.db.patch(existingRun._id, {
        status: 'queued',
        errorCode: undefined,
        completedAt: undefined,
        startedAt: now,
      });
      if (project.status === 'error') await transitionProject(ctx, project, 'researching', now);
      return {
        created: true,
        operationId: existingOperation._id,
        discoveryRunId: existingRun._id,
        existingCrawlId: null,
        attempt: nextAttempt,
      };
    }
    if (existingOperation || existingRun) {
      throw new Error('Research idempotency state is inconsistent.');
    }

    const project = await ctx.db.get(args.projectId);
    const brief = await ctx.db.get(args.briefId);
    requireLiveProjectStatus(project, ['brief_ready'], 'Live research');
    await requireCurrentApprovedBrief(ctx, project, args.briefId);
    if (!brief || brief._id !== args.briefId) throw new Error('Research brief is missing.');
    if (args.query.length < 8 || args.query.length > 240) throw new Error('Invalid search query.');
    if (args.idempotencyKey.length < 16 || args.idempotencyKey.length > 180) {
      throw new Error('Invalid research idempotency key.');
    }
    if (!/^[a-f0-9]{64}$/u.test(args.requestHash))
      throw new Error('Invalid research request hash.');

    const now = Date.now();
    const operationId = await ctx.db.insert('externalOperations', {
      projectId: project._id,
      provider: 'firecrawl',
      operation: 'search_and_durable_crawl',
      idempotencyKey: args.idempotencyKey,
      scopeKey: `${project._id}:${brief._id}`,
      briefId: brief._id,
      requestHash: args.requestHash,
      attempt: 1,
      leaseExpiresAt: now + OPERATION_LEASE_MS,
      status: 'queued',
      safeMetadata: {crawlHost: new URL(args.crawlUrl).hostname},
      createdAt: now,
      updatedAt: now,
    });
    const discoveryRunId = await ctx.db.insert('discoveryRuns', {
      projectId: project._id,
      briefId: brief._id,
      provider: 'firecrawl',
      query: args.query,
      crawlUrl: args.crawlUrl,
      status: 'queued',
      idempotencyKey: args.idempotencyKey,
      startedAt: now,
      resultCount: 0,
    });
    await transitionProject(ctx, project, 'researching', now);
    return {created: true, operationId, discoveryRunId, existingCrawlId: null, attempt: 1};
  },
});

export const markSearching = internalMutation({
  args: {
    operationId: v.id('externalOperations'),
    discoveryRunId: v.id('discoveryRuns'),
    attempt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const operation = await ctx.db.get(args.operationId);
    const run = await ctx.db.get(args.discoveryRunId);
    if (
      !operation ||
      !run ||
      operation.attempt !== args.attempt ||
      operation.projectId !== run.projectId ||
      operation.briefId !== run.briefId ||
      !['queued', 'running'].includes(operation.status)
    ) {
      throw new Error('Research operation attempt is stale.');
    }
    const now = Date.now();
    await ctx.db.patch(args.operationId, {
      status: 'running',
      leaseExpiresAt: now + OPERATION_LEASE_MS,
      updatedAt: now,
    });
    await ctx.db.patch(args.discoveryRunId, {status: 'searching'});
    return null;
  },
});

export const markCrawlSideEffectStarting = internalMutation({
  args: {operationId: v.id('externalOperations'), attempt: v.number()},
  returns: v.null(),
  handler: async (ctx, args) => {
    const operation = await ctx.db.get(args.operationId);
    if (!operation || operation.attempt !== args.attempt || operation.status !== 'running') {
      throw new Error('Research operation attempt is stale.');
    }
    const now = Date.now();
    await ctx.db.patch(operation._id, {
      sideEffectStartedAt: now,
      leaseExpiresAt: now + OPERATION_LEASE_MS,
      updatedAt: now,
    });
    return null;
  },
});

export const markCrawlStarted = internalMutation({
  args: {
    operationId: v.id('externalOperations'),
    discoveryRunId: v.id('discoveryRuns'),
    crawlId: v.string(),
    jobId: v.string(),
    resultCount: v.number(),
    attempt: v.number(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const operation = await ctx.db.get(args.operationId);
    const run = await ctx.db.get(args.discoveryRunId);
    if (
      !operation ||
      !run ||
      operation.attempt !== args.attempt ||
      operation.projectId !== run.projectId ||
      operation.briefId !== run.briefId
    ) {
      throw new Error('Research crawl persistence attempt is stale.');
    }
    if (
      ['completed', 'failed', 'cancelled'].includes(operation.status) ||
      ['completed', 'failed', 'cancelled'].includes(run.status)
    ) {
      return false;
    }
    if (operation.status !== 'running' || run.status !== 'searching') {
      throw new Error('Research crawl cannot start from the current state.');
    }
    const now = Date.now();
    await ctx.db.patch(args.operationId, {
      status: 'running',
      externalReference: args.crawlId,
      safeMetadata: {jobRegistered: Boolean(args.jobId)},
      updatedAt: now,
    });
    await ctx.db.patch(args.discoveryRunId, {
      status: 'crawling',
      externalReference: args.crawlId,
      resultCount: args.resultCount,
    });
    return true;
  },
});

export const markFailed = internalMutation({
  args: {
    operationId: v.id('externalOperations'),
    discoveryRunId: v.id('discoveryRuns'),
    errorCode: v.string(),
    attempt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const operation = await ctx.db.get(args.operationId);
    const run = await ctx.db.get(args.discoveryRunId);
    if (
      !operation ||
      !run ||
      operation.attempt !== args.attempt ||
      operation.status === 'completed'
    ) {
      return null;
    }
    const now = Date.now();
    await ctx.db.patch(args.operationId, {
      status: 'failed',
      errorCode: args.errorCode,
      updatedAt: now,
    });
    await ctx.db.patch(args.discoveryRunId, {
      status: 'failed',
      errorCode: args.errorCode,
      completedAt: now,
    });
    const project = await ctx.db.get(run.projectId);
    if (project && project.dataMode === 'live' && project.status === 'researching') {
      await transitionProject(ctx, project, 'error', now);
    }
    return null;
  },
});

export const start = action({
  args: {
    projectId: v.id('projects'),
    briefId: v.id('briefs'),
    query: v.string(),
    crawlUrl: v.string(),
    requestId: v.string(),
  },
  returns: v.object({
    discoveryRunId: v.id('discoveryRuns'),
    crawlId: v.union(v.null(), v.string()),
    reused: v.boolean(),
  }),
  handler: async (ctx, args): Promise<StartResearchResult> => {
    await ctx.runQuery(internal.operatorAuth.assertCurrent, {});
    if (env.PUBLIC_LIVE_RESEARCH !== 'true') throw new Error('Live research is locked.');
    const crawlUrl = assertPublicHttpsUrl(args.crawlUrl);
    if (!/^[a-zA-Z0-9_-]{8,80}$/u.test(args.requestId)) {
      throw new Error('Research request identifier is invalid.');
    }
    const requestHash = await sha256Hex(
      JSON.stringify({briefId: args.briefId, query: args.query, crawlUrl}),
    );
    const idempotencyKey = `firecrawl:research:${args.projectId}:${args.briefId}:${args.requestId}`;
    const reservation: ResearchReservation = await ctx.runMutation(
      internal.researchFirecrawl.reserveOperation,
      {
        projectId: args.projectId,
        briefId: args.briefId,
        query: args.query,
        crawlUrl,
        idempotencyKey,
        requestHash,
      },
    );
    if (!reservation.created) {
      return {
        discoveryRunId: reservation.discoveryRunId,
        crawlId: reservation.existingCrawlId,
        reused: true,
      };
    }

    await ctx.runMutation(internal.researchFirecrawl.markSearching, {
      operationId: reservation.operationId,
      discoveryRunId: reservation.discoveryRunId,
      attempt: reservation.attempt,
    });
    let crawlSideEffectStarted = false;
    try {
      const rawSearch = await firecrawl.search(ctx, args.query, {
        limit: 8,
        location: 'Morocco',
        scrapeOptions: {formats: ['markdown'], onlyMainContent: true},
      });
      const search = searchResponseSchema.parse(rawSearch);
      const resultCount = search.web?.length ?? 0;
      const mode = env.CONVEX_SITE_URL.includes('127.0.0.1') ? 'poll' : 'webhook';
      await ctx.runMutation(internal.researchFirecrawl.markCrawlSideEffectStarting, {
        operationId: reservation.operationId,
        attempt: reservation.attempt,
      });
      crawlSideEffectStarted = true;
      const {crawlId, jobId} = await firecrawl.startCrawl(ctx, {
        url: crawlUrl,
        mode,
        options: {
          limit: 5,
          maxDiscoveryDepth: 2,
          allowExternalLinks: false,
          allowSubdomains: false,
          deduplicateSimilarURLs: true,
          ignoreQueryParameters: true,
          maxConcurrency: 2,
          scrapeOptions: {formats: ['markdown'], onlyMainContent: true},
        },
        onComplete: internal.researchFirecrawl.onCrawlComplete,
        context: {
          projectId: args.projectId,
          operationId: reservation.operationId,
          discoveryRunId: reservation.discoveryRunId,
          briefId: args.briefId,
          attempt: reservation.attempt,
        },
      });
      await ctx.runMutation(internal.researchFirecrawl.markCrawlStarted, {
        operationId: reservation.operationId,
        discoveryRunId: reservation.discoveryRunId,
        crawlId,
        jobId,
        resultCount,
        attempt: reservation.attempt,
      });
      return {discoveryRunId: reservation.discoveryRunId, crawlId, reused: false};
    } catch (error) {
      await ctx.runMutation(internal.researchFirecrawl.markFailed, {
        operationId: reservation.operationId,
        discoveryRunId: reservation.discoveryRunId,
        attempt: reservation.attempt,
        errorCode:
          error instanceof z.ZodError
            ? 'INVALID_PROVIDER_RESPONSE'
            : crawlSideEffectStarted
              ? 'EXTERNAL_STATE_UNKNOWN'
              : 'FIRECRAWL_REQUEST_FAILED',
      });
      throw new Error('Firecrawl research failed. Inspect the stored operation for safe details.');
    }
  },
});

export const onCrawlComplete = internalMutation({
  args: {
    crawlId: v.string(),
    jobId: v.optional(v.string()),
    status: v.union(v.literal('completed'), v.literal('failed'), v.literal('cancelled')),
    pageCount: v.number(),
    unstored: v.optional(v.number()),
    error: v.optional(v.string()),
    context: v.optional(
      v.object({
        projectId: v.id('projects'),
        briefId: v.id('briefs'),
        operationId: v.id('externalOperations'),
        discoveryRunId: v.id('discoveryRuns'),
        attempt: v.number(),
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!args.context) throw new Error('Firecrawl callback context is missing.');
    const operation = await ctx.db.get(args.context.operationId);
    const run = await ctx.db.get(args.context.discoveryRunId);
    if (
      !operation ||
      !run ||
      operation.provider !== 'firecrawl' ||
      operation.operation !== 'search_and_durable_crawl' ||
      operation.projectId !== args.context.projectId ||
      operation.briefId !== args.context.briefId ||
      operation.attempt !== args.context.attempt ||
      run.projectId !== args.context.projectId ||
      run.briefId !== args.context.briefId ||
      (operation.externalReference && operation.externalReference !== args.crawlId) ||
      (run.externalReference && run.externalReference !== args.crawlId)
    ) {
      return null;
    }
    const scopedProject = await ctx.db.get(args.context.projectId);
    if (
      !scopedProject ||
      scopedProject.dataMode !== 'live' ||
      scopedProject.currentApprovedBriefId !== args.context.briefId ||
      !['researching', 'error'].includes(scopedProject.status)
    ) {
      return null;
    }
    if (operation.status === 'completed') return null;
    const now = Date.now();
    const terminalStatus = args.status === 'completed' ? 'completed' : args.status;
    await ctx.db.patch(args.context.operationId, {
      status: terminalStatus,
      ...(args.status === 'failed' ? {errorCode: 'FIRECRAWL_CRAWL_FAILED'} : {}),
      externalReference: operation.externalReference ?? args.crawlId,
      safeMetadata: {
        ...operation.safeMetadata,
        pageCount: args.pageCount,
        unstored: args.unstored ?? 0,
        truncated: Boolean(args.unstored),
      },
      updatedAt: now,
    });
    await ctx.db.patch(args.context.discoveryRunId, {
      status: args.status,
      completedAt: now,
      resultCount: args.pageCount,
      ...(args.status === 'failed' ? {errorCode: 'FIRECRAWL_CRAWL_FAILED'} : {}),
      externalReference: run.externalReference ?? args.crawlId,
    });
    await ctx.db.insert('activityEvents', {
      projectId: args.context.projectId,
      provider: 'firecrawl',
      eventType: `crawl_${args.status}`,
      label: `Firecrawl ${args.status}: ${args.pageCount} pages stored`,
      status: terminalStatus,
      safeMetadata: {pageCount: args.pageCount, unstored: args.unstored ?? 0},
      occurredAt: now,
      publicSafe: false,
    });
    const project = scopedProject;
    if (project && project.dataMode === 'live') {
      if (args.status === 'completed' && project.status === 'error') {
        const researching = await transitionProject(ctx, project, 'researching', now);
        await transitionProject(ctx, researching, 'reviewing_candidates', now);
      } else if (project.status === 'researching') {
        await transitionProject(
          ctx,
          project,
          args.status === 'completed' ? 'reviewing_candidates' : 'error',
          now,
        );
      }
    }
    return null;
  },
});

export const getProgress = query({
  args: {discoveryRunId: v.id('discoveryRuns')},
  returns: progressValidator,
  handler: async (ctx, args) => {
    await requireOperator(ctx);
    const run = await ctx.db.get(args.discoveryRunId);
    if (!run) return null;
    const crawl = run.externalReference
      ? await firecrawl.getCrawl(ctx, run.externalReference)
      : null;
    return {
      runId: run._id,
      status: run.status,
      query: run.query,
      crawlUrl: run.crawlUrl ?? null,
      resultCount: run.resultCount,
      crawl: crawl
        ? {
            status: crawl.status,
            total: crawl.total ?? null,
            completed: crawl.completed ?? null,
            pageCount: crawl.pageCount,
            creditsUsed: crawl.creditsUsed ?? null,
            unstored: crawl.unstored ?? null,
            truncated: Boolean(crawl.unstored),
            updatedAt: crawl.updatedAt,
          }
        : null,
    };
  },
});
