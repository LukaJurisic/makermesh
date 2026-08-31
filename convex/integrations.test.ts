// @vitest-environment edge-runtime
/// <reference types="vite/client" />

import rateLimiterTest from '@convex-dev/rate-limiter/test';
import {convexTest} from 'convex-test';
import {describe, expect, it, vi} from 'vitest';
import {api, internal} from './_generated/api';
import schema from './schema';

const modules = import.meta.glob('./**/*.ts');

async function sha256Hex(value: string) {
  const digest = new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)),
  );
  return [...digest].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function setup() {
  const t = convexTest(schema, modules);
  rateLimiterTest.register(t);
  const baseline = await t.mutation(internal.seed.ensureDemoBaseline, {});
  return {t, baseline};
}

async function withOperator(t: Awaited<ReturnType<typeof setup>>['t']) {
  const userId = await t.run(async (ctx) => {
    const userId = await ctx.db.insert('users', {name: 'Integration operator'});
    await ctx.db.insert('operatorProfiles', {
      authUserId: userId,
      role: 'operator',
      createdAt: 1,
      updatedAt: 1,
    });
    return userId;
  });
  return t.withIdentity({subject: `${userId}|integration-session`});
}

describe('Firecrawl boundary', () => {
  it('blocks unauthenticated and demo-baseline research before a provider call', async () => {
    vi.stubEnv('PUBLIC_LIVE_RESEARCH', 'true');
    const {t, baseline} = await setup();
    const briefId = await t.run(async (ctx) => {
      const brief = await ctx.db
        .query('briefs')
        .withIndex('by_projectId_and_version', (index) =>
          index.eq('projectId', baseline.projectId).eq('version', 1),
        )
        .unique();
      return brief!._id;
    });
    const args = {
      projectId: baseline.projectId,
      briefId,
      query: 'custom restaurant tableware Morocco',
      crawlUrl: 'https://example.com/ceramics',
      requestId: 'firecrawl-integration-lock-001',
    };
    await expect(t.action(api.researchFirecrawl.start, args)).rejects.toThrow();
    const operator = await withOperator(t);
    await expect(operator.action(api.researchFirecrawl.start, args)).rejects.toThrow(
      'live project',
    );
    vi.unstubAllEnvs();
  });

  it('reserves one live operation and handles the durable completion callback', async () => {
    const {t} = await setup();
    const {projectId, briefId} = await t.run(async (ctx) => {
      const projectId = await ctx.db.insert('projects', {
        title: 'Live integration test',
        slug: 'live-integration-test',
        buyerName: 'Controlled test buyer',
        destination: 'Toronto, Canada',
        defaultCurrency: 'CAD',
        status: 'brief_ready',
        dataMode: 'live',
        demoMode: true,
        presentationMode: false,
        createdAt: 1,
        updatedAt: 1,
      });
      const briefId = await ctx.db.insert('briefs', {
        projectId,
        version: 1,
        rawRequest: 'Controlled integration test brief',
        productName: 'Ceramic cups',
        productCategory: 'custom Moroccan ceramics',
        quantity: 200,
        unit: 'cups',
        destination: 'Toronto, Canada',
        budget: 3_500,
        budgetCurrency: 'CAD',
        deadlineDays: 42,
        customization: 'Logo',
        approvedAt: 1,
        promptVersion: 'test.v1',
        createdAt: 1,
      });
      await ctx.db.patch(projectId, {currentApprovedBriefId: briefId});
      return {projectId, briefId};
    });
    const reservationArgs = {
      projectId,
      briefId,
      query: 'custom restaurant tableware Morocco',
      crawlUrl: 'https://example.com/ceramics',
      idempotencyKey: 'firecrawl-reservation-test-001',
      requestHash: 'a'.repeat(64),
    };
    const first = await t.mutation(internal.researchFirecrawl.reserveOperation, reservationArgs);
    const second = await t.mutation(internal.researchFirecrawl.reserveOperation, reservationArgs);
    expect(first.created).toBe(true);
    expect(second).toMatchObject({
      created: false,
      operationId: first.operationId,
      discoveryRunId: first.discoveryRunId,
    });
    await expect(
      t.mutation(internal.researchFirecrawl.reserveOperation, {
        ...reservationArgs,
        requestHash: 'b'.repeat(64),
      }),
    ).rejects.toThrow('different scope');
    await t.mutation(internal.researchFirecrawl.onCrawlComplete, {
      crawlId: 'crawl-mismatched-attempt',
      status: 'completed',
      pageCount: 99,
      context: {
        projectId,
        briefId,
        operationId: first.operationId,
        discoveryRunId: first.discoveryRunId,
        attempt: first.attempt + 1,
      },
    });
    const beforeValidCallback = await t.run(async (ctx) =>
      ctx.db.get('discoveryRuns', first.discoveryRunId),
    );
    expect(beforeValidCallback).toMatchObject({status: 'queued', resultCount: 0});
    const failedCallback = {
      crawlId: 'crawl-test-001',
      jobId: 'job-test-001',
      status: 'failed' as const,
      pageCount: 0,
      context: {
        projectId,
        briefId,
        operationId: first.operationId,
        discoveryRunId: first.discoveryRunId,
        attempt: first.attempt,
      },
    };
    await t.mutation(internal.researchFirecrawl.onCrawlComplete, failedCallback);
    await t.mutation(internal.researchFirecrawl.onCrawlComplete, failedCallback);
    await t.run(async (ctx) => {
      await ctx.db.patch(first.operationId, {status: 'running', errorCode: undefined});
      await ctx.db.patch(first.discoveryRunId, {
        status: 'crawling',
        errorCode: undefined,
        completedAt: undefined,
      });
      await ctx.db.patch(projectId, {status: 'researching'});
    });
    await t.mutation(internal.researchFirecrawl.onCrawlComplete, {
      crawlId: 'crawl-test-001',
      jobId: 'job-test-001',
      status: 'completed',
      pageCount: 5,
      context: {
        projectId,
        briefId,
        operationId: first.operationId,
        discoveryRunId: first.discoveryRunId,
        attempt: first.attempt,
      },
    });
    await t.mutation(internal.researchFirecrawl.onCrawlComplete, {
      crawlId: 'crawl-test-001',
      jobId: 'job-test-001',
      status: 'completed',
      pageCount: 5,
      context: {
        projectId,
        briefId,
        operationId: first.operationId,
        discoveryRunId: first.discoveryRunId,
        attempt: first.attempt,
      },
    });
    const {run, project, usage} = await t.run(async (ctx) => ({
      run: await ctx.db.get('discoveryRuns', first.discoveryRunId),
      project: await ctx.db.get('projects', projectId),
      usage: await ctx.db
        .query('usageEvents')
        .withIndex('by_discoveryRunId', (index) => index.eq('discoveryRunId', first.discoveryRunId))
        .take(10),
    }));
    expect(run).toMatchObject({status: 'completed', resultCount: 5});
    expect(project?.status).toBe('reviewing_candidates');
    expect(usage).toEqual([
      expect.objectContaining({
        provider: 'firecrawl',
        operation: 'search_and_durable_crawl',
        status: 'completed',
      }),
    ]);
    await expect(
      t.mutation(internal.researchFirecrawl.markCrawlStarted, {
        operationId: first.operationId,
        discoveryRunId: first.discoveryRunId,
        crawlId: 'crawl-test-001',
        jobId: 'job-test-001',
        resultCount: 5,
        attempt: first.attempt,
      }),
    ).resolves.toBe(false);
    const afterLatePersistence = await t.run(async (ctx) =>
      ctx.db.get('discoveryRuns', first.discoveryRunId),
    );
    expect(afterLatePersistence?.status).toBe('completed');
  });

  it('preserves the resume counter across callbacks and rejects a fourth resume', async () => {
    const {t} = await setup();
    const ids = await t.run(async (ctx) => {
      const projectId = await ctx.db.insert('projects', {
        title: 'Firecrawl resume limit',
        slug: 'firecrawl-resume-limit',
        buyerName: 'Controlled buyer',
        destination: 'Toronto, Canada',
        defaultCurrency: 'CAD',
        status: 'error',
        dataMode: 'live',
        demoMode: true,
        presentationMode: false,
        createdAt: 1,
        updatedAt: 1,
      });
      const briefId = await ctx.db.insert('briefs', {
        projectId,
        version: 1,
        rawRequest: 'Controlled Firecrawl resume test',
        productName: 'Ceramic cups',
        productCategory: 'custom Moroccan ceramics',
        quantity: 200,
        unit: 'cups',
        destination: 'Toronto, Canada',
        budget: 3_500,
        budgetCurrency: 'CAD',
        deadlineDays: 42,
        customization: 'Logo',
        approvedAt: 1,
        promptVersion: 'test.v1',
        createdAt: 1,
      });
      await ctx.db.patch(projectId, {currentApprovedBriefId: briefId});
      const idempotencyKey = `firecrawl:research:${projectId}:${briefId}:resume-limit-001`;
      const requestHash = 'e'.repeat(64);
      const operationId = await ctx.db.insert('externalOperations', {
        projectId,
        briefId,
        provider: 'firecrawl',
        operation: 'search_and_durable_crawl',
        idempotencyKey,
        scopeKey: `${projectId}:${briefId}`,
        requestHash,
        attempt: 1,
        leaseExpiresAt: 1,
        sideEffectStartedAt: 1,
        status: 'failed',
        externalReference: 'crawl-resume-limit',
        safeMetadata: {resumeCount: 3},
        createdAt: 1,
        updatedAt: 1,
      });
      const discoveryRunId = await ctx.db.insert('discoveryRuns', {
        projectId,
        briefId,
        provider: 'firecrawl',
        query: 'custom restaurant tableware Morocco',
        crawlUrl: 'https://example.com/ceramics',
        status: 'failed',
        idempotencyKey,
        startedAt: 1,
        completedAt: 1,
        resultCount: 0,
        externalReference: 'crawl-resume-limit',
      });
      return {projectId, briefId, operationId, discoveryRunId, idempotencyKey, requestHash};
    });
    await t.mutation(internal.researchFirecrawl.onCrawlComplete, {
      crawlId: 'crawl-resume-limit',
      status: 'failed',
      pageCount: 0,
      context: {
        projectId: ids.projectId,
        briefId: ids.briefId,
        operationId: ids.operationId,
        discoveryRunId: ids.discoveryRunId,
        attempt: 1,
      },
    });
    const operation = await t.run((ctx) => ctx.db.get('externalOperations', ids.operationId));
    expect(operation?.safeMetadata.resumeCount).toBe(3);
    await expect(
      t.mutation(internal.researchFirecrawl.reserveOperation, {
        projectId: ids.projectId,
        briefId: ids.briefId,
        query: 'custom restaurant tableware Morocco',
        crawlUrl: 'https://example.com/ceramics',
        idempotencyKey: ids.idempotencyKey,
        requestHash: ids.requestHash,
      }),
    ).rejects.toThrow('resume limit');
  });
});

