// @vitest-environment edge-runtime
/// <reference types="vite/client" />

import {convexTest} from 'convex-test';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {api, internal} from './_generated/api';
import {CONTROLLED_SMOKE_SLUG} from './model/controlledDemo';
import {
  buildControlledTemplate,
  CONTROLLED_ATLAS_NAME,
  CONTROLLED_ATLAS_SLUG,
  CONTROLLED_ATLAS_SUMMARY,
  CONTROLLED_ATLAS_VISUAL_PATH,
  CONTROLLED_LANGUAGE,
  CONTROLLED_RECIPIENT_COUNT,
  CONTROLLED_RECIPIENT_SOURCE,
  CONTROLLED_TEMPLATE_VERSION,
  controlledDraftContentHash,
  FROZEN_CONTROLLED_ASSUMPTIONS,
} from './model/controlledOutreach';
import {FROZEN_CONTROLLED_REQUIREMENTS} from './model/controlledScenario';
import schema from './schema';

const modules = import.meta.glob('./**/*.ts');
const controlledRecipient = 'controlled@example.test';

afterEach(() => vi.unstubAllEnvs());

async function sha256Hex(value: string) {
  const digest = new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)),
  );
  return [...digest].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function liveProject() {
  const t = convexTest(schema, modules);
  const projectId = await t.run((ctx) =>
    ctx.db.insert('projects', {
      title: 'OpenAI fixture project',
      slug: CONTROLLED_SMOKE_SLUG,
      buyerName: 'Harbour Coffee Lab — fictional demonstration buyer',
      destination: 'Toronto, Canada',
      defaultCurrency: 'CAD',
      status: 'draft',
      dataMode: 'live',
      demoMode: true,
      presentationMode: false,
      createdAt: 1,
      updatedAt: 1,
    }),
  );
  return {t, projectId};
}

const hardRequirements = FROZEN_CONTROLLED_REQUIREMENTS.filter(
  (requirement) => requirement.type === 'hard',
).map(({type: _type, weight: _weight, displayOrder: _displayOrder, ...requirement}) => requirement);
const softPreferences = FROZEN_CONTROLLED_REQUIREMENTS.filter(
  (requirement) => requirement.type === 'soft',
).map(({type: _type, displayOrder: _displayOrder, ...requirement}) => requirement);

const briefFixture = {
  product: {
    name: 'Custom Moroccan ceramic espresso cups for Harbour Coffee Lab',
    description: 'A controlled 200-cup sourcing request for a fictional Toronto buyer.',
  },
  category: 'Custom Moroccan ceramics',
  quantity: {value: 200, unit: 'cups'},
  dimensions: [{label: 'Capacity', value: 8, unit: 'ounces'}],
  materials: ['ceramic'],
  finish: [
    'Preferred: matte sand or off-white base',
    'Preferred: dark green or ink-blue detailing',
    'Preferred: visible artisanal variation',
  ],
  customization: [
    'Harbour Coffee Lab custom cafe logo must be supported',
    'Logo application method and artwork specifications are not yet defined',
  ],
  destination: 'Toronto, Canada',
  deadlineDays: 42,
  budget: {
    amount: 3_500,
    currency: 'CAD',
    basis:
      'Target product-only budget before freight, customs, taxes, and duties; not a landed-cost basis. Original supplier currencies must be preserved.',
  },
  hardRequirements,
  softPreferences,
  openClarifyingQuestions: ['Packaging method?'],
  assumptions: [...FROZEN_CONTROLLED_ASSUMPTIONS],
};

