import type {Doc} from '../_generated/dataModel';
import type {MutationCtx, QueryCtx} from '../_generated/server';
import {env} from '../_generated/server';
import {CONTROLLED_SMOKE_SLUG} from './controlledDemo';
import {FROZEN_CONTROLLED_REQUIREMENTS} from './controlledScenario';
import {canonicalSingleMailbox, hashListIncludes, mailboxHash, sha256Hex} from './mailboxAllowlist';

export const CONTROLLED_ATLAS_SLUG = 'atlas-clay-studio-controlled-demo';
export const CONTROLLED_ATLAS_NAME = 'Atlas Clay Studio — Demo Supplier';
export const CONTROLLED_ATLAS_SUMMARY =
  'Fictional controlled-email participant for the MakerMesh demonstration.';
export const CONTROLLED_ATLAS_VISUAL_PATH = '/images/espresso-cup-study.webp';
export const CONTROLLED_TEMPLATE_VERSION = 'atlas-controlled-rfq.v2';
export const CONTROLLED_RECIPIENT_SOURCE = 'Dedicated project-owned AgentMail demo-supplier inbox';
export const CONTROLLED_LANGUAGE = 'fr';
export const CONTROLLED_RECIPIENT_COUNT = 1;

export const FROZEN_CONTROLLED_ASSUMPTIONS = [
  'The product is a cup only; no saucers are included unless later specified.',
  'The 8-ounce capacity is treated as an approximate target, as stated by the buyer, rather than a precisely measured volume.',
  'The 42-calendar-day limit is recorded as the maximum stated production time; inclusion of sampling, approval, curing, and other pre-production steps is unresolved.',
  'The CAD 3,500 amount applies to the 200-cup product order and may or may not include sample, tooling, setup, or logo application costs; this requires confirmation.',
  'Freight, customs, taxes, and duties are excluded from the product budget exactly as stated.',
  'No cup diameter, height, weight, shape, handle design, glaze chemistry, packaging configuration, or logo specifications are assumed.',
  'A Moroccan production centre is required by the sourcing context, while the named cities are preferences rather than exclusive locations.',
] as const;

function normalizeFrozenText(value: string) {
  return value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('en-US')
    .replace(/[^a-z0-9]+/gu, ' ')
    .trim();
}

function normalizedListSignature(values: readonly string[]) {
  return values.map(normalizeFrozenText).sort().join('|');
}

const questionKeys = [
  'moq_and_price',
  'sample_terms',
  'lead_time',
  'custom_logo',
  'food_contact_docs',
  'export_history',
  'shipping_and_packaging',
  'payment_terms',
] as const;

