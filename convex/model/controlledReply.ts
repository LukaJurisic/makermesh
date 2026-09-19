import {v, type Infer} from 'convex/values';
import type {Id} from '../_generated/dataModel';
import type {QueryCtx} from '../_generated/server';
import {loadReplyOperationScope} from './replyScope';
import {sha256Hex} from './mailboxAllowlist';
import {evaluateClaimAgainstRequirement} from './evaluateRequirement';
import {FROZEN_CONTROLLED_REQUIREMENTS} from './controlledScenario';
import {outcomeValidator, quoteBasisValidator} from './validators';

// Public-safe authored text. Only a provider-processed message with these exact bytes
// (allowing transport line endings) may be published through this narrow demo path.
export const CONTROLLED_REPLY_TEXT = `Bonjour,

Ceci est une réponse fictive contrôlée pour Atlas Clay Studio — Demo Supplier, destinée uniquement à la démonstration MakerMesh. Aucun fournisseur réel ne fait cette offre.

Nous pouvons produire les 200 tasses artisanales en céramique, d'environ 8 onces chacune, pour Harbour Coffee Lab. Notre MOQ est de 150 unités. Le prix produit est de 72 MAD par tasse, base EXW; le fret, les douanes, les taxes et les droits sont exclus.

Un échantillon de préproduction avec le logo est disponible pour 650 MAD. Le logo peut être appliqué par décalcomanie ou peint à la main. La production prend 30 à 35 jours après validation de l'échantillon.

Nous pouvons fournir une déclaration concernant le contact alimentaire; aucun certificat ni rapport de laboratoire n'est joint à ce message. Nous avons déjà exporté vers l'Europe. Nous communiquons en français et en anglais.

La production est artisanale en petite série à Safi, au Maroc, avec une base mate sable ou blanc cassé, des détails vert foncé ou bleu encre et une variation artisanale visible.

L'expédition n'est pas incluse. L'emballage pour le transport international reste à confirmer. Les modalités de paiement restent à convenir.

Atlas Clay Studio — Demo Supplier
Démonstration fictive uniquement.`;

export const controlledReplyValidator = v.object({
  sentAt: v.number(),
  receivedAt: v.number(),
  extractedAt: v.number(),
  originalText: v.string(),
  evaluations: v.array(
    v.object({
      requirementKey: v.string(),
      requirementLabel: v.string(),
      type: v.union(v.literal('hard'), v.literal('soft')),
      weight: v.number(),
      outcome: outcomeValidator,
      supportingExcerpt: v.string(),
    }),
  ),
  quote: v.union(
    v.null(),
    v.object({
      currency: v.literal('MAD'),
      unitPrice: v.optional(v.number()),
      samplePrice: v.optional(v.number()),
      moq: v.optional(v.number()),
      productionMinDays: v.optional(v.number()),
      productionMaxDays: v.optional(v.number()),
      shippingIncluded: v.optional(v.boolean()),
      quoteBasis: quoteBasisValidator,
      sampleTerms: v.optional(v.string()),
      paymentTerms: v.optional(v.string()),
    }),
  ),
});
export type ControlledReply = Infer<typeof controlledReplyValidator>;

async function matchedPublicText(hash: string) {
  // AgentMail's provider-added signature is part of the received source, not
  // buyer-authored content. Permit only this observed literal suffix.
  for (const suffix of ['', '\n\n--\nSent via AgentMail']) {
    const body = CONTROLLED_REPLY_TEXT + suffix;
    for (const text of [
      body,
      `${body}\n`,
      body.replace(/\n/g, '\r\n'),
      `${body.replace(/\n/g, '\r\n')}\r\n`,
    ]) {
      if ((await sha256Hex(text)) === hash) return text;
    }
  }
  throw new Error('Reply is not the approved public-safe demonstration text.');
}

