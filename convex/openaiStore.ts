import {v} from 'convex/values';
import {internal} from './_generated/api';
import {internalMutation, mutation} from './_generated/server';
import {SourcingBriefSchema, SupplierReplySchema, type SupplierReply} from './ai/schemas';
import {evaluateClaimAgainstRequirement} from './model/evaluateRequirement';
import {requireLiveProjectStatus, transitionProject} from './model/projectState';
import {loadReplyOperationScope} from './model/replyScope';
import {requireOperator} from './model/requireOperator';

const OPERATION_LEASE_MS = 2 * 60 * 1000;
const MAX_OPERATION_ATTEMPTS = 3;

type QuoteEvidenceField = NonNullable<SupplierReply['quote']>['fieldEvidence'][number]['field'];

const quoteEvidenceFields = [
  'originalCurrency',
  'unitPrice',
  'samplePrice',
  'moq',
  'productionMinDays',
  'productionMaxDays',
  'shippingIncluded',
  'quoteBasis',
  'paymentTerms',
  'sampleTerms',
  'validUntil',
] as const satisfies readonly QuoteEvidenceField[];

async function sha256Hex(value: string) {
  const digest = new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)),
  );
  return [...digest].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function quoteFieldIsMaterial(
  quote: NonNullable<SupplierReply['quote']>,
  field: QuoteEvidenceField,
) {
  const value = quote[field];
  return value !== null && !(field === 'quoteBasis' && value === 'unknown');
}

function requireExactEvidence(result: SupplierReply, originalText: string) {
  for (const answer of result.answers) {
    if (!originalText.includes(answer.supportingExcerpt)) {
      throw new Error(`Unsupported answer excerpt for ${answer.requirementKey}.`);
    }
  }
  if (!result.quote) return;
  if (
    !result.quote.originalCurrency &&
    (result.quote.unitPrice !== null || result.quote.samplePrice !== null)
  ) {
    throw new Error('Quoted prices require an explicit original currency.');
  }
  const evidenceByField = new Map(
    result.quote.fieldEvidence.map((evidence) => [evidence.field, evidence.supportingExcerpt]),
  );
  for (const field of quoteEvidenceFields) {
    if (!quoteFieldIsMaterial(result.quote, field)) continue;
    const excerpt = evidenceByField.get(field);
    if (!excerpt || !originalText.includes(excerpt)) {
      throw new Error(`Unsupported quote evidence for ${field}.`);
    }
  }
}

export const reserve = internalMutation({
  args: {
    projectId: v.id('projects'),
    operation: v.literal('compile_brief'),
    idempotencyKey: v.string(),
    requestHash: v.string(),
  },
  returns: v.object({
    created: v.boolean(),
    operationId: v.id('externalOperations'),
    resultReference: v.union(v.null(), v.string()),
    attempt: v.number(),
  }),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    requireLiveProjectStatus(project, ['draft', 'brief_ready'], 'OpenAI brief compilation');
    if (!/^openai:compile:[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]{8,80}$/.test(args.idempotencyKey)) {
      throw new Error('Invalid OpenAI idempotency key.');
    }
    if (!/^[a-f0-9]{64}$/.test(args.requestHash)) {
      throw new Error('Invalid OpenAI request hash.');
    }
    const now = Date.now();
    const existing = await ctx.db
      .query('externalOperations')
      .withIndex('by_provider_and_operation_and_projectId_and_idempotencyKey', (index) =>
        index
          .eq('provider', 'openai')
          .eq('operation', args.operation)
          .eq('projectId', args.projectId)
          .eq('idempotencyKey', args.idempotencyKey),
      )
      .unique();
    if (existing) {
      if (existing.requestHash !== args.requestHash) {
        throw new Error('The OpenAI request identifier was reused with different input.');
      }
      const attempt = existing.attempt ?? 1;
      if (existing.status === 'completed') {
        return {
          created: false,
          operationId: existing._id,
          resultReference: existing.resultReference ?? null,
          attempt,
        };
      }
      if (
        (existing.status === 'queued' || existing.status === 'running') &&
        (existing.leaseExpiresAt ?? 0) > now
      ) {
        return {created: false, operationId: existing._id, resultReference: null, attempt};
      }
      if (attempt >= MAX_OPERATION_ATTEMPTS) {
        throw new Error('OpenAI operation retry limit reached.');
      }
      const nextAttempt = attempt + 1;
      await ctx.db.patch(existing._id, {
        status: 'running',
        attempt: nextAttempt,
        leaseExpiresAt: now + OPERATION_LEASE_MS,
        errorCode: undefined,
        updatedAt: now,
      });
      return {
        created: true,
        operationId: existing._id,
        resultReference: null,
        attempt: nextAttempt,
      };
    }
    const operationId = await ctx.db.insert('externalOperations', {
      projectId: project._id,
      provider: 'openai',
      operation: args.operation,
      idempotencyKey: args.idempotencyKey,
      scopeKey: `${project._id}:compile_brief`,
      requestHash: args.requestHash,
      attempt: 1,
      leaseExpiresAt: now + OPERATION_LEASE_MS,
      status: 'running',
      safeMetadata: {},
      createdAt: now,
      updatedAt: now,
    });
    return {created: true, operationId, resultReference: null, attempt: 1};
  },
});

