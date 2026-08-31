// @vitest-environment edge-runtime
/// <reference types="vite/client" />

import {convexTest} from 'convex-test';
import type {SessionId} from 'convex-helpers/server/sessions';
import rateLimiterTest from '@convex-dev/rate-limiter/test';
import {describe, expect, it} from 'vitest';
import {api, internal} from './_generated/api';
import {CONTROLLED_SMOKE_SLUG} from './model/controlledDemo';
import schema from './schema';

const modules = import.meta.glob('./**/*.ts');
const sessionId = (value: string) => value as SessionId;

async function setupCaptureProof() {
  const t = convexTest(schema, modules);
  rateLimiterTest.register(t);
  const fixture = await t.mutation(internal.seed.ensureDemoBaseline, {});
  const ids = await t.run(async (ctx) => {
    const userId = await ctx.db.insert('users', {name: 'Capture operator'});
    await ctx.db.insert('operatorProfiles', {
      authUserId: userId,
      role: 'operator',
      createdAt: 1,
      updatedAt: 1,
    });
    const projectId = await ctx.db.insert('projects', {
      title: 'Controlled live research proof',
      slug: CONTROLLED_SMOKE_SLUG,
      buyerName: 'Harbour Coffee Lab — fictional demonstration buyer',
      destination: 'Toronto, Canada',
      defaultCurrency: 'CAD',
      status: 'reviewing_candidates',
      dataMode: 'live',
      demoMode: true,
      presentationMode: false,
      createdAt: 10,
      updatedAt: 10,
    });
    const briefId = await ctx.db.insert('briefs', {
      projectId,
      version: 1,
      rawRequest: 'Produce 200 controlled demonstration espresso cups for Toronto.',
      productName: 'Handcrafted ceramic espresso cups',
      productCategory: 'custom Moroccan ceramics',
      quantity: 200,
      unit: 'cups',
      destination: 'Toronto, Canada',
      budget: 3_500,
      budgetCurrency: 'CAD',
      deadlineDays: 42,
      customization: 'Custom logo',
      extractionModel: 'gpt-5.6-luna',
      approvedAt: 100,
      promptVersion: 'brief.compile.v1',
      createdAt: 90,
    });
    await ctx.db.patch(projectId, {currentApprovedBriefId: briefId});
    const openAIOperationId = await ctx.db.insert('externalOperations', {
      projectId,
      provider: 'openai',
      operation: 'compile_brief',
      idempotencyKey: `openai:compile:${projectId}:capture-proof`,
      scopeKey: `${projectId}:compile_brief`,
      resultReference: String(briefId),
      attempt: 1,
      status: 'completed',
      safeMetadata: {},
      createdAt: 90,
      updatedAt: 110,
    });
    await ctx.db.insert('usageEvents', {
      projectId,
      provider: 'openai',
      operation: 'compile_brief',
      status: 'completed',
      cached: false,
      occurredAt: 110,
    });
    const discoveryRunId = await ctx.db.insert('discoveryRuns', {
      projectId,
      briefId,
      provider: 'firecrawl',
      query: 'custom restaurant tableware Morocco',
      crawlUrl: 'https://example.com/controlled-ceramics',
      status: 'completed',
      idempotencyKey: `firecrawl:${projectId}:capture-proof`,
      externalReference: 'controlled-crawl-reference',
      startedAt: 120,
      completedAt: 200,
      resultCount: 5,
    });
    await ctx.db.insert('usageEvents', {
      projectId,
      discoveryRunId,
      provider: 'firecrawl',
      operation: 'search_and_durable_crawl',
      status: 'completed',
      cached: false,
      occurredAt: 200,
    });
    return {userId, projectId, briefId, openAIOperationId, discoveryRunId};
  });
  return {t, fixture, ids, operator: t.withIdentity({subject: `${ids.userId}|capture-test`})};
}