export function buildControlledTemplate() {
  const subject = 'Demande de devis contrôlée — 200 tasses à espresso personnalisées';
  const bodyEnglish = `Hello,

MakerMesh is writing on behalf of Harbour Coffee Lab, a fictional demonstration buyer in Toronto. Atlas Clay Studio is also fictional, and this message is routed only to a project-owned controlled inbox. No real supplier is being contacted.

We are demonstrating a request for 200 handcrafted ceramic espresso cups, approximately 8 ounces each, with a custom café logo and a matte-sand or off-white base. The maximum acceptable MOQ is 250 units and production must be possible within 42 calendar days. The target product-only budget is CAD 3,500; freight, customs, taxes, and duties are excluded.

Please reply to these numbered demonstration questions:
1. What MOQ and original-currency unit price would you quote for 200 cups?
2. Is a pre-production sample available, can it include the logo application, and what would it cost?
3. What production lead-time range would you state?
4. Which custom-logo methods are available?
5. What glaze or food-contact documentation can you supply?
6. Have you exported previously, what quote basis applies (EXW, FOB, or delivered), and is shipping included?
7. What packaging would you use for international transport?
8. What payment terms would apply?

Sender: MakerMesh on behalf of Harbour Coffee Lab.

This is a one-shot controlled fictional demonstration. No further email will be sent unless the project owner manually reviews and approves it. You may reply with opt out.`;
  const bodyLocalized = `Bonjour,

MakerMesh vous contacte au nom de Harbour Coffee Lab, un acheteur fictif de démonstration à Toronto. Atlas Clay Studio est également fictif, et ce message est envoyé uniquement vers une boîte de réception contrôlée appartenant au projet. Aucun fournisseur réel n’est contacté.

Nous préparons une démonstration portant sur 200 tasses à espresso artisanales en céramique, d’environ 8 onces chacune, avec le logo personnalisé du café et une base mate couleur sable ou blanc cassé. Le MOQ maximal acceptable est de 250 unités et la production doit être possible dans un délai maximal de 42 jours calendaires. Le budget produit cible est de CAD 3,500; le fret, les douanes, les taxes et les droits sont exclus.

Merci de répondre à ces questions numérotées de démonstration :
1. Quel serait votre MOQ et quel prix unitaire, dans votre devise d’origine, proposeriez-vous pour 200 tasses ?
2. Un échantillon de préproduction est-il disponible, peut-il inclure l’application du logo, et à quel prix ?
3. Quelle fourchette de délai de production indiqueriez-vous ?
4. Quelles méthodes de personnalisation du logo sont disponibles ?
5. Quels documents concernant l’émail ou le contact alimentaire pouvez-vous fournir ?
6. Avez-vous déjà exporté, quelle base de prix s’applique (EXW, FOB ou livré), et l’expédition est-elle incluse ?
7. Quel emballage utiliseriez-vous pour un transport international ?
8. Quelles modalités de paiement s’appliqueraient ?

Expéditeur : MakerMesh au nom de Harbour Coffee Lab.

Il s’agit d’une démonstration fictive contrôlée et ponctuelle. Aucun autre message ne sera envoyé sans examen et approbation manuels du propriétaire du projet. Vous pouvez répondre « opt out ».`;
  return {subject, bodyEnglish, bodyLocalized, questionKeys: [...questionKeys]};
}

export async function controlledDraftContentHash(recipient: string) {
  const template = buildControlledTemplate();
  return hashControlledDraftContent({
    recipient,
    recipientSource: CONTROLLED_RECIPIENT_SOURCE,
    language: CONTROLLED_LANGUAGE,
    recipientCount: CONTROLLED_RECIPIENT_COUNT,
    templateVersion: CONTROLLED_TEMPLATE_VERSION,
    ...template,
  });
}

export async function hashControlledDraftContent(input: {
  recipient: string;
  recipientSource: string;
  language: string;
  recipientCount: number;
  templateVersion: string;
  subject: string;
  bodyEnglish: string;
  bodyLocalized: string;
  questionKeys: string[];
}) {
  const senderInboxId = env.AGENTMAIL_INBOX_ID?.trim();
  if (!senderInboxId) throw new Error('Controlled sender inbox is not configured.');
  const senderIdentity = configuredDemoSenderIdentityHashes();
  return sha256Hex(
    JSON.stringify({
      senderInboxIdHash: await sha256Hex(senderInboxId),
      ...senderIdentity,
      recipient: input.recipient,
      recipientSource: input.recipientSource,
      language: input.language,
      recipientCount: input.recipientCount,
      templateVersion: input.templateVersion,
      subject: input.subject,
      bodyEnglish: input.bodyEnglish,
      bodyLocalized: input.bodyLocalized,
      questionKeys: input.questionKeys,
    }),
  );
}

export async function configuredDemoRecipient(recipient: string) {
  const canonicalRecipient = canonicalSingleMailbox(recipient);
  const senderInboxId = env.AGENTMAIL_INBOX_ID?.trim();
  const recipientInboxId = env.AGENTMAIL_DEMO_SUPPLIER_INBOX_ID?.trim();
  if (!senderInboxId || !recipientInboxId || senderInboxId === recipientInboxId) {
    throw new Error('Controlled sender and demo-supplier inboxes are not safely configured.');
  }
  const recipientHash = await mailboxHash(canonicalRecipient);
  if (
    recipientHash !== env.CONTROLLED_DEMO_SUPPLIER_RECIPIENT_HASH?.trim().toLowerCase() ||
    !hashListIncludes(env.CONTROLLED_OUTREACH_ALLOWLIST_HASHES, recipientHash)
  ) {
    throw new Error('Recipient is not the dedicated controlled demo-supplier mailbox.');
  }
  return {canonicalRecipient, recipientHash, recipientInboxId, senderInboxId};
}