export const persistCompiledBrief = internalMutation({
  args: {
    operationId: v.id('externalOperations'),
    projectId: v.id('projects'),
    rawRequest: v.string(),
    resultJson: v.string(),
    model: v.string(),
    promptVersion: v.string(),
    latencyMs: v.number(),
    attempt: v.number(),
  },
  returns: v.id('briefs'),
  handler: async (ctx, args) => {
    const operation = await ctx.db.get(args.operationId);
    if (
      !operation ||
      operation.projectId !== args.projectId ||
      operation.provider !== 'openai' ||
      operation.operation !== 'compile_brief' ||
      operation.attempt !== args.attempt ||
      operation.status === 'failed' ||
      operation.status === 'cancelled'
    ) {
      throw new Error('OpenAI operation does not match the project.');
    }
    if (operation.status === 'completed' && operation.resultReference) {
      const existingBriefId = ctx.db.normalizeId('briefs', operation.resultReference);
      if (!existingBriefId) throw new Error('Stored brief result reference is invalid.');
      return existingBriefId;
    }
    const project = await ctx.db.get(args.projectId);
    requireLiveProjectStatus(project, ['draft', 'brief_ready'], 'OpenAI brief persistence');
    const parsed = SourcingBriefSchema.parse(JSON.parse(args.resultJson) as unknown);
    const latest = await ctx.db
      .query('briefs')
      .withIndex('by_projectId_and_version', (index) => index.eq('projectId', project._id))
      .order('desc')
      .first();
    const now = Date.now();
    const briefId = await ctx.db.insert('briefs', {
      projectId: project._id,
      version: (latest?.version ?? 0) + 1,
      rawRequest: args.rawRequest,
      productName: parsed.product.name,
      productCategory: parsed.category,
      quantity: parsed.quantity.value,
      unit: parsed.quantity.unit,
      destination: parsed.destination,
      budget: parsed.budget.amount,
      budgetCurrency: parsed.budget.currency,
      deadlineDays: parsed.deadlineDays,
      customization: parsed.customization.join('; '),
      dimensions: parsed.dimensions,
      materials: parsed.materials,
      finish: parsed.finish,
      budgetBasis: parsed.budget.basis,
      openClarifyingQuestions: parsed.openClarifyingQuestions,
      assumptions: parsed.assumptions,
      extractionModel: args.model,
      promptVersion: args.promptVersion,
      createdAt: now,
    });
    let displayOrder = 0;
    for (const requirement of parsed.hardRequirements) {
      await ctx.db.insert('requirements', {
        projectId: project._id,
        briefId,
        key: requirement.key,
        label: requirement.label,
        description: requirement.description,
        type: 'hard',
        operator: requirement.operator,
        targetValue: requirement.targetValue,
        ...(requirement.unit ? {unit: requirement.unit} : {}),
        weight: 0,
        displayOrder,
      });
      displayOrder += 1;
    }
    for (const requirement of parsed.softPreferences) {
      await ctx.db.insert('requirements', {
        projectId: project._id,
        briefId,
        key: requirement.key,
        label: requirement.label,
        description: requirement.description,
        type: 'soft',
        operator: requirement.operator,
        targetValue: requirement.targetValue,
        ...(requirement.unit ? {unit: requirement.unit} : {}),
        weight: requirement.weight,
        displayOrder,
      });
      displayOrder += 1;
    }
    await ctx.db.patch(operation._id, {
      status: 'completed',
      resultReference: briefId,
      safeMetadata: {
        hardRequirementCount: parsed.hardRequirements.length,
        softPreferenceCount: parsed.softPreferences.length,
        openQuestionCount: parsed.openClarifyingQuestions.length,
        model: args.model,
        promptVersion: args.promptVersion,
      },
      updatedAt: now,
    });
    await ctx.db.insert('usageEvents', {
      projectId: project._id,
      provider: 'openai',
      operation: 'compile_brief',
      status: 'completed',
      latencyMs: args.latencyMs,
      cached: false,
      occurredAt: now,
    });
    await ctx.db.insert('activityEvents', {
      projectId: project._id,
      provider: 'openai',
      eventType: 'brief_structured',
      label: 'Sourcing brief structured for buyer review',
      status: 'completed',
      safeMetadata: {model: args.model, promptVersion: args.promptVersion},
      occurredAt: now,
      publicSafe: false,
    });
    return briefId;
  },
});

