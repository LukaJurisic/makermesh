import {authTables} from '@convex-dev/auth/server';
import {defineSchema, defineTable} from 'convex/server';
import {v} from 'convex/values';
import {
  claimStatusValidator,
  captureEventValidator,
  dataModeValidator,
  discoveryStatusValidator,
  evidenceStateValidator,
  operationStatusValidator,
  outcomeValidator,
  outreachStatusValidator,
  projectStageValidator,
  projectStatusValidator,
  quoteBasisValidator,
  quoteEvidenceFieldValidator,
  rankingWeightsValidator,
  safeMetadataValidator,
  scalarValueValidator,
} from './model/validators';

export default defineSchema({
  ...authTables,

  operatorProfiles: defineTable({
    authUserId: v.id('users'),
    role: v.literal('operator'),
    disabledAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_authUserId', ['authUserId']),

  projects: defineTable({
    title: v.string(),
    slug: v.string(),
    buyerName: v.string(),
    destination: v.string(),
    defaultCurrency: v.string(),
    status: projectStatusValidator,
    currentApprovedBriefId: v.optional(v.id('briefs')),
    dataMode: dataModeValidator,
    demoMode: v.boolean(),
    presentationMode: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_slug', ['slug']),

  briefs: defineTable({
    projectId: v.id('projects'),
    version: v.number(),
    rawRequest: v.string(),
    productName: v.string(),
    productCategory: v.string(),
    quantity: v.number(),
    unit: v.string(),
    destination: v.string(),
    budget: v.number(),
    budgetCurrency: v.string(),
    deadlineDays: v.number(),
    customization: v.string(),
    dimensions: v.optional(
      v.array(
        v.object({
          label: v.string(),
          value: v.union(v.null(), v.number()),
          unit: v.union(v.null(), v.string()),
        }),
      ),
    ),
    materials: v.optional(v.array(v.string())),
    finish: v.optional(v.array(v.string())),
    budgetBasis: v.optional(v.string()),
    openClarifyingQuestions: v.optional(v.array(v.string())),
    assumptions: v.optional(v.array(v.string())),
    extractionModel: v.optional(v.string()),
    approvedAt: v.optional(v.number()),
    promptVersion: v.string(),
    createdAt: v.number(),
  })
    .index('by_projectId_and_version', ['projectId', 'version'])
    .index('by_projectId_and_approvedAt', ['projectId', 'approvedAt']),

  requirements: defineTable({
    projectId: v.id('projects'),
    briefId: v.id('briefs'),
    key: v.string(),
    label: v.string(),
    description: v.string(),
    type: v.union(v.literal('hard'), v.literal('soft')),
    operator: v.union(
      v.literal('lte'),
      v.literal('gte'),
      v.literal('equals'),
      v.literal('includes'),
      v.literal('one_of'),
      v.literal('stated'),
    ),
    targetValue: scalarValueValidator,
    unit: v.optional(v.string()),
    weight: v.number(),
    displayOrder: v.number(),
  })
    .index('by_briefId_and_displayOrder', ['briefId', 'displayOrder'])
    .index('by_briefId_and_key', ['briefId', 'key'])
    .index('by_projectId_and_key', ['projectId', 'key']),

  supplierEntities: defineTable({
    canonicalName: v.string(),
    slug: v.string(),
    country: v.string(),
    city: v.string(),
    websiteDomain: v.optional(v.string()),
    publicEmail: v.optional(v.string()),
    languages: v.array(v.string()),
    summary: v.string(),
    demoSupplier: v.boolean(),
    consentStatus: v.union(
      v.literal('not_requested'),
      v.literal('preview_only'),
      v.literal('approved'),
      v.literal('suppressed'),
    ),
    visualPath: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_websiteDomain', ['websiteDomain']),

  projectSuppliers: defineTable({
    projectId: v.id('projects'),
    supplierId: v.id('supplierEntities'),
    stage: v.union(
      v.literal('discovered'),
      v.literal('reviewed'),
      v.literal('outreach_selected'),
      v.literal('contacted'),
      v.literal('replied'),
    ),
    eligibility: v.union(
      v.literal('eligible'),
      v.literal('provisionally_unqualified'),
      v.literal('hard_failure'),
      v.literal('not_publicly_evaluated'),
    ),
    preferenceFit: v.number(),
    evidenceCoverage: v.number(),
    commercialCompleteness: v.number(),
    openQuestionCount: v.number(),
    latestActivityAt: v.number(),
  })
    .index('by_projectId_and_supplierId', ['projectId', 'supplierId'])
    .index('by_projectId_and_stage', ['projectId', 'stage'])
    .index('by_supplierId_and_projectId', ['supplierId', 'projectId']),

  supplierAliases: defineTable({
    supplierId: v.id('supplierEntities'),
    aliasType: v.union(
      v.literal('name'),
      v.literal('domain'),
      v.literal('email'),
      v.literal('phone'),
      v.literal('url'),
    ),
    aliasValue: v.string(),
    normalizedValue: v.string(),
    sourceId: v.optional(v.id('sources')),
  })
    .index('by_aliasType_and_normalizedValue', ['aliasType', 'normalizedValue'])
    .index('by_supplierId', ['supplierId'])
    .index('by_sourceId', ['sourceId']),

  sources: defineTable({
    projectId: v.id('projects'),
    supplierId: v.optional(v.id('supplierEntities')),
    sourceType: v.union(
      v.literal('official_site'),
      v.literal('directory'),
      v.literal('marketplace'),
      v.literal('supplier_email'),
      v.literal('demo_fixture'),
    ),
    canonicalUrl: v.string(),
    title: v.string(),
    domain: v.string(),
    fetchedAt: v.number(),
    contentHash: v.string(),
    firecrawlReference: v.optional(v.string()),
    excerpt: v.string(),
    truncated: v.boolean(),
    status: v.union(v.literal('active'), v.literal('stale'), v.literal('failed')),
    publicSafe: v.boolean(),
  })
    .index('by_projectId', ['projectId'])
    .index('by_projectId_and_supplierId', ['projectId', 'supplierId'])
    .index('by_projectId_and_canonicalUrl', ['projectId', 'canonicalUrl'])
    .index('by_projectId_and_contentHash', ['projectId', 'contentHash'])
    .index('by_supplierId_and_projectId', ['supplierId', 'projectId']),

  capabilityClaims: defineTable({
    projectId: v.id('projects'),
    supplierId: v.id('supplierEntities'),
    requirementId: v.optional(v.id('requirements')),
    key: v.string(),
    normalizedValue: scalarValueValidator,
    displayValue: v.string(),
    status: claimStatusValidator,
    evidenceState: evidenceStateValidator,
    sourceId: v.optional(v.id('sources')),
    agentMailMessageId: v.optional(v.string()),
    supportingExcerpt: v.string(),
    observedAt: v.number(),
    expiresAt: v.optional(v.number()),
    extractionModel: v.optional(v.string()),
    promptVersion: v.optional(v.string()),
    sourceContentHash: v.optional(v.string()),
  })
    .index('by_projectId_and_supplierId', ['projectId', 'supplierId'])
    .index('by_projectId_and_requirementId', ['projectId', 'requirementId'])
    .index('by_sourceId', ['sourceId'])
    .index('by_agentMailMessageId', ['agentMailMessageId'])
    .index('by_supplierId_and_projectId', ['supplierId', 'projectId']),

  requirementEvaluations: defineTable({
    projectId: v.id('projects'),
    supplierId: v.id('supplierEntities'),
    requirementId: v.id('requirements'),
    outcome: outcomeValidator,
    reasonCode: v.string(),
    displayValue: v.string(),
    evidenceClaimIds: v.array(v.id('capabilityClaims')),
    evaluatorVersion: v.string(),
    evaluatedAt: v.number(),
  })
    .index('by_projectId_and_supplierId', ['projectId', 'supplierId'])
    .index('by_projectId_and_requirementId', ['projectId', 'requirementId'])
    .index('by_supplierId_and_projectId', ['supplierId', 'projectId'])
    .index('by_supplierId_and_projectId_and_requirementId', [
      'supplierId',
      'projectId',
      'requirementId',
    ]),

  discoveryRuns: defineTable({
    projectId: v.id('projects'),
    briefId: v.id('briefs'),
    provider: v.literal('firecrawl'),
    query: v.string(),
    crawlUrl: v.optional(v.string()),
    status: discoveryStatusValidator,
    idempotencyKey: v.string(),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    resultCount: v.number(),
    errorCode: v.optional(v.string()),
    externalReference: v.optional(v.string()),
    resultReference: v.optional(v.string()),
  })
    .index('by_projectId_and_startedAt', ['projectId', 'startedAt'])
    .index('by_idempotencyKey', ['idempotencyKey'])
    .index('by_projectId_and_briefId_and_idempotencyKey', [
      'projectId',
      'briefId',
      'idempotencyKey',
    ])
    .index('by_briefId', ['briefId']),

  outreachDrafts: defineTable({
    projectId: v.id('projects'),
    briefId: v.id('briefs'),
    supplierId: v.id('supplierEntities'),
    recipient: v.string(),
    recipientSource: v.string(),
    subject: v.string(),
    bodyEnglish: v.string(),
    bodyLocalized: v.string(),
    language: v.string(),
    questionKeys: v.array(v.string()),
    status: outreachStatusValidator,
    idempotencyKey: v.string(),
    draftKind: v.optional(v.literal('controlled_demo')),
    templateVersion: v.optional(v.string()),
    recipientHash: v.optional(v.string()),
    contentHash: v.optional(v.string()),
    recipientInboxId: v.optional(v.string()),
    agentMailOutboundId: v.optional(v.string()),
    approvedAt: v.optional(v.number()),
    sentAt: v.optional(v.number()),
  })
    .index('by_projectId_and_status', ['projectId', 'status'])
    .index('by_projectId_and_supplierId', ['projectId', 'supplierId'])
    .index('by_idempotencyKey', ['idempotencyKey'])
    .index('by_supplierId_and_projectId', ['supplierId', 'projectId'])
    .index('by_briefId', ['briefId'])
    .index('by_briefId_and_status', ['briefId', 'status']),

  mailThreads: defineTable({
    projectId: v.id('projects'),
    briefId: v.optional(v.id('briefs')),
    supplierId: v.id('supplierEntities'),
    outreachDraftId: v.optional(v.id('outreachDrafts')),
    agentMailOutboundId: v.optional(v.string()),
    agentMailInboxId: v.optional(v.string()),
    agentMailThreadId: v.string(),
    inboundProcessedCount: v.optional(v.number()),
    status: outreachStatusValidator,
    latestMessageAt: v.number(),
  })
    .index('by_agentMailThreadId', ['agentMailThreadId'])
    .index('by_projectId_and_supplierId', ['projectId', 'supplierId'])
    .index('by_supplierId_and_projectId', ['supplierId', 'projectId'])
    .index('by_agentMailOutboundId', ['agentMailOutboundId'])
    .index('by_agentMailInboxId_and_agentMailThreadId', ['agentMailInboxId', 'agentMailThreadId'])
    .index('by_outreachDraftId', ['outreachDraftId']),

  quotes: defineTable({
    projectId: v.id('projects'),
    supplierId: v.id('supplierEntities'),
    briefId: v.optional(v.id('briefs')),
    sourceMessageId: v.string(),
    sourceContentHash: v.optional(v.string()),
    parserVersion: v.string(),
    evidenceExcerpts: v.optional(
      v.array(v.object({field: quoteEvidenceFieldValidator, supportingExcerpt: v.string()})),
    ),
    originalCurrency: v.string(),
    unitPrice: v.optional(v.number()),
    samplePrice: v.optional(v.number()),
    moq: v.optional(v.number()),
    productionMinDays: v.optional(v.number()),
    productionMaxDays: v.optional(v.number()),
    shippingIncluded: v.optional(v.boolean()),
    quoteBasis: quoteBasisValidator,
    paymentTerms: v.optional(v.string()),
    sampleTerms: v.optional(v.string()),
    validUntil: v.optional(v.number()),
    parsedAt: v.number(),
    extractionModel: v.string(),
    promptVersion: v.string(),
  })
    .index('by_projectId_and_supplierId', ['projectId', 'supplierId'])
    .index('by_sourceMessageId_and_parserVersion', ['sourceMessageId', 'parserVersion'])
    .index('by_supplierId_and_projectId', ['supplierId', 'projectId']),

  activityEvents: defineTable({
    projectId: v.id('projects'),
    supplierId: v.optional(v.id('supplierEntities')),
    provider: v.union(
      v.literal('convex'),
      v.literal('openai'),
      v.literal('firecrawl'),
      v.literal('agentmail'),
    ),
    eventType: v.string(),
    label: v.string(),
    status: operationStatusValidator,
    safeMetadata: safeMetadataValidator,
    occurredAt: v.number(),
    publicSafe: v.boolean(),
  })
    .index('by_projectId_and_occurredAt', ['projectId', 'occurredAt'])
    .index('by_projectId_and_publicSafe_and_occurredAt', ['projectId', 'publicSafe', 'occurredAt'])
    .index('by_supplierId_and_occurredAt', ['supplierId', 'occurredAt']),

  usageEvents: defineTable({
    projectId: v.id('projects'),
    discoveryRunId: v.optional(v.id('discoveryRuns')),
    provider: v.union(v.literal('openai'), v.literal('firecrawl'), v.literal('agentmail')),
    operation: v.string(),
    status: operationStatusValidator,
    latencyMs: v.optional(v.number()),
    cached: v.boolean(),
    occurredAt: v.number(),
  })
    .index('by_projectId_and_occurredAt', ['projectId', 'occurredAt'])
    .index('by_discoveryRunId', ['discoveryRunId']),

  projectMetrics: defineTable({
    projectId: v.id('projects'),
    sourcesAnalyzed: v.number(),
    makersDiscovered: v.number(),
    claimsExtracted: v.number(),
    openQuestions: v.number(),
    repliesReceived: v.number(),
    updatedAt: v.number(),
  }).index('by_projectId', ['projectId']),

  comparisonSettings: defineTable({
    projectId: v.id('projects'),
    weights: rankingWeightsValidator,
    updatedAt: v.number(),
  }).index('by_projectId', ['projectId']),

  passportPreviews: defineTable({
    supplierId: v.id('supplierEntities'),
    generatedFromProjectId: v.id('projects'),
    publicSlug: v.string(),
    status: v.union(v.literal('preview'), v.literal('approved'), v.literal('published')),
    approvedFields: v.array(v.string()),
    generatedAt: v.number(),
    publishedAt: v.optional(v.number()),
  })
    .index('by_publicSlug', ['publicSlug'])
    .index('by_supplierId', ['supplierId'])
    .index('by_generatedFromProjectId', ['generatedFromProjectId']),

  demoBaselines: defineTable({
    slug: v.string(),
    version: v.number(),
    baselineProjectId: v.id('projects'),
    capturedAt: v.number(),
    sourceMode: v.union(v.literal('fixture'), v.literal('captured_live')),
    captureLabel: v.string(),
    snapshotStorageId: v.optional(v.id('_storage')),
    captureScope: v.optional(v.literal('research_only')),
    captureSourceProjectId: v.optional(v.id('projects')),
    captureSourceBriefId: v.optional(v.id('briefs')),
    captureSourceOpenAIOperationId: v.optional(v.id('externalOperations')),
    captureSourceRunId: v.optional(v.id('discoveryRuns')),
    captureEvents: v.optional(v.array(captureEventValidator)),
    status: v.union(v.literal('draft'), v.literal('published'), v.literal('retired')),
  })
    .index('by_slug_and_status', ['slug', 'status'])
    .index('by_slug_and_version', ['slug', 'version'])
    .index('by_baselineProjectId', ['baselineProjectId'])
    .index('by_captureSourceRunId', ['captureSourceRunId'])
    .index('by_captureProjectId_briefId_scope', [
      'captureSourceProjectId',
      'captureSourceBriefId',
      'captureScope',
    ]),

  demoSessions: defineTable({
    sessionId: v.string(),
    baselineId: v.id('demoBaselines'),
    status: v.union(v.literal('active'), v.literal('expired')),
    createdAt: v.number(),
    lastActivityAt: v.number(),
    expiresAt: v.number(),
    commandCount: v.optional(v.number()),
  })
    .index('by_sessionId', ['sessionId'])
    .index('by_expiresAt', ['expiresAt'])
    .index('by_baselineId', ['baselineId']),

  demoSessionState: defineTable({
    sessionId: v.string(),
    currentStage: projectStageValidator,
    briefApprovedAt: v.optional(v.number()),
    replayStep: v.number(),
    selectedSupplierIds: v.array(v.id('supplierEntities')),
    outreachState: outreachStatusValidator,
    replyApplied: v.boolean(),
    weights: rankingWeightsValidator,
    presentationMode: v.boolean(),
    updatedAt: v.number(),
  }).index('by_sessionId', ['sessionId']),

  demoRequirementOverrides: defineTable({
    sessionId: v.string(),
    requirementKey: v.string(),
    targetValue: scalarValueValidator,
    weight: v.number(),
    updatedAt: v.number(),
  }).index('by_sessionId_and_requirementKey', ['sessionId', 'requirementKey']),

  demoSessionEvents: defineTable({
    sessionId: v.string(),
    replayStep: v.number(),
    eventType: v.string(),
    label: v.string(),
    occurredAt: v.number(),
  }).index('by_sessionId_and_occurredAt', ['sessionId', 'occurredAt']),

  productEvents: defineTable({
    sessionId: v.string(),
    projectId: v.optional(v.id('projects')),
    eventType: v.union(
      v.literal('landing_viewed'),
      v.literal('demo_opened'),
      v.literal('brief_approved'),
      v.literal('research_started'),
      v.literal('supplier_inspected'),
      v.literal('evidence_opened'),
      v.literal('outreach_reviewed'),
      v.literal('comparison_viewed'),
      v.literal('passport_shared'),
    ),
    occurredAt: v.number(),
    expiresAt: v.number(),
  })
    .index('by_sessionId_and_occurredAt', ['sessionId', 'occurredAt'])
    .index('by_sessionId_and_eventType', ['sessionId', 'eventType'])
    .index('by_projectId_and_occurredAt', ['projectId', 'occurredAt'])
    .index('by_expiresAt', ['expiresAt']),

  externalOperations: defineTable({
    projectId: v.id('projects'),
    provider: v.union(v.literal('openai'), v.literal('firecrawl'), v.literal('agentmail')),
    operation: v.string(),
    idempotencyKey: v.string(),
    scopeKey: v.optional(v.string()),
    briefId: v.optional(v.id('briefs')),
    supplierId: v.optional(v.id('supplierEntities')),
    outreachDraftId: v.optional(v.id('outreachDrafts')),
    sourceMessageId: v.optional(v.string()),
    sourceContentHash: v.optional(v.string()),
    requestHash: v.optional(v.string()),
    attempt: v.optional(v.number()),
    leaseExpiresAt: v.optional(v.number()),
    sideEffectStartedAt: v.optional(v.number()),
    status: operationStatusValidator,
    externalReference: v.optional(v.string()),
    resultReference: v.optional(v.string()),
    errorCode: v.optional(v.string()),
    safeMetadata: safeMetadataValidator,
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_idempotencyKey', ['idempotencyKey'])
    .index('by_provider_and_operation_and_scopeKey', ['provider', 'operation', 'scopeKey'])
    .index('by_provider_and_operation_and_projectId_and_idempotencyKey', [
      'provider',
      'operation',
      'projectId',
      'idempotencyKey',
    ])
    .index('by_projectId', ['projectId']),

  idempotencyRecords: defineTable({
    key: v.string(),
    scope: v.string(),
    subjectKey: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_key', ['key'])
    .index('by_subjectKey', ['subjectKey'])
    .index('by_expiresAt', ['expiresAt']),
});