function configuredIdentityHash(name: string, value: string | undefined) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized || !/^[a-f0-9]{64}$/u.test(normalized)) {
    throw new Error(`${name} is not safely configured.`);
  }
  return normalized;
}

export function configuredDemoSenderIdentityHashes() {
  return {
    senderEmailHash: configuredIdentityHash(
      'Controlled sender email hash',
      env.CONTROLLED_DEMO_SENDER_EMAIL_HASH,
    ),
    senderDisplayNameHash: configuredIdentityHash(
      'Controlled sender display-name hash',
      env.CONTROLLED_DEMO_SENDER_DISPLAY_NAME_HASH,
    ),
  };
}

export function demoMailboxBindingKey(input: {
  senderInboxIdHash: string;
  senderEmailHash: string;
  senderDisplayNameHash: string;
  recipientInboxIdHash: string;
  recipientHash: string;
}) {
  return [
    'agentmail:demo-mailbox-binding:v2',
    input.senderInboxIdHash,
    input.senderEmailHash,
    input.senderDisplayNameHash,
    input.recipientInboxIdHash,
    input.recipientHash,
  ].join(':');
}

export async function requireDedicatedDemoRecipient(
  ctx: {db: MutationCtx['db'] | QueryCtx['db']},
  recipient: string,
) {
  const configured = await configuredDemoRecipient(recipient);
  const inboxIdHash = await sha256Hex(configured.recipientInboxId);
  const senderInboxIdHash = await sha256Hex(configured.senderInboxId);
  const senderIdentity = configuredDemoSenderIdentityHashes();
  const key = demoMailboxBindingKey({
    senderInboxIdHash,
    senderEmailHash: senderIdentity.senderEmailHash,
    senderDisplayNameHash: senderIdentity.senderDisplayNameHash,
    recipientInboxIdHash: inboxIdHash,
    recipientHash: configured.recipientHash,
  });
  const binding = await ctx.db
    .query('idempotencyRecords')
    .withIndex('by_key', (index) => index.eq('key', key))
    .unique();
  if (
    !binding ||
    binding.scope !== 'agentmail_demo_mailbox_binding' ||
    binding.subjectKey !== configured.recipientHash ||
    binding.expiresAt === undefined
  ) {
    throw new Error('Dedicated demo mailboxes and sender identity are not provider-verified.');
  }
  return configured;
}

export async function requireFreshDedicatedDemoRecipient(
  ctx: {db: MutationCtx['db']},
  recipient: string,
) {
  const configured = await requireDedicatedDemoRecipient(ctx, recipient);
  const senderIdentity = configuredDemoSenderIdentityHashes();
  const key = demoMailboxBindingKey({
    senderInboxIdHash: await sha256Hex(configured.senderInboxId),
    senderEmailHash: senderIdentity.senderEmailHash,
    senderDisplayNameHash: senderIdentity.senderDisplayNameHash,
    recipientInboxIdHash: await sha256Hex(configured.recipientInboxId),
    recipientHash: configured.recipientHash,
  });
  const binding = await ctx.db
    .query('idempotencyRecords')
    .withIndex('by_key', (index) => index.eq('key', key))
    .unique();
  if (!binding?.expiresAt || binding.expiresAt <= Date.now()) {
    throw new Error('Controlled mailbox provider verification has expired.');
  }
  return configured;
}

export function isCanonicalControlledSupplier(supplier: Doc<'supplierEntities'>) {
  return (
    supplier.slug === CONTROLLED_ATLAS_SLUG &&
    supplier.canonicalName === CONTROLLED_ATLAS_NAME &&
    supplier.country === 'Morocco' &&
    supplier.city === 'Safi' &&
    supplier.websiteDomain === undefined &&
    supplier.publicEmail === undefined &&
    [...supplier.languages].sort().join('|') === 'English|French' &&
    supplier.summary === CONTROLLED_ATLAS_SUMMARY &&
    supplier.demoSupplier &&
    supplier.consentStatus === 'preview_only' &&
    supplier.visualPath === CONTROLLED_ATLAS_VISUAL_PATH
  );
}