export const approveCompiledBrief = mutation({
  args: {briefId: v.id('briefs')},
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireOperator(ctx);
    const brief = await ctx.db.get(args.briefId);
    if (!brief) throw new Error('Brief not found.');
    const project = await ctx.db.get(brief.projectId);
    requireLiveProjectStatus(project, ['draft', 'brief_ready'], 'Brief approval');
    const latest = await ctx.db
      .query('briefs')
      .withIndex('by_projectId_and_version', (index) => index.eq('projectId', project._id))
      .order('desc')
      .first();
    if (!latest || latest._id !== brief._id) {
      throw new Error('Only the latest brief version can be approved.');
    }
    const now = Date.now();
    await ctx.db.patch(brief._id, {approvedAt: brief.approvedAt ?? now});
    if (project.status !== 'brief_ready') await transitionProject(ctx, project, 'brief_ready', now);
    await ctx.db.patch(project._id, {currentApprovedBriefId: brief._id, updatedAt: now});
    return null;
  },
});

export const claimReplyExtraction = internalMutation({
  args: {operationId: v.id('externalOperations'), expectedAttempt: v.number()},
  returns: v.object({
    attempt: v.number(),
    projectTitle: v.string(),
    supplierName: v.string(),
    threadId: v.string(),
    messageId: v.string(),
    sourceContentHash: v.string(),
    parserVersion: v.string(),
    requirements: v.array(v.object({key: v.string(), label: v.string()})),
  }),
  handler: async (ctx, args) => {
    const {operation, project, supplier, thread, brief} = await loadReplyOperationScope(
      ctx,
      args.operationId,
    );
    if (
      operation.attempt !== args.expectedAttempt ||
      operation.status !== 'queued' ||
      !operation.sourceMessageId ||
      typeof operation.safeMetadata.parserVersion !== 'string'
    ) {
      throw new Error('Supplier reply operation is not available for extraction.');
    }
    const requirements = await ctx.db
      .query('requirements')
      .withIndex('by_briefId_and_displayOrder', (index) => index.eq('briefId', brief._id))
      .take(100);
    const now = Date.now();
    await ctx.db.patch(operation._id, {
      status: 'running',
      sideEffectStartedAt: now,
      leaseExpiresAt: now + OPERATION_LEASE_MS,
      updatedAt: now,
    });
    return {
      attempt: operation.attempt ?? 1,
      projectTitle: project.title,
      supplierName: supplier.canonicalName,
      threadId: thread.agentMailThreadId,
      messageId: operation.sourceMessageId,
      sourceContentHash: operation.sourceContentHash!,
      parserVersion: operation.safeMetadata.parserVersion,
      requirements: requirements.map((requirement) => ({
        key: requirement.key,
        label: requirement.label,
      })),
    };
  },
});

