// @vitest-environment edge-runtime
/// <reference types="vite/client" />

import {convexTest} from 'convex-test';
import rateLimiterTest from '@convex-dev/rate-limiter/test';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {api, internal} from './_generated/api';
import schema from './schema';

const modules = import.meta.glob('./**/*.ts');
const controlledRecipient = 'atlas-demo@example.test';

async function sha256Hex(value: string) {
  const digest = new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)),
  );
  return [...digest].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function setupControlledOutreach() {
  const t = convexTest(schema, modules);
  rateLimiterTest.register(t);
  const fixture = await t.mutation(internal.seed.ensureDemoBaseline, {});
  const recipientHash = await sha256Hex(controlledRecipient);
  vi.stubEnv('AGENTMAIL_INBOX_ID', 'makermesh-sender-inbox');
  vi.stubEnv('AGENTMAIL_DEMO_SUPPLIER_INBOX_ID', 'atlas-controlled-inbox');
  vi.stubEnv('CONTROLLED_OUTREACH_ALLOWLIST_HASHES', recipientHash);
  vi.stubEnv('CONTROLLED_DEMO_SUPPLIER_RECIPIENT_HASH', recipientHash);

  const ids = await t.run(async (ctx) => {
    const userId = await ctx.db.insert('users', {name: 'Outreach operator'});
    await ctx.db.insert('operatorProfiles', {
      authUserId: userId,
      role: 'operator',
      createdAt: 1,
      updatedAt: 1,
    });
    const projectId = await ctx.db.insert('projects', {
      title: 'Controlled live research proof',
      slug: 'harbour-coffee-lab-live-smoke',
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
      idempotencyKey: `openai:compile:${projectId}:outreach-proof`,
      resultReference: String(briefId),
      status: 'completed',
      safeMetadata: {},
      createdAt: 90,
      updatedAt: 110,
    });
    const discoveryRunId = await ctx.db.insert('discoveryRuns', {
      projectId,
      briefId,
      provider: 'firecrawl',
      query: 'custom restaurant tableware Morocco',
      crawlUrl: 'https://example.com/controlled-ceramics',
      status: 'completed',
      idempotencyKey: `firecrawl:${projectId}:outreach-proof`,
      externalReference: 'controlled-crawl-reference',
      startedAt: 120,
      completedAt: 200,
      resultCount: 5,
    });
    await ctx.db.patch(fixture.baselineId, {status: 'retired'});
    const captureBaselineId = await ctx.db.insert('demoBaselines', {
      slug: 'espresso-cup-demo',
      version: 3,
      baselineProjectId: fixture.projectId,
      capturedAt: 220,
      sourceMode: 'captured_live',
      captureLabel:
        'Live research proof with fictional fixture market data; no supplier outreach is represented.',
      captureScope: 'research_only',
      captureSourceProjectId: projectId,
      captureSourceBriefId: briefId,
      captureSourceOpenAIOperationId: openAIOperationId,
      captureSourceRunId: discoveryRunId,
      captureEvents: [
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
      ],
      status: 'published',
    });
    return {userId, projectId, briefId, captureBaselineId};
  });
  return {t, ids, operator: t.withIdentity({subject: `${ids.userId}|outreach-test`})};
}

afterEach(() => vi.unstubAllEnvs());

describe('controlled demo outreach preparation', () => {
  it('prepares, reviews, and approves one bilingual draft without sending it', async () => {
    const {t, ids, operator} = await setupControlledOutreach();
    await expect(
      t.mutation(api.controlledOutreach.prepareControlledDemoDraft, {
        recipient: controlledRecipient,
      }),
    ).rejects.toThrow('Unauthenticated');

    const first = await operator.mutation(api.controlledOutreach.prepareControlledDemoDraft, {
      recipient: controlledRecipient,
    });
    expect(first.created).toBe(true);
    const second = await operator.mutation(api.controlledOutreach.prepareControlledDemoDraft, {
      recipient: controlledRecipient,
    });
    expect(second).toEqual({...first, created: false});

    const stored = await t.run(async (ctx) => {
      const draft = await ctx.db.get(first.outreachDraftId);
      const supplier = draft ? await ctx.db.get(draft.supplierId) : null;
      const appearance = draft
        ? await ctx.db
            .query('projectSuppliers')
            .withIndex('by_projectId_and_supplierId', (index) =>
              index.eq('projectId', ids.projectId).eq('supplierId', draft.supplierId),
            )
            .unique()
        : null;
      const project = await ctx.db.get(ids.projectId);
      const usage = await ctx.db
        .query('usageEvents')
        .withIndex('by_projectId_and_occurredAt', (index) => index.eq('projectId', ids.projectId))
        .take(10);
      const threads = await ctx.db
        .query('mailThreads')
        .withIndex('by_projectId_and_supplierId', (index) => index.eq('projectId', ids.projectId))
        .take(10);
      return {draft, supplier, appearance, project, usage, threads};
    });
    expect(stored.project?.status).toBe('outreach_ready');
    expect(stored.supplier).toMatchObject({
      canonicalName: 'Atlas Clay Studio — Demo Supplier',
      demoSupplier: true,
    });
    expect(stored.supplier?.publicEmail).toBeUndefined();
    expect(stored.appearance).toMatchObject({
      stage: 'outreach_selected',
      eligibility: 'not_publicly_evaluated',
      preferenceFit: 0,
      evidenceCoverage: 0,
      commercialCompleteness: 0,
    });
    expect(stored.draft).toMatchObject({
      status: 'draft',
      draftKind: 'controlled_demo',
      templateVersion: 'atlas-controlled-rfq.v1',
      recipient: controlledRecipient,
    });
    expect(stored.draft?.approvedAt).toBeUndefined();
    expect(stored.draft?.sentAt).toBeUndefined();
    expect(stored.draft?.agentMailOutboundId).toBeUndefined();
    expect(stored.usage).toHaveLength(0);
    expect(stored.threads).toHaveLength(0);

    await expect(
      t.query(api.controlledOutreach.getControlledDemoDraft, {
        outreachDraftId: first.outreachDraftId,
      }),
    ).rejects.toThrow('Unauthenticated');
    const review = await operator.query(api.controlledOutreach.getControlledDemoDraft, {
      outreachDraftId: first.outreachDraftId,
    });
    expect(review).toMatchObject({
      recipient: controlledRecipient,
      status: 'draft',
      templateVersion: 'atlas-controlled-rfq.v1',
    });
    for (const value of ['200', '250', '8', '42', 'CAD 3,500']) {
      expect(review.bodyEnglish).toContain(value);
      expect(review.bodyLocalized).toContain(value);
    }
    await expect(
      operator.mutation(api.controlledOutreach.approveControlledDemoDraft, {
        outreachDraftId: first.outreachDraftId,
        expectedContentHash: '0'.repeat(64),
      }),
    ).rejects.toThrow('content changed');
    const approved = await operator.mutation(api.controlledOutreach.approveControlledDemoDraft, {
      outreachDraftId: first.outreachDraftId,
      expectedContentHash: review.contentHash,
    });
    expect(approved.status).toBe('approved');
    expect(approved.approvedAt).toBeTypeOf('number');
    const afterApproval = await t.run((ctx) => ctx.db.get(first.outreachDraftId));
    expect(afterApproval?.agentMailOutboundId).toBeUndefined();
    expect(afterApproval?.sentAt).toBeUndefined();
  });
});