export async function requireCapturedResearchProof(
  ctx: {db: QueryCtx['db']},
  project: Doc<'projects'>,
  brief: Doc<'briefs'>,
) {
  const baselines = await ctx.db
    .query('demoBaselines')
    .withIndex('by_captureProjectId_briefId_scope', (index) =>
      index
        .eq('captureSourceProjectId', project._id)
        .eq('captureSourceBriefId', brief._id)
        .eq('captureScope', 'research_only'),
    )
    .take(2);
  if (
    baselines.length !== 1 ||
    baselines[0]!.status !== 'published' ||
    baselines[0]!.sourceMode !== 'captured_live' ||
    baselines[0]!.captureEvents?.length !== 2
  ) {
    throw new Error('Published controlled research proof is required before outreach preparation.');
  }
  return baselines[0]!;
}

export async function requireFrozenDemoBrief(
  ctx: {db: QueryCtx['db']},
  project: Doc<'projects'>,
  brief: Doc<'briefs'>,
) {
  const requirements = await ctx.db
    .query('requirements')
    .withIndex('by_briefId_and_displayOrder', (index) => index.eq('briefId', brief._id))
    .take(41);
  if (requirements.length > 40) throw new Error('Controlled brief exceeds the requirement limit.');
  const normalizeRequirement = (requirement: {
    key: string;
    label: string;
    description: string;
    type: string;
    operator: string;
    targetValue: string | number | boolean | null;
    unit?: string | null;
    weight: number;
    displayOrder: number;
  }) => ({
    key: requirement.key,
    label: normalizeFrozenText(requirement.label),
    description: normalizeFrozenText(requirement.description),
    type: requirement.type,
    operator: requirement.operator,
    targetValue:
      typeof requirement.targetValue === 'string'
        ? normalizeFrozenText(requirement.targetValue)
        : requirement.targetValue,
    unit: requirement.unit ? normalizeFrozenText(requirement.unit) : null,
    weight: requirement.weight,
    displayOrder: requirement.displayOrder,
  });
  const requirementsMatch =
    requirements.length === FROZEN_CONTROLLED_REQUIREMENTS.length &&
    requirements.every(
      (requirement) => requirement.projectId === project._id && requirement.briefId === brief._id,
    ) &&
    JSON.stringify(requirements.map(normalizeRequirement)) ===
      JSON.stringify(FROZEN_CONTROLLED_REQUIREMENTS.map(normalizeRequirement));
  const dimensions = brief.dimensions ?? [];
  const hasCapacityDimension =
    dimensions.length === 1 &&
    normalizeFrozenText(dimensions[0]!.label) === 'capacity' &&
    dimensions[0]!.value === 8 &&
    ['oz', 'ounce', 'ounces'].includes(normalizeFrozenText(dimensions[0]!.unit ?? ''));
  const productMatches =
    normalizeFrozenText(brief.productName) ===
    'custom moroccan ceramic espresso cups for harbour coffee lab';
  const categoryMatches = normalizeFrozenText(brief.productCategory) === 'custom moroccan ceramics';
  const customizationMatches =
    normalizeFrozenText(brief.customization) ===
    'harbour coffee lab custom cafe logo must be supported logo application method and artwork specifications are not yet defined';
  const finishMatches =
    normalizedListSignature(brief.finish ?? []) ===
    normalizedListSignature([
      'Preferred: matte sand or off-white base',
      'Preferred: dark green or ink-blue detailing',
      'Preferred: visible artisanal variation',
    ]);
  const assumptionsSignature = normalizedListSignature(brief.assumptions ?? []);
  if (
    brief.projectId !== project._id ||
    project.currentApprovedBriefId !== brief._id ||
    normalizeFrozenText(project.buyerName) !== 'harbour coffee lab fictional demonstration buyer' ||
    normalizeFrozenText(project.defaultCurrency) !== 'cad' ||
    brief.approvedAt === undefined ||
    brief.quantity !== 200 ||
    normalizeFrozenText(brief.unit) !== 'cups' ||
    normalizeFrozenText(brief.destination) !== 'toronto canada' ||
    brief.budget !== 3_500 ||
    brief.budgetCurrency !== 'CAD' ||
    normalizeFrozenText(brief.budgetBasis ?? '') !==
      'target product only budget before freight customs taxes and duties not a landed cost basis original supplier currencies must be preserved' ||
    assumptionsSignature !== normalizedListSignature(FROZEN_CONTROLLED_ASSUMPTIONS) ||
    brief.deadlineDays !== 42 ||
    !productMatches ||
    !categoryMatches ||
    !customizationMatches ||
    !requirementsMatch ||
    !hasCapacityDimension ||
    !finishMatches
  ) {
    throw new Error('Approved brief does not match the frozen controlled demonstration scope.');
  }
}