describe('controlled smoke project boundary', () => {
  it('requires an operator and creates the live project idempotently', async () => {
    const {t} = await setup();
    await expect(t.mutation(api.projects.ensureControlledSmokeProject, {})).rejects.toThrow(
      'Unauthenticated',
    );
    const operator = await withOperator(t);
    const first = await operator.mutation(api.projects.ensureControlledSmokeProject, {});
    const second = await operator.mutation(api.projects.ensureControlledSmokeProject, {});
    expect(first.created).toBe(true);
    expect(second).toEqual({projectId: first.projectId, created: false});
    const project = await t.run((ctx) => ctx.db.get('projects', first.projectId));
    expect(project).toMatchObject({status: 'draft', dataMode: 'live', demoMode: true});
  });
});

describe('AgentMail boundary', () => {
  it('blocks sending from the fixture baseline before the component is invoked', async () => {
    const {t, baseline} = await setup();
    const draftId = await t.run(async (ctx) => {
      const draft = await ctx.db
        .query('outreachDrafts')
        .withIndex('by_projectId_and_status', (index) =>
          index.eq('projectId', baseline.projectId).eq('status', 'delivered'),
        )
        .unique();
      return draft!._id;
    });
    await expect(
      t.mutation(api.agentMail.sendApproved, {outreachDraftId: draftId}),
    ).rejects.toThrow();
    const operator = await withOperator(t);
    await expect(
      operator.mutation(api.agentMail.sendApproved, {outreachDraftId: draftId}),
    ).rejects.toThrow('Controlled outreach draft scope is invalid');
  });

  it('quarantines a legacy generic inbound callback without duplicating app state', async () => {
    const {t} = await setup();
    const recipient = 'controlled-reply@example.test';
    vi.stubEnv('AGENTMAIL_INBOX_ID', 'inbox-test');
    vi.stubEnv('CONTROLLED_OUTREACH_ALLOWLIST_HASHES', await sha256Hex(recipient));
    const ids = await t.run(async (ctx) => {
      const supplier = await ctx.db
        .query('supplierEntities')
        .withIndex('by_slug', (index) => index.eq('slug', 'atlas-clay-studio'))
        .unique();
      const projectId = await ctx.db.insert('projects', {
        title: 'Live inbound test',
        slug: 'live-inbound-test',
        buyerName: 'Controlled buyer',
        destination: 'Toronto, Canada',
        defaultCurrency: 'CAD',
        status: 'awaiting_replies',
        dataMode: 'live',
        demoMode: true,
        presentationMode: false,
        createdAt: 1,
        updatedAt: 1,
      });
      const briefId = await ctx.db.insert('briefs', {
        projectId,
        version: 1,
        rawRequest: 'Controlled inbound test brief',
        productName: 'Ceramic cups',
        productCategory: 'custom Moroccan ceramics',
        quantity: 200,
        unit: 'cups',
        destination: 'Toronto, Canada',
        budget: 3_500,
        budgetCurrency: 'CAD',
        deadlineDays: 42,
        customization: 'Logo',
        approvedAt: 1,
        promptVersion: 'test.v1',
        createdAt: 1,
      });
      await ctx.db.patch(projectId, {currentApprovedBriefId: briefId});
      await ctx.db.insert('projectSuppliers', {
        projectId,
        supplierId: supplier!._id,
        stage: 'contacted',
        eligibility: 'provisionally_unqualified',
        preferenceFit: 0,
        evidenceCoverage: 0,
        commercialCompleteness: 0,
        openQuestionCount: 2,
        latestActivityAt: 1,
      });
      const draftId = await ctx.db.insert('outreachDrafts', {
        projectId,
        briefId,
        supplierId: supplier!._id,
        recipient,
        recipientSource: 'test',
        subject: 'Controlled test',
        bodyEnglish: 'Test',
        bodyLocalized: 'Test',
        language: 'fr',
        questionKeys: [],
        status: 'delivered',
        idempotencyKey: 'agentmail-inbound-test-draft',
        approvedAt: 1,
        sentAt: 1,
        agentMailOutboundId: 'outbound-test-001',
      });
      const threadId = await ctx.db.insert('mailThreads', {
        projectId,
        briefId,
        supplierId: supplier!._id,
        outreachDraftId: draftId,
        agentMailOutboundId: 'outbound-test-001',
        agentMailInboxId: 'inbox-test',
        agentMailThreadId: 'thread-test-001',
        inboundProcessedCount: 0,
        status: 'delivered',
        latestMessageAt: 1,
      });
      return {projectId, draftId, threadId};
    });
    const callback = {
      message: {
        inbox_id: 'inbox-test',
        thread_id: 'thread-test-001',
        message_id: 'message-test-001',
        from: recipient,
        to: 'makermesh@invalid.example',
        subject: 'Re: Controlled test',
        text: 'Fictional French reply fixture.',
        timestamp: '2026-08-29T15:00:00Z',
      },
      thread: {},
      eventId: 'event-test-inbound-001',
    };
    await t.mutation(internal.agentMail.onMessageReceived, {
      ...callback,
      message: {...callback.message, inbox_id: 'wrong-inbox', message_id: 'wrong-inbox-message'},
      eventId: 'event-wrong-inbox-001',
    });
    await t.mutation(internal.agentMail.onMessageReceived, {
      ...callback,
      message: {
        ...callback.message,
        message_id: 'wrong-sender-message',
        from: 'unexpected@example.test',
      },
      eventId: 'event-wrong-sender-001',
    });
    await t.run(async (ctx) => {
      await ctx.db.patch(ids.projectId, {currentApprovedBriefId: undefined});
    });
    await t.mutation(internal.agentMail.onMessageReceived, {
      ...callback,
      message: {...callback.message, message_id: 'stale-brief-message'},
      eventId: 'event-stale-brief-001',
    });
    await t.run(async (ctx) => {
      const draft = await ctx.db.get('outreachDrafts', ids.draftId);
      await ctx.db.patch(ids.projectId, {currentApprovedBriefId: draft!.briefId});
    });
    const beforeAccepted = await t.run(async (ctx) => {
      const thread = await ctx.db.get('mailThreads', ids.threadId);
      const operations = await ctx.db
        .query('externalOperations')
        .withIndex('by_projectId', (index) => index.eq('projectId', ids.projectId))
        .take(10);
      return {threadStatus: thread?.status, operationCount: operations.length};
    });
    expect(beforeAccepted).toEqual({threadStatus: 'delivered', operationCount: 0});
    await t.mutation(internal.agentMail.onMessageReceived, callback);
    await t.mutation(internal.agentMail.onMessageReceived, callback);
    const result = await t.run(async (ctx) => {
      const thread = await ctx.db.get('mailThreads', ids.threadId);
      const draft = await ctx.db.get('outreachDrafts', ids.draftId);
      const idempotency = await ctx.db
        .query('idempotencyRecords')
        .withIndex('by_key', (index) =>
          index.eq('key', 'agentmail:inbound:inbox-test:message-test-001'),
        )
        .unique();
      return {
        threadStatus: thread?.status,
        draftStatus: draft?.status,
        idempotent: Boolean(idempotency),
        decisionScope: idempotency?.scope,
      };
    });
    expect(result).toEqual({
      threadStatus: 'delivered',
      draftStatus: 'delivered',
      idempotent: true,
      decisionScope: 'agentmail_quarantine',
    });
  });
});