describe('captured live research proof', () => {
  it('publishes one idempotent, provenance-safe proof without mutating fixture content', async () => {
    const {t, fixture, ids, operator} = await setupCaptureProof();
    await expect(
      t.mutation(api.demoCapture.captureResearchProof, {discoveryRunId: ids.discoveryRunId}),
    ).rejects.toThrow('Unauthenticated');

    const fixtureBefore = await t.run(async (ctx) => ({
      project: await ctx.db.get(fixture.projectId),
      metrics: await ctx.db
        .query('projectMetrics')
        .withIndex('by_projectId', (index) => index.eq('projectId', fixture.projectId))
        .unique(),
      claims: await ctx.db
        .query('capabilityClaims')
        .withIndex('by_projectId_and_supplierId', (index) =>
          index.eq('projectId', fixture.projectId),
        )
        .take(200),
    }));

    const first = await operator.mutation(api.demoCapture.captureResearchProof, {
      discoveryRunId: ids.discoveryRunId,
    });
    expect(first).toMatchObject({created: true, version: 3, status: 'published'});
    const second = await operator.mutation(api.demoCapture.captureResearchProof, {
      discoveryRunId: ids.discoveryRunId,
    });
    expect(second).toEqual({...first, created: false});
    await t.mutation(internal.seed.ensureDemoBaseline, {});

    const stored = await t.run(async (ctx) => ({
      priorBaseline: await ctx.db.get(fixture.baselineId),
      capturedBaseline: await ctx.db.get(first.baselineId),
      project: await ctx.db.get(fixture.projectId),
      metrics: await ctx.db
        .query('projectMetrics')
        .withIndex('by_projectId', (index) => index.eq('projectId', fixture.projectId))
        .unique(),
      claims: await ctx.db
        .query('capabilityClaims')
        .withIndex('by_projectId_and_supplierId', (index) =>
          index.eq('projectId', fixture.projectId),
        )
        .take(200),
    }));
    expect(stored.priorBaseline?.status).toBe('retired');
    expect(stored.capturedBaseline).toMatchObject({
      baselineProjectId: fixture.projectId,
      sourceMode: 'captured_live',
      captureScope: 'research_only',
      captureSourceProjectId: ids.projectId,
      captureSourceBriefId: ids.briefId,
      captureSourceOpenAIOperationId: ids.openAIOperationId,
      captureSourceRunId: ids.discoveryRunId,
    });
    expect(stored.project).toEqual(fixtureBefore.project);
    expect(stored.metrics).toEqual(fixtureBefore.metrics);
    expect(stored.claims).toEqual(fixtureBefore.claims);

    const publicSessionId = sessionId('session-captured-proof-public-001');
    await t.mutation(api.demo.createSession, {sessionId: publicSessionId});
    const publicSession = await t.query(api.demo.getSession, {sessionId: publicSessionId});
    expect(publicSession?.baseline).toMatchObject({
      version: 3,
      sourceMode: 'captured_live',
      captureScope: 'research_only',
      contentMode: 'fictional_fixture',
    });
    expect(publicSession?.baseline.captureEvents).toEqual([
      {
        provider: 'openai',
        operation: 'compile_brief',
        label: 'OpenAI structured the controlled sourcing brief',
        occurredAt: 110,
      },
      {
        provider: 'firecrawl',
        operation: 'search_and_durable_crawl',
        label: 'Firecrawl completed a durable crawl with 5 pages stored',
        occurredAt: 200,
        resultCount: 5,
      },
    ]);
    const publicJson = JSON.stringify(publicSession);
    expect(publicJson).toContain('fictional');
    expect(publicJson).toContain('no supplier outreach');
    expect(publicJson).not.toContain(String(ids.projectId));
    expect(publicJson).not.toContain(String(ids.briefId));
    expect(publicJson).not.toContain(String(ids.openAIOperationId));
    expect(publicJson).not.toContain(String(ids.discoveryRunId));
  });

  it('rejects projects and briefs outside the exact controlled live scope', async () => {
    const {t, ids, operator} = await setupCaptureProof();
    await t.run(async (ctx) => ctx.db.patch(ids.projectId, {slug: 'different-smoke-project'}));
    await expect(
      operator.mutation(api.demoCapture.captureResearchProof, {
        discoveryRunId: ids.discoveryRunId,
      }),
    ).rejects.toThrow('controlled research-only project scope');

    await t.run(async (ctx) => {
      await ctx.db.patch(ids.projectId, {slug: CONTROLLED_SMOKE_SLUG});
      await ctx.db.patch(ids.briefId, {promptVersion: 'fixture.manual.v1'});
    });
    await expect(
      operator.mutation(api.demoCapture.captureResearchProof, {
        discoveryRunId: ids.discoveryRunId,
      }),
    ).rejects.toThrow('OpenAI provenance');
  });

  it('rejects cached provider proof and non-completed Firecrawl runs', async () => {
    const {t, ids, operator} = await setupCaptureProof();
    await t.run(async (ctx) => {
      const usage = await ctx.db
        .query('usageEvents')
        .withIndex('by_projectId_and_occurredAt', (index) => index.eq('projectId', ids.projectId))
        .take(10);
      const openAI = usage.find((event) => event.provider === 'openai')!;
      await ctx.db.patch(openAI._id, {cached: true});
    });
    await expect(
      operator.mutation(api.demoCapture.captureResearchProof, {
        discoveryRunId: ids.discoveryRunId,
      }),
    ).rejects.toThrow('OpenAI usage proof');

    await t.run(async (ctx) => {
      const usage = await ctx.db
        .query('usageEvents')
        .withIndex('by_projectId_and_occurredAt', (index) => index.eq('projectId', ids.projectId))
        .take(10);
      const openAI = usage.find((event) => event.provider === 'openai')!;
      await ctx.db.patch(openAI._id, {cached: false});
      await ctx.db.patch(ids.discoveryRunId, {status: 'partially_completed'});
    });
    await expect(
      operator.mutation(api.demoCapture.captureResearchProof, {
        discoveryRunId: ids.discoveryRunId,
      }),
    ).rejects.toThrow('completed controlled Firecrawl run');
  });

  it('proves AgentMail and supplier reply state are absent from a research-only capture', async () => {
    const {t, ids, operator} = await setupCaptureProof();
    await t.run(async (ctx) => {
      await ctx.db.insert('usageEvents', {
        projectId: ids.projectId,
        provider: 'agentmail',
        operation: 'send_outreach',
        status: 'completed',
        cached: false,
        occurredAt: 250,
      });
    });
    await expect(
      operator.mutation(api.demoCapture.captureResearchProof, {
        discoveryRunId: ids.discoveryRunId,
      }),
    ).rejects.toThrow('cannot include AgentMail usage');
  });
});