export async function requireControlledDraftScope(
  ctx: {db: MutationCtx['db'] | QueryCtx['db']},
  draft: Doc<'outreachDrafts'>,
) {
  const project = await ctx.db.get(draft.projectId);
  const brief = await ctx.db.get(draft.briefId);
  const supplier = await ctx.db.get(draft.supplierId);
  if (
    !project ||
    project.slug !== CONTROLLED_SMOKE_SLUG ||
    project.dataMode !== 'live' ||
    !project.demoMode ||
    !brief ||
    brief.projectId !== project._id ||
    brief.approvedAt === undefined ||
    project.currentApprovedBriefId !== brief._id ||
    !supplier ||
    !isCanonicalControlledSupplier(supplier) ||
    draft.projectId !== project._id ||
    draft.briefId !== brief._id ||
    draft.supplierId !== supplier._id ||
    draft.draftKind !== 'controlled_demo' ||
    draft.templateVersion !== CONTROLLED_TEMPLATE_VERSION ||
    draft.recipientSource !== CONTROLLED_RECIPIENT_SOURCE ||
    draft.language !== CONTROLLED_LANGUAGE ||
    draft.recipientCount !== CONTROLLED_RECIPIENT_COUNT
  ) {
    throw new Error('Controlled outreach draft scope is invalid.');
  }
  await requireFrozenDemoBrief(ctx, project, brief);
  await requireCapturedResearchProof(ctx, project, brief);
  const recipient = await requireDedicatedDemoRecipient(ctx, draft.recipient);
  if (draft.recipient !== recipient.canonicalRecipient) {
    throw new Error('Controlled outreach recipient is not canonical.');
  }
  const contentHash = await hashControlledDraftContent({
    recipient: draft.recipient,
    recipientSource: draft.recipientSource,
    language: draft.language,
    recipientCount: draft.recipientCount,
    templateVersion: draft.templateVersion,
    subject: draft.subject,
    bodyEnglish: draft.bodyEnglish,
    bodyLocalized: draft.bodyLocalized,
    questionKeys: draft.questionKeys,
  });
  const canonicalTemplateHash = await controlledDraftContentHash(draft.recipient);
  if (
    draft.recipientHash !== recipient.recipientHash ||
    draft.recipientInboxId !== recipient.recipientInboxId ||
    draft.contentHash !== contentHash ||
    contentHash !== canonicalTemplateHash
  ) {
    throw new Error('Controlled outreach draft content or recipient changed.');
  }
  if (
    draft.approvedAt !== undefined &&
    (!draft.approvedContentHash || draft.approvedContentHash !== contentHash)
  ) {
    throw new Error('Controlled outreach content no longer matches the approved bytes.');
  }
  return {project, brief, supplier, contentHash};
}

export async function requireFreshControlledDraftScope(
  ctx: {db: MutationCtx['db']},
  draft: Doc<'outreachDrafts'>,
) {
  const scope = await requireControlledDraftScope(ctx, draft);
  await requireFreshDedicatedDemoRecipient(ctx, draft.recipient);
  return scope;
}
