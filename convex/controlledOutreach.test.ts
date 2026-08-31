// @vitest-environment edge-runtime
/// <reference types="vite/client" />

import {convexTest} from 'convex-test';
import rateLimiterTest from '@convex-dev/rate-limiter/test';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {api, internal} from './_generated/api';
import {hashControlledDraftContent} from './model/controlledOutreach';
import {CONTROLLED_SMOKE_SLUG} from './model/controlledDemo';
import {FROZEN_CONTROLLED_REQUIREMENTS} from './model/controlledScenario';
import schema from './schema';

const modules = import.meta.glob('./**/*.ts');
const controlledRecipient = 'atlas-demo@example.test';
const controlledSender = 'makermesh@example.test';
const controlledSenderDisplayName = 'MakerMesh';

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
  const recipientInboxIdHash = await sha256Hex('atlas-controlled-inbox');
  const senderInboxIdHash = await sha256Hex('makermesh-sender-inbox');
  const senderEmailHash = await sha256Hex(controlledSender);
  const senderDisplayNameHash = await sha256Hex(controlledSenderDisplayName);
  vi.stubEnv('AGENTMAIL_INBOX_ID', 'makermesh-sender-inbox');
  vi.stubEnv('AGENTMAIL_DEMO_SUPPLIER_INBOX_ID', 'atlas-controlled-inbox');
  vi.stubEnv('CONTROLLED_OUTREACH_ALLOWLIST_HASHES', recipientHash);
  vi.stubEnv('CONTROLLED_DEMO_SUPPLIER_RECIPIENT_HASH', recipientHash);
  vi.stubEnv('CONTROLLED_DEMO_SENDER_EMAIL_HASH', senderEmailHash);
  vi.stubEnv('CONTROLLED_DEMO_SENDER_DISPLAY_NAME_HASH', senderDisplayNameHash);

  const ids = await t.run(async (ctx) => {
    await ctx.db.insert('idempotencyRecords', {
      key: [
        'agentmail:demo-mailbox-binding:v2',
        senderInboxIdHash,
        senderEmailHash,
        senderDisplayNameHash,
        recipientInboxIdHash,
        recipientHash,
      ].join(':'),
      scope: 'agentmail_demo_mailbox_binding',
      subjectKey: recipientHash,
      expiresAt: Date.now() + 15 * 60 * 1000,
      createdAt: 1,
    });
    const userId = await ctx.db.insert('users', {name: 'Outreach operator'});
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
      productName: 'Custom Moroccan ceramic espresso cups for Harbour Coffee Lab',
      productCategory: 'Custom Moroccan ceramics',
      quantity: 200,
      unit: 'cups',
      destination: 'Toronto, Canada',
      budget: 3_500,
      budgetCurrency: 'CAD',
      budgetBasis:
        'Target product-only budget before freight, customs, taxes, and duties; not a landed-cost basis. Original supplier currencies must be preserved.',
      deadlineDays: 42,
      customization:
        'Harbour Coffee Lab custom cafe logo must be supported; Logo application method and artwork specifications are not yet defined',
      dimensions: [{label: 'Capacity', value: 8, unit: 'ounces'}],
      finish: [
        'Preferred: matte sand or off-white base',
        'Preferred: dark green or ink-blue detailing',
        'Preferred: visible artisanal variation',
      ],
      assumptions: [
        'The product is a cup only; no saucers are included unless later specified.',
        'The 8-ounce capacity is treated as an approximate target, as stated by the buyer, rather than a precisely measured volume.',
        'The 42-calendar-day limit is recorded as the maximum stated production time; inclusion of sampling, approval, curing, and other pre-production steps is unresolved.',
        'The CAD 3,500 amount applies to the 200-cup product order and may or may not include sample, tooling, setup, or logo application costs; this requires confirmation.',
        'Freight, customs, taxes, and duties are excluded from the product budget exactly as stated.',
        'No cup diameter, height, weight, shape, handle design, glaze chemistry, packaging configuration, or logo specifications are assumed.',
        'A Moroccan production centre is required by the sourcing context, while the named cities are preferences rather than exclusive locations.',
      ],
      extractionModel: 'gpt-5.6-luna',
      approvedAt: 100,
      promptVersion: 'brief.compile.v1',
      createdAt: 90,
    });
    await ctx.db.patch(projectId, {currentApprovedBriefId: briefId});
    for (const requirement of FROZEN_CONTROLLED_REQUIREMENTS) {
      const {unit, ...requirementFields} = requirement;
      await ctx.db.insert('requirements', {
        projectId,
        briefId,
        ...requirementFields,
        ...(unit ? {unit} : {}),
      });
    }
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
    await expect(
      operator.mutation(api.controlledOutreach.prepareControlledDemoDraft, {
        recipient: `${controlledRecipient}, other@example.test`,
      }),
    ).rejects.toThrow('single mailbox');

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
      operator.mutation(api.agentMail.sendApproved, {
        outreachDraftId: first.outreachDraftId,
      }),
    ).rejects.toThrow('Explicit outreach approval');

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
      recipientCount: 1,
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
    const genericDraftId = await t.run(async (ctx) => {
      const controlled = await ctx.db.get(first.outreachDraftId);
      return ctx.db.insert('outreachDrafts', {
        projectId: controlled!.projectId,
        briefId: controlled!.briefId,
        supplierId: controlled!.supplierId,
        recipient: controlled!.recipient,
        recipientSource: controlled!.recipientSource,
        subject: controlled!.subject,
        bodyEnglish: controlled!.bodyEnglish,
        bodyLocalized: controlled!.bodyLocalized,
        language: controlled!.language,
        questionKeys: controlled!.questionKeys,
        status: 'queued',
        idempotencyKey: 'generic-outbound-bypass-test',
        agentMailOutboundId: 'generic-existing-outbound',
        approvedAt: 1,
        sentAt: 1,
      });
    });
    await expect(
      operator.mutation(api.agentMail.sendApproved, {outreachDraftId: genericDraftId}),
    ).rejects.toThrow('scope is invalid');
    await expect(
      operator.mutation(api.agentMail.sendApproved, {
        outreachDraftId: first.outreachDraftId,
      }),
    ).rejects.toThrow('Controlled demo outreach is locked');
    const mutatedBodyEnglish = `${review.bodyEnglish}\nMutated after approval.`;
    const mutatedContentHash = await hashControlledDraftContent({
      recipient: review.recipient,
      recipientSource: review.recipientSource,
      language: review.language,
      recipientCount: review.recipientCount,
      templateVersion: review.templateVersion,
      subject: review.subject,
      bodyEnglish: mutatedBodyEnglish,
      bodyLocalized: review.bodyLocalized,
      questionKeys: review.questionKeys,
    });
    await t.run(async (ctx) => {
      await ctx.db.patch(first.outreachDraftId, {
        bodyEnglish: mutatedBodyEnglish,
        contentHash: mutatedContentHash,
        agentMailOutboundId: 'existing-outbound-test',
      });
    });
    await expect(
      operator.mutation(api.agentMail.sendApproved, {
        outreachDraftId: first.outreachDraftId,
      }),
    ).rejects.toThrow('content or recipient changed');
    await t.run(async (ctx) => {
      await ctx.db.patch(first.outreachDraftId, {
        bodyEnglish: review.bodyEnglish,
        contentHash: review.contentHash,
        approvedContentHash: '0'.repeat(64),
      });
    });
    await expect(
      operator.mutation(api.agentMail.sendApproved, {
        outreachDraftId: first.outreachDraftId,
      }),
    ).rejects.toThrow('approved bytes');
  });

  it('requires a provider-verified binding for a distinct demo-supplier inbox', async () => {
    const {t, operator} = await setupControlledOutreach();
    const expectedRecipientHash = await sha256Hex(controlledRecipient);
    await t.run(async (ctx) => {
      const bindings = await ctx.db
        .query('idempotencyRecords')
        .withIndex('by_subjectKey', (index) => index.eq('subjectKey', expectedRecipientHash))
        .take(10);
      for (const binding of bindings) await ctx.db.delete(binding._id);
    });
    await expect(
      operator.mutation(api.controlledOutreach.prepareControlledDemoDraft, {
        recipient: controlledRecipient,
      }),
    ).rejects.toThrow('provider-verified');

    vi.stubEnv('AGENTMAIL_DEMO_SUPPLIER_INBOX_ID', 'makermesh-sender-inbox');
    await expect(
      operator.mutation(api.controlledOutreach.prepareControlledDemoDraft, {
        recipient: controlledRecipient,
      }),
    ).rejects.toThrow('not safely configured');
  });

  it('accepts one inbound reply only for the immutable controlled draft scope', async () => {
    const {t, ids, operator} = await setupControlledOutreach();
    const prepared = await operator.mutation(api.controlledOutreach.prepareControlledDemoDraft, {
      recipient: controlledRecipient,
    });
    const review = await operator.query(api.controlledOutreach.getControlledDemoDraft, {
      outreachDraftId: prepared.outreachDraftId,
    });
    await operator.mutation(api.controlledOutreach.approveControlledDemoDraft, {
      outreachDraftId: prepared.outreachDraftId,
      expectedContentHash: review.contentHash,
    });
    const threadId = await t.run(async (ctx) => {
      const draft = await ctx.db.get(prepared.outreachDraftId);
      await ctx.db.patch(ids.projectId, {status: 'awaiting_replies'});
      await ctx.db.patch(prepared.outreachDraftId, {
        status: 'delivered',
        sentAt: 200,
        agentMailOutboundId: 'controlled-outbound-test',
      });
      return ctx.db.insert('mailThreads', {
        projectId: ids.projectId,
        briefId: ids.briefId,
        supplierId: draft!.supplierId,
        outreachDraftId: prepared.outreachDraftId,
        agentMailOutboundId: 'controlled-outbound-test',
        agentMailInboxId: 'makermesh-sender-inbox',
        agentMailThreadId: 'controlled-thread-test',
        inboundProcessedCount: 0,
        status: 'delivered',
        latestMessageAt: 200,
      });
    });
    const callback = {
      message: {
        inbox_id: 'makermesh-sender-inbox',
        thread_id: 'controlled-thread-test',
        message_id: 'controlled-message-test',
        from: controlledRecipient,
        to: controlledSender,
        subject: 'Re: controlled demonstration',
        text: 'Réponse fictive contrôlée avec un MOQ de 150 unités.',
        timestamp: '2026-08-30T23:00:00Z',
      },
      thread: {},
      eventId: 'controlled-event-test',
    };
    await t.mutation(internal.agentMail.onMessageReceived, callback);
    await t.mutation(internal.agentMail.onMessageReceived, callback);
    const result = await t.run(async (ctx) => {
      const thread = await ctx.db.get(threadId);
      const draft = await ctx.db.get(prepared.outreachDraftId);
      const decisions = await ctx.db
        .query('idempotencyRecords')
        .withIndex('by_key', (index) =>
          index.eq('key', 'agentmail:inbound:makermesh-sender-inbox:controlled-message-test'),
        )
        .take(2);
      const operations = await ctx.db
        .query('externalOperations')
        .withIndex('by_projectId', (index) => index.eq('projectId', ids.projectId))
        .filter((filter) => filter.eq(filter.field('operation'), 'extract_supplier_reply'))
        .take(2);
      return {thread, draft, decisions, operations};
    });
    expect(result.thread).toMatchObject({status: 'replied', inboundProcessedCount: 1});
    expect(result.draft?.status).toBe('replied');
    expect(result.decisions).toHaveLength(1);
    expect(result.decisions[0]?.scope).toBe('agentmail_inbound');
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]).toMatchObject({
      operation: 'extract_supplier_reply',
      outreachDraftId: prepared.outreachDraftId,
      status: 'queued',
    });
  });

  it('refuses to prepare static copy for a brief outside the frozen demo scenario', async () => {
    const {t, ids, operator} = await setupControlledOutreach();
    await t.run(async (ctx) => {
      await ctx.db.patch(ids.briefId, {
        productName: 'Handcrafted plastic drinking cups',
        productCategory: 'Promotional plastics',
        customization: 'No custom logo',
        finish: ['not off-white'],
      });
      const logoRequirement = await ctx.db
        .query('requirements')
        .withIndex('by_briefId_and_key', (index) =>
          index.eq('briefId', ids.briefId).eq('key', 'custom_logo'),
        )
        .unique();
      await ctx.db.patch(logoRequirement!._id, {targetValue: 'No logo'});
    });
    await expect(
      operator.mutation(api.controlledOutreach.prepareControlledDemoDraft, {
        recipient: controlledRecipient,
      }),
    ).rejects.toThrow('frozen controlled demonstration scope');
  });

  it('rejects negated product and category phrases even when every expected token is present', async () => {
    const {t, ids, operator} = await setupControlledOutreach();
    await t.run((ctx) =>
      ctx.db.patch(ids.briefId, {
        productName: 'Not custom Moroccan ceramic espresso cups for Harbour Coffee Lab',
        productCategory: 'Not custom Moroccan ceramics',
      }),
    );
    await expect(
      operator.mutation(api.controlledOutreach.prepareControlledDemoDraft, {
        recipient: controlledRecipient,
      }),
    ).rejects.toThrow('frozen controlled demonstration scope');
  });

  it('rejects negated or conflicting duplicate frozen requirements', async () => {
    const {t, ids, operator} = await setupControlledOutreach();
    await t.run(async (ctx) => {
      const sample = await ctx.db
        .query('requirements')
        .withIndex('by_briefId_and_key', (index) =>
          index.eq('briefId', ids.briefId).eq('key', 'preproduction_sample'),
        )
        .unique();
      await ctx.db.patch(sample!._id, {targetValue: 'No sample required before production'});
    });
    await expect(
      operator.mutation(api.controlledOutreach.prepareControlledDemoDraft, {
        recipient: controlledRecipient,
      }),
    ).rejects.toThrow('frozen controlled demonstration scope');

    const second = await setupControlledOutreach();
    await second.t.run((ctx) =>
      ctx.db.insert('requirements', {
        projectId: second.ids.projectId,
        briefId: second.ids.briefId,
        key: 'preproduction_sample',
        label: 'Conflicting sample requirement',
        description: 'No sample is required.',
        type: 'hard',
        operator: 'equals',
        targetValue: false,
        weight: 0,
        displayOrder: 8,
      }),
    );
    await expect(
      second.operator.mutation(api.controlledOutreach.prepareControlledDemoDraft, {
        recipient: controlledRecipient,
      }),
    ).rejects.toThrow('frozen controlled demonstration scope');
  });

  it('rejects a mixed positive and negative finish list', async () => {
    const {t, ids, operator} = await setupControlledOutreach();
    await t.run((ctx) =>
      ctx.db.patch(ids.briefId, {
        finish: [
          'Preferred: matte sand or off-white base',
          'Preferred: dark green or ink-blue detailing',
          'Preferred: visible artisanal variation',
          'not off-white',
        ],
      }),
    );
    await expect(
      operator.mutation(api.controlledOutreach.prepareControlledDemoDraft, {
        recipient: controlledRecipient,
      }),
    ).rejects.toThrow('frozen controlled demonstration scope');
  });
});