export const retrySupplierReplyExtraction = mutation({
  args: {operationId: v.id('externalOperations')},
  returns: v.boolean(),
  handler: async (ctx, args) => {
    await requireOperator(ctx);
    const {operation} = await loadReplyOperationScope(ctx, args.operationId);
    if (operation.status === 'completed') return false;
    const now = Date.now();
    if (['queued', 'running'].includes(operation.status) && (operation.leaseExpiresAt ?? 0) > now) {
      throw new Error('Supplier reply extraction is already running.');
    }
    const attempt = operation.attempt ?? 1;
    if (attempt >= MAX_OPERATION_ATTEMPTS) {
      throw new Error('Supplier reply extraction retry limit reached.');
    }
    await ctx.db.patch(operation._id, {
      status: 'queued',
      attempt: attempt + 1,
      leaseExpiresAt: now + OPERATION_LEASE_MS,
      sideEffectStartedAt: undefined,
      errorCode: undefined,
      updatedAt: now,
    });
    await ctx.scheduler.runAfter(0, internal.openaiActions.extractSupplierReply, {
      operationId: operation._id,
      attempt: attempt + 1,
    });
    return true;
  },
});

export const persistSupplierReply = internalMutation({
  args: {
    operationId: v.id('externalOperations'),
    attempt: v.number(),
    originalText: v.string(),
    resultJson: v.string(),
    model: v.string(),
    promptVersion: v.string(),
    latencyMs: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const scope = await loadReplyOperationScope(ctx, args.operationId);
    const {operation, project, brief, supplier} = scope;
    if (operation.status === 'completed') return null;
    if (operation.attempt !== args.attempt || operation.status !== 'running') {
      throw new Error('Supplier reply persistence attempt is stale.');
    }
    if (operation.safeMetadata.parserVersion !== args.promptVersion) {
      throw new Error('Supplier reply parser version does not match the reserved operation.');
    }
    if (args.originalText.length < 1 || args.originalText.length > 12_000) {
      throw new Error('Supplier reply source text length is invalid.');
    }
    const result = SupplierReplySchema.parse(JSON.parse(args.resultJson) as unknown);
    const sourceContentHash = await sha256Hex(args.originalText);
    if (sourceContentHash !== operation.sourceContentHash) {
      throw new Error('Supplier reply source content changed before persistence.');
    }
    requireExactEvidence(result, args.originalText);
    const projectId = project._id;
    const briefId = brief._id;
    const supplierId = supplier._id;
    const messageId = operation.sourceMessageId!;
    const now = Date.now();
    const existingClaims = await ctx.db
      .query('capabilityClaims')
      .withIndex('by_agentMailMessageId', (index) => index.eq('agentMailMessageId', messageId))
      .take(100);
    const claimsByKey = new Map(existingClaims.map((claim) => [claim.key, claim]));

    for (const answer of result.answers.slice(0, 64)) {
      const requirement = await ctx.db
        .query('requirements')
        .withIndex('by_briefId_and_key', (index) =>
          index.eq('briefId', briefId).eq('key', answer.requirementKey),
        )
        .unique();
      const claimFields = {
        projectId,
        supplierId,
        ...(requirement ? {requirementId: requirement._id} : {}),
        key: answer.requirementKey,
        normalizedValue: answer.normalizedValue,
        displayValue: answer.displayValue,
        status: answer.status,
        evidenceState: 'supplier_claimed' as const,
        agentMailMessageId: messageId,
        supportingExcerpt: answer.supportingExcerpt,
        sourceContentHash,
        observedAt: now,
        extractionModel: args.model,
        promptVersion: args.promptVersion,
      };
      const existingClaim = claimsByKey.get(answer.requirementKey);
      const claimId = existingClaim
        ? (await ctx.db.replace(existingClaim._id, claimFields), existingClaim._id)
        : await ctx.db.insert('capabilityClaims', claimFields);
      if (requirement) {
        const evaluated = evaluateClaimAgainstRequirement(requirement, answer);
        const existingEvaluation = await ctx.db
          .query('requirementEvaluations')
          .withIndex('by_supplierId_and_projectId_and_requirementId', (index) =>
            index
              .eq('supplierId', supplierId)
              .eq('projectId', projectId)
              .eq('requirementId', requirement._id),
          )
          .unique();
        const evaluationFields = {
          projectId,
          supplierId,
          requirementId: requirement._id,
          outcome: evaluated.outcome,
          reasonCode: evaluated.reasonCode,
          displayValue: answer.displayValue,
          evidenceClaimIds: [claimId],
          evaluatorVersion: 'requirements.v1',
          evaluatedAt: now,
        };
        if (existingEvaluation) await ctx.db.replace(existingEvaluation._id, evaluationFields);
        else await ctx.db.insert('requirementEvaluations', evaluationFields);
      }
    }

    const quote = result.quote;
    if (quote?.originalCurrency) {
      const existingQuote = await ctx.db
        .query('quotes')
        .withIndex('by_sourceMessageId_and_parserVersion', (index) =>
          index.eq('sourceMessageId', messageId).eq('parserVersion', args.promptVersion),
        )
        .unique();
      const quoteFields = {
        projectId,
        supplierId,
        briefId,
        sourceMessageId: messageId,
        sourceContentHash,
        parserVersion: args.promptVersion,
        evidenceExcerpts: quote.fieldEvidence,
        originalCurrency: quote.originalCurrency,
        ...(quote.unitPrice !== null ? {unitPrice: quote.unitPrice} : {}),
        ...(quote.samplePrice !== null ? {samplePrice: quote.samplePrice} : {}),
        ...(quote.moq !== null ? {moq: quote.moq} : {}),
        ...(quote.productionMinDays !== null ? {productionMinDays: quote.productionMinDays} : {}),
        ...(quote.productionMaxDays !== null ? {productionMaxDays: quote.productionMaxDays} : {}),
        ...(quote.shippingIncluded !== null ? {shippingIncluded: quote.shippingIncluded} : {}),
        quoteBasis: quote.quoteBasis,
        ...(quote.paymentTerms ? {paymentTerms: quote.paymentTerms} : {}),
        ...(quote.sampleTerms ? {sampleTerms: quote.sampleTerms} : {}),
        ...(quote.validUntil && Number.isFinite(Date.parse(quote.validUntil))
          ? {validUntil: Date.parse(quote.validUntil)}
          : {}),
        parsedAt: now,
        extractionModel: args.model,
        promptVersion: args.promptVersion,
      };
      if (existingQuote) await ctx.db.replace(existingQuote._id, quoteFields);
      else await ctx.db.insert('quotes', quoteFields);
    }

    const evaluations = await ctx.db
      .query('requirementEvaluations')
      .withIndex('by_supplierId_and_projectId', (index) =>
        index.eq('supplierId', supplierId).eq('projectId', projectId),
      )
      .take(100);
    const requirements = await ctx.db
      .query('requirements')
      .withIndex('by_briefId_and_displayOrder', (index) => index.eq('briefId', briefId))
      .take(100);
    const evaluationsByRequirement = new Map(
      evaluations.map((evaluation) => [evaluation.requirementId, evaluation]),
    );
    const hardOutcomes = requirements
      .filter((requirement) => requirement.type === 'hard')
      .map(
        (requirement) =>
          evaluationsByRequirement.get(requirement._id)?.outcome ?? ('unknown' as const),
      );
    const eligibility = hardOutcomes.some((outcome) => outcome === 'fail')
      ? 'hard_failure'
      : hardOutcomes.some((outcome) => outcome === 'unknown')
        ? 'provisionally_unqualified'
        : 'eligible';
    const softRequirements = requirements.filter((requirement) => requirement.type === 'soft');
    const totalSoftWeight = softRequirements.reduce(
      (sum, requirement) => sum + requirement.weight,
      0,
    );
    const earnedSoftWeight = softRequirements.reduce((sum, requirement) => {
      const evaluation = evaluationsByRequirement.get(requirement._id);
      return sum + (evaluation?.outcome === 'pass' ? requirement.weight : 0);
    }, 0);
    const preferenceFit =
      totalSoftWeight === 0 ? 0 : Math.round((earnedSoftWeight / totalSoftWeight) * 100);
    const evidenceCoverage = Math.round(
      (requirements.filter(
        (requirement) =>
          (evaluationsByRequirement.get(requirement._id)?.evidenceClaimIds.length ?? 0) > 0,
      ).length /
        Math.max(requirements.length, 1)) *
        100,
    );
    const commercialFields = quote
      ? [
          quote.unitPrice,
          quote.originalCurrency,
          quote.quoteBasis === 'unknown' ? null : quote.quoteBasis,
          quote.moq,
          quote.productionMaxDays,
          quote.sampleTerms,
          quote.shippingIncluded,
          quote.paymentTerms,
        ]
      : [];
    const commercialCompleteness = Math.round(
      (commercialFields.filter((value) => value !== null && value !== undefined).length / 8) * 100,
    );
    const projectSupplier = await ctx.db
      .query('projectSuppliers')
      .withIndex('by_projectId_and_supplierId', (index) =>
        index.eq('projectId', projectId).eq('supplierId', supplierId),
      )
      .unique();
    if (projectSupplier) {
      await ctx.db.patch(projectSupplier._id, {
        stage: 'replied',
        eligibility,
        preferenceFit,
        evidenceCoverage,
        commercialCompleteness,
        openQuestionCount: result.unresolvedQuestions.length,
        latestActivityAt: now,
      });
    }

    await ctx.db.patch(operation._id, {
      status: 'completed',
      resultReference: messageId,
      safeMetadata: {answerCount: result.answers.length, quoteParsed: Boolean(quote)},
      updatedAt: now,
    });
    if (project.status === 'awaiting_replies') {
      await transitionProject(ctx, project, 'comparing', now);
    }
    await ctx.db.insert('usageEvents', {
      projectId,
      provider: 'openai',
      operation: 'extract_supplier_reply',
      status: 'completed',
      latencyMs: args.latencyMs,
      cached: false,
      occurredAt: now,
    });
    await ctx.db.insert('activityEvents', {
      projectId,
      supplierId,
      provider: 'openai',
      eventType: 'supplier_reply_structured',
      label: 'Supplier reply structured from original message',
      status: 'completed',
      safeMetadata: {answerCount: result.answers.length, model: args.model},
      occurredAt: now,
      publicSafe: false,
    });
    return null;
  },
});

export const markFailed = internalMutation({
  args: {operationId: v.id('externalOperations'), attempt: v.number(), errorCode: v.string()},
  returns: v.null(),
  handler: async (ctx, args) => {
    const operation = await ctx.db.get(args.operationId);
    if (!operation || operation.status === 'completed' || operation.attempt !== args.attempt) {
      return null;
    }
    await ctx.db.patch(operation._id, {
      status: 'failed',
      errorCode: args.errorCode,
      updatedAt: Date.now(),
    });
    return null;
  },
});