describe('OpenAI fixture persistence', () => {
  it('scopes request identifiers and reacquires failed operations with a new attempt', async () => {
    const {t, projectId} = await liveProject();
    const idempotencyKey = `openai:compile:${projectId}:scoped-request-001`;
    const first = await t.mutation(internal.openaiStore.reserve, {
      projectId,
      operation: 'compile_brief',
      idempotencyKey,
      requestHash: 'c'.repeat(64),
    });
    await expect(
      t.mutation(internal.openaiStore.reserve, {
        projectId,
        operation: 'compile_brief',
        idempotencyKey,
        requestHash: 'd'.repeat(64),
      }),
    ).rejects.toThrow('different input');
    await t.mutation(internal.openaiStore.markFailed, {
      operationId: first.operationId,
      attempt: first.attempt,
      errorCode: 'CONTROLLED_TEST_FAILURE',
    });
    const retry = await t.mutation(internal.openaiStore.reserve, {
      projectId,
      operation: 'compile_brief',
      idempotencyKey,
      requestHash: 'c'.repeat(64),
    });
    expect(retry).toMatchObject({created: true, operationId: first.operationId, attempt: 2});
    await expect(
      t.mutation(internal.openaiStore.persistCompiledBrief, {
        operationId: first.operationId,
        projectId,
        rawRequest: 'Produce 200 custom espresso cups for Toronto.',
        resultJson: JSON.stringify(briefFixture),
        model: 'fixture-model',
        promptVersion: 'brief.compile.v1',
        latencyMs: 25,
        attempt: 1,
      }),
    ).rejects.toThrow('does not match');

    const secondProjectId = await t.run((ctx) =>
      ctx.db.insert('projects', {
        title: 'Second scoped project',
        slug: 'second-scoped-project',
        buyerName: 'Controlled buyer',
        destination: 'London, UK',
        defaultCurrency: 'GBP',
        status: 'draft',
        dataMode: 'live',
        demoMode: true,
        presentationMode: false,
        createdAt: 1,
        updatedAt: 1,
      }),
    );
    const second = await t.mutation(internal.openaiStore.reserve, {
      projectId: secondProjectId,
      operation: 'compile_brief',
      idempotencyKey: `openai:compile:${secondProjectId}:scoped-request-001`,
      requestHash: 'c'.repeat(64),
    });
    expect(second.operationId).not.toBe(first.operationId);
  });

  it('persists a structured brief for explicit approval', async () => {
    const {t, projectId} = await liveProject();
    const operation = await t.mutation(internal.openaiStore.reserve, {
      projectId,
      operation: 'compile_brief',
      idempotencyKey: `openai:compile:${projectId}:brief-fixture-test-001`,
      requestHash: 'a'.repeat(64),
    });
    const briefId = await t.mutation(internal.openaiStore.persistCompiledBrief, {
      operationId: operation.operationId,
      projectId,
      rawRequest: 'Produce 200 custom espresso cups for Toronto.',
      resultJson: JSON.stringify(briefFixture),
      model: 'fixture-model',
      promptVersion: 'brief.compile.v1',
      latencyMs: 25,
      attempt: operation.attempt,
    });
    const beforeApproval = await t.run(async (ctx) => {
      const brief = await ctx.db.get('briefs', briefId);
      const requirements = await ctx.db
        .query('requirements')
        .withIndex('by_briefId_and_displayOrder', (index) => index.eq('briefId', briefId))
        .take(20);
      return {approvedAt: brief?.approvedAt, requirementCount: requirements.length};
    });
    expect(beforeApproval).toEqual({approvedAt: undefined, requirementCount: 17});

    const userId = await t.run(async (ctx) => {
      const userId = await ctx.db.insert('users', {name: 'Operator'});
      await ctx.db.insert('operatorProfiles', {
        authUserId: userId,
        role: 'operator',
        createdAt: 1,
        updatedAt: 1,
      });
      return userId;
    });
    await t
      .withIdentity({subject: `${userId}|test-session`})
      .mutation(api.openaiStore.approveCompiledBrief, {briefId});
    const approved = await t.run(async (ctx) => ({
      brief: await ctx.db.get('briefs', briefId),
      project: await ctx.db.get('projects', projectId),
    }));
    expect(approved.brief?.approvedAt).toBeTypeOf('number');
    expect(approved.project?.status).toBe('brief_ready');
    expect(approved.project?.currentApprovedBriefId).toBe(briefId);
  });

  it('normalizes a supplier reply idempotently and recalculates with deterministic code', async () => {
    const {t, projectId} = await liveProject();
    const fixture = await t.mutation(internal.seed.ensureDemoBaseline, {});
    const recipientHash = await sha256Hex(controlledRecipient);
    const senderInboxIdHash = await sha256Hex('makermesh-sender-inbox');
    const recipientInboxIdHash = await sha256Hex('atlas-controlled-inbox');
    const senderEmailHash = await sha256Hex('makermesh@example.test');
    const senderDisplayNameHash = await sha256Hex('MakerMesh');
    vi.stubEnv('AGENTMAIL_INBOX_ID', 'makermesh-sender-inbox');
    vi.stubEnv('AGENTMAIL_DEMO_SUPPLIER_INBOX_ID', 'atlas-controlled-inbox');
    vi.stubEnv('CONTROLLED_OUTREACH_ALLOWLIST_HASHES', recipientHash);
    vi.stubEnv('CONTROLLED_DEMO_SUPPLIER_RECIPIENT_HASH', recipientHash);
    vi.stubEnv('CONTROLLED_DEMO_SENDER_EMAIL_HASH', senderEmailHash);
    vi.stubEnv('CONTROLLED_DEMO_SENDER_DISPLAY_NAME_HASH', senderDisplayNameHash);
    const template = buildControlledTemplate();
    const contentHash = await controlledDraftContentHash(controlledRecipient);
    const briefOperation = await t.mutation(internal.openaiStore.reserve, {
      projectId,
      operation: 'compile_brief',
      idempotencyKey: `openai:compile:${projectId}:brief-for-reply-test-001`,
      requestHash: 'b'.repeat(64),
    });
    const briefId = await t.mutation(internal.openaiStore.persistCompiledBrief, {
      operationId: briefOperation.operationId,
      projectId,
      rawRequest: 'Produce 200 custom espresso cups for Toronto.',
      resultJson: JSON.stringify(briefFixture),
      model: 'fixture-model',
      promptVersion: 'brief.compile.v1',
      latencyMs: 25,
      attempt: briefOperation.attempt,
    });
    const originalText = [
      'Notre minimum est de 150 unités.',
      'Production artisanale en petite série.',
      "Le prix est de 72 MAD par tasse et l'échantillon coûte 650 MAD.",
      'La production prend 30 à 35 jours.',
      "L'expédition n'est pas incluse. Base EXW. Échantillon payant.",
    ].join(' ');
    const messageId = 'message-fixture-openai-001';
    const sourceContentHash = await sha256Hex(originalText);
    const {supplierId, operationId} = await t.run(async (ctx) => {
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
      const supplierId = await ctx.db.insert('supplierEntities', {
        canonicalName: CONTROLLED_ATLAS_NAME,
        slug: CONTROLLED_ATLAS_SLUG,
        country: 'Morocco',
        city: 'Safi',
        languages: ['French', 'English'],
        summary: CONTROLLED_ATLAS_SUMMARY,
        demoSupplier: true,
        consentStatus: 'preview_only',
        visualPath: CONTROLLED_ATLAS_VISUAL_PATH,
        createdAt: 1,
        updatedAt: 1,
      });
      await ctx.db.insert('projectSuppliers', {
        projectId,
        supplierId,
        stage: 'contacted',
        eligibility: 'provisionally_unqualified',
        preferenceFit: 0,
        evidenceCoverage: 0,
        commercialCompleteness: 0,
        openQuestionCount: 2,
        latestActivityAt: 1,
      });
      await ctx.db.patch(briefId, {approvedAt: 2});
      await ctx.db.patch(projectId, {
        currentApprovedBriefId: briefId,
        status: 'awaiting_replies',
        updatedAt: 2,
      });
      const discoveryRunId = await ctx.db.insert('discoveryRuns', {
        projectId,
        briefId,
        provider: 'firecrawl',
        query: 'controlled ceramics research',
        crawlUrl: 'https://example.com/controlled-ceramics',
        status: 'completed',
        idempotencyKey: `firecrawl:${projectId}:reply-proof`,
        externalReference: 'controlled-crawl-reference',
        startedAt: 1,
        completedAt: 2,
        resultCount: 5,
      });
      await ctx.db.patch(fixture.baselineId, {status: 'retired'});
      await ctx.db.insert('demoBaselines', {
        slug: 'espresso-cup-demo',
        version: 3,
        baselineProjectId: fixture.projectId,
        capturedAt: 2,
        sourceMode: 'captured_live',
        captureLabel: 'Controlled reply extraction fixture.',
        captureScope: 'research_only',
        captureSourceProjectId: projectId,
        captureSourceBriefId: briefId,
        captureSourceOpenAIOperationId: briefOperation.operationId,
        captureSourceRunId: discoveryRunId,
        captureEvents: [
          {
            provider: 'openai',
            operation: 'compile_brief',
            label: 'OpenAI structured the controlled sourcing brief',
            occurredAt: 1,
          },
          {
            provider: 'firecrawl',
            operation: 'search_and_durable_crawl',
            label: 'Firecrawl completed a durable crawl with 5 pages stored',
            occurredAt: 2,
            resultCount: 5,
          },
        ],
        status: 'published',
      });
      const newerBriefId = await ctx.db.insert('briefs', {
        projectId,
        version: 2,
        rawRequest: 'Unapproved revision with the same requirement key',
        productName: 'Ceramic cups',
        productCategory: 'custom Moroccan ceramics',
        quantity: 200,
        unit: 'cups',
        destination: 'Toronto, Canada',
        budget: 3_500,
        budgetCurrency: 'CAD',
        deadlineDays: 42,
        customization: 'Logo',
        promptVersion: 'brief.compile.v1',
        createdAt: 3,
      });
      await ctx.db.insert('requirements', {
        projectId,
        briefId: newerBriefId,
        key: 'moq_max',
        label: 'Different unapproved MOQ',
        description: 'This must not affect the reply to version one.',
        type: 'hard',
        operator: 'lte',
        targetValue: 100,
        unit: 'units',
        weight: 0,
        displayOrder: 0,
      });
      const draftId = await ctx.db.insert('outreachDrafts', {
        projectId,
        briefId,
        supplierId,
        recipient: controlledRecipient,
        recipientSource: CONTROLLED_RECIPIENT_SOURCE,
        subject: template.subject,
        bodyEnglish: template.bodyEnglish,
        bodyLocalized: template.bodyLocalized,
        language: CONTROLLED_LANGUAGE,
        questionKeys: template.questionKeys,
        status: 'replied',
        idempotencyKey: 'reply-fixture-draft-001',
        draftKind: 'controlled_demo',
        templateVersion: CONTROLLED_TEMPLATE_VERSION,
        recipientHash,
        recipientInboxId: 'atlas-controlled-inbox',
        recipientCount: CONTROLLED_RECIPIENT_COUNT,
        contentHash,
        approvedContentHash: contentHash,
        approvedAt: 2,
        sentAt: 2,
        agentMailOutboundId: 'outbound-fixture-001',
      });
      await ctx.db.insert('mailThreads', {
        projectId,
        briefId,
        supplierId,
        outreachDraftId: draftId,
        agentMailOutboundId: 'outbound-fixture-001',
        agentMailInboxId: 'inbox-fixture-001',
        agentMailThreadId: 'thread-fixture-001',
        inboundProcessedCount: 1,
        status: 'replied',
        latestMessageAt: 2,
      });
      const operationId = await ctx.db.insert('externalOperations', {
        projectId,
        provider: 'openai',
        operation: 'extract_supplier_reply',
        idempotencyKey: `openai:reply:${projectId}:${briefId}:${messageId}:supplier-reply.extract.v2`,
        scopeKey: `${draftId}:${messageId}`,
        briefId,
        supplierId,
        outreachDraftId: draftId,
        sourceMessageId: messageId,
        sourceContentHash,
        requestHash: sourceContentHash,
        attempt: 2,
        leaseExpiresAt: Date.now() + 60_000,
        status: 'queued',
        safeMetadata: {parserVersion: 'supplier-reply.extract.v2'},
        createdAt: 2,
        updatedAt: 2,
      });
      return {supplierId, operationId};
    });
    await expect(
      t.mutation(internal.openaiStore.claimReplyExtraction, {
        operationId,
        expectedAttempt: 1,
      }),
    ).rejects.toThrow('not available');
    await t.mutation(internal.openaiStore.claimReplyExtraction, {
      operationId,
      expectedAttempt: 2,
    });
    await expect(
      t.mutation(internal.openaiStore.claimReplyExtraction, {
        operationId,
        expectedAttempt: 2,
      }),
    ).rejects.toThrow('not available');
    const reply = {
      supplierIdentitySignals: [CONTROLLED_ATLAS_NAME],
      answers: [
        {
          requirementKey: 'moq_max',
          normalizedValue: 150,
          displayValue: '150 units',
          status: 'confirmed',
          supportingExcerpt: 'Notre minimum est de 150 unités.',
        },
        {
          requirementKey: 'production_style',
          normalizedValue: 'handmade',
          displayValue: 'Handmade small batch',
          status: 'confirmed',
          supportingExcerpt: 'Production artisanale en petite série.',
        },
      ],
      quote: {
        originalCurrency: 'MAD',
        unitPrice: 72,
        samplePrice: 650,
        moq: 150,
        productionMinDays: 30,
        productionMaxDays: 35,
        shippingIncluded: false,
        quoteBasis: 'EXW',
        paymentTerms: null,
        sampleTerms: 'Paid sample',
        validUntil: null,
        fieldEvidence: [
          {field: 'originalCurrency', supportingExcerpt: '72 MAD'},
          {field: 'unitPrice', supportingExcerpt: '72 MAD'},
          {field: 'samplePrice', supportingExcerpt: '650 MAD'},
          {field: 'moq', supportingExcerpt: '150 unités'},
          {field: 'productionMinDays', supportingExcerpt: '30 à 35 jours'},
          {field: 'productionMaxDays', supportingExcerpt: '30 à 35 jours'},
          {field: 'shippingIncluded', supportingExcerpt: "L'expédition n'est pas incluse."},
          {field: 'quoteBasis', supportingExcerpt: 'Base EXW.'},
          {field: 'sampleTerms', supportingExcerpt: 'Échantillon payant.'},
        ],
      },
      customizationMethod: 'Decal or hand-painted',
      documentationStatements: ['Documents can be shared'],
      exportStatement: 'Previous European shipments',
      unresolvedQuestions: ['Packaging method'],
      contradictions: [],
      attachmentReferences: [],
    };
    const args = {
      operationId,
      attempt: 2,
      originalText,
      resultJson: JSON.stringify(reply),
      model: 'fixture-model',
      promptVersion: 'supplier-reply.extract.v2',
      latencyMs: 40,
    };
    const unsupportedAnswer = structuredClone(reply);
    unsupportedAnswer.answers[0]!.supportingExcerpt = 'Invented excerpt.';
    await expect(
      t.mutation(internal.openaiStore.persistSupplierReply, {
        ...args,
        resultJson: JSON.stringify(unsupportedAnswer),
      }),
    ).rejects.toThrow('Unsupported answer excerpt');
    const unsupportedQuote = structuredClone(reply);
    unsupportedQuote.quote!.fieldEvidence = unsupportedQuote.quote!.fieldEvidence.filter(
      (evidence) => evidence.field !== 'unitPrice',
    );
    await expect(
      t.mutation(internal.openaiStore.persistSupplierReply, {
        ...args,
        resultJson: JSON.stringify(unsupportedQuote),
      }),
    ).rejects.toThrow('Unsupported quote evidence');
    await t.run(async (ctx) => ctx.db.patch(projectId, {status: 'archived'}));
    await expect(t.mutation(internal.openaiStore.persistSupplierReply, args)).rejects.toThrow(
      'not allowed',
    );
    await t.run(async (ctx) => ctx.db.patch(projectId, {status: 'awaiting_replies'}));
    await t.mutation(internal.openaiStore.persistSupplierReply, args);
    await t.mutation(internal.openaiStore.persistSupplierReply, args);
    const persisted = await t.run(async (ctx) => {
      const claims = await ctx.db
        .query('capabilityClaims')
        .withIndex('by_agentMailMessageId', (index) => index.eq('agentMailMessageId', messageId))
        .take(20);
      const quote = await ctx.db
        .query('quotes')
        .withIndex('by_sourceMessageId_and_parserVersion', (index) =>
          index.eq('sourceMessageId', messageId).eq('parserVersion', args.promptVersion),
        )
        .unique();
      const projectSupplier = await ctx.db
        .query('projectSuppliers')
        .withIndex('by_projectId_and_supplierId', (index) =>
          index.eq('projectId', projectId).eq('supplierId', supplierId),
        )
        .unique();
      return {claims, quote, projectSupplier};
    });
    expect(persisted.claims).toHaveLength(2);
    expect(persisted.claims.every((claim) => claim.sourceContentHash === sourceContentHash)).toBe(
      true,
    );
    expect(persisted.quote).toMatchObject({
      briefId,
      originalCurrency: 'MAD',
      quoteBasis: 'EXW',
      sourceContentHash,
    });
    expect(persisted.projectSupplier).toMatchObject({
      eligibility: 'provisionally_unqualified',
      preferenceFit: 17,
      evidenceCoverage: 12,
      commercialCompleteness: 88,
      openQuestionCount: 1,
    });
  });
});