export async function loadControlledReply(
  ctx: {db: QueryCtx['db']},
  operationId: Id<'externalOperations'>,
) {
  const {operation, project, brief, draft, thread, supplier} = await loadReplyOperationScope(
    ctx,
    operationId,
  );
  if (
    operation.status !== 'completed' ||
    !draft.sentAt ||
    draft.status !== 'replied' ||
    thread.status !== 'replied' ||
    thread.inboundProcessedCount !== 1
  ) {
    throw new Error('A completed controlled send, reply, and extraction is required.');
  }
  const originalText = await matchedPublicText(operation.sourceContentHash!);
  const claims = await ctx.db
    .query('capabilityClaims')
    .withIndex('by_agentMailMessageId', (q) =>
      q.eq('agentMailMessageId', operation.sourceMessageId!),
    )
    .take(65);
  if (claims.length === 0 || claims.length > 64)
    throw new Error('Reply claims are missing or exceed the capture limit.');
  const requirements = await ctx.db
    .query('requirements')
    .withIndex('by_briefId_and_displayOrder', (q) => q.eq('briefId', brief._id))
    .take(100);
  const byKey = new Map<string, (typeof claims)[number]>();
  for (const claim of claims) {
    if (
      claim.projectId !== project._id ||
      claim.supplierId !== supplier._id ||
      claim.sourceContentHash !== operation.sourceContentHash ||
      claim.promptVersion !== operation.safeMetadata.parserVersion ||
      byKey.has(claim.key)
    )
      throw new Error('Reply evidence scope changed.');
    if (claim.supportingExcerpt && !originalText.includes(claim.supportingExcerpt))
      throw new Error('Reply evidence is not an exact excerpt.');
    byKey.set(claim.key, claim);
  }
  const evaluations = requirements.map((requirement) => {
    const frozen = FROZEN_CONTROLLED_REQUIREMENTS.find((item) => item.key === requirement.key)!;
    // Hard and preferred thresholds evaluate the same observed attribute.
    const sharedKey =
      requirement.key === 'moq_preferred'
        ? 'moq_max'
        : requirement.key === 'production_time_preferred'
          ? 'production_time'
          : requirement.key;
    const claim = byKey.get(requirement.key) ?? byKey.get(sharedKey);
    const claimRequirement = requirements.find((item) => item._id === claim?.requirementId);
    const supported =
      claim !== undefined &&
      (claimRequirement?.key === requirement.key || claimRequirement?.key === sharedKey) &&
      Boolean(claim.supportingExcerpt) &&
      claim.normalizedValue !== null &&
      claim.evidenceState === 'supplier_claimed' &&
      claim.expiresAt === undefined;
    const outcome = supported
      ? evaluateClaimAgainstRequirement(requirement, claim).outcome
      : ('unknown' as const);
    return {
      requirementKey: frozen.key,
      requirementLabel: frozen.label,
      type: frozen.type,
      weight: frozen.weight,
      outcome,
      supportingExcerpt: supported ? claim.supportingExcerpt : '',
    };
  });
  const quote = await ctx.db
    .query('quotes')
    .withIndex('by_sourceMessageId_and_parserVersion', (q) =>
      q
        .eq('sourceMessageId', operation.sourceMessageId!)
        .eq('parserVersion', String(operation.safeMetadata.parserVersion)),
    )
    .unique();
  let publicQuote: ControlledReply['quote'] = null;
  if (quote) {
    if (
      quote.projectId !== project._id ||
      quote.briefId !== brief._id ||
      quote.supplierId !== supplier._id ||
      quote.sourceContentHash !== operation.sourceContentHash ||
      quote.originalCurrency !== 'MAD'
    )
      throw new Error('Reply quote scope changed.');
    const evidence = new Map(
      (quote.evidenceExcerpts ?? []).map((item) => [item.field, item.supportingExcerpt]),
    );
    const hasEvidence = (field: Parameters<typeof evidence.get>[0]) => {
      const excerpt = evidence.get(field);
      return Boolean(excerpt && originalText.includes(excerpt));
    };
    if (!hasEvidence('originalCurrency')) throw new Error('Quote currency evidence is missing.');
    publicQuote = {
      currency: 'MAD',
      quoteBasis: hasEvidence('quoteBasis') ? quote.quoteBasis : 'unknown',
    };
    for (const key of [
      'unitPrice',
      'samplePrice',
      'moq',
      'productionMinDays',
      'productionMaxDays',
    ] as const) {
      const value = quote[key];
      if (value !== undefined && hasEvidence(key)) {
        if (!Number.isFinite(value) || value < 0 || value > 1_000_000)
          throw new Error('Quote value is outside the controlled range.');
        publicQuote[key] = value;
      }
    }
    if (quote.shippingIncluded !== undefined && hasEvidence('shippingIncluded'))
      publicQuote.shippingIncluded = quote.shippingIncluded;
    // Show exact public-safe source excerpts, never model-generated free text.
    for (const key of ['sampleTerms', 'paymentTerms'] as const) {
      if (quote[key] && hasEvidence(key)) publicQuote[key] = evidence.get(key)!;
    }
  }
  const proof: ControlledReply = {
    sentAt: draft.sentAt,
    receivedAt: operation.createdAt,
    extractedAt: operation.updatedAt,
    originalText,
    evaluations,
    quote: publicQuote,
  };
  return {
    proof,
    fingerprint: await sha256Hex(
      JSON.stringify({operationId, sourceHash: operation.sourceContentHash, claims, quote, proof}),
    ),
  };
}
