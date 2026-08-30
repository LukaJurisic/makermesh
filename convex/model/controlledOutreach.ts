import type {Doc} from '../_generated/dataModel';
import type {MutationCtx, QueryCtx} from '../_generated/server';
import {env} from '../_generated/server';
import {CONTROLLED_SMOKE_SLUG} from './controlledDemo';
import {hashListIncludes, mailboxHash, sha256Hex} from './mailboxAllowlist';

export const CONTROLLED_ATLAS_SLUG = 'atlas-clay-studio-controlled-demo';
export const CONTROLLED_ATLAS_NAME = 'Atlas Clay Studio — Demo Supplier';
export const CONTROLLED_TEMPLATE_VERSION = 'atlas-controlled-rfq.v1';

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

We are demonstrating a request for 200 handcrafted ceramic espresso cups, approximately 8 ounces each, with a custom café logo. The maximum acceptable MOQ is 250 units and production must be possible within 42 calendar days. The target product-only budget is CAD 3,500; freight, customs, taxes, and duties are excluded.

Please reply to these numbered demonstration questions:
1. What MOQ and original-currency unit price would you quote for 200 cups?
2. Is a logo sample available before production, and what would it cost?
3. What production lead-time range would you state?
4. Which custom-logo methods are available?
5. What glaze or food-contact documentation can you supply?
6. Have you exported previously, and is shipping included in the quote?
7. What packaging would you use for international transport?
8. What payment terms would apply?

Sender: MakerMesh on behalf of Harbour Coffee Lab.

This is a controlled fictional demonstration. If this inbox should not receive another test message, reply with opt out; no follow-up is automated.`;
  const bodyLocalized = `Bonjour,

MakerMesh vous contacte au nom de Harbour Coffee Lab, un acheteur fictif de démonstration à Toronto. Atlas Clay Studio est également fictif, et ce message est envoyé uniquement vers une boîte de réception contrôlée appartenant au projet. Aucun fournisseur réel n’est contacté.

Nous démontrons une demande de 200 tasses à espresso artisanales en céramique, d’environ 8 onces chacune, avec le logo personnalisé du café. Le MOQ maximal acceptable est de 250 unités et la production doit être possible sous 42 jours calendaires. Le budget produit cible est de CAD 3,500; le fret, les douanes, les taxes et les droits sont exclus.

Merci de répondre à ces questions numérotées de démonstration :
1. Quel MOQ et quel prix unitaire dans votre devise d’origine proposeriez-vous pour 200 tasses ?
2. Un échantillon avec logo est-il disponible avant la production, et à quel prix ?
3. Quelle fourchette de délai de production indiqueriez-vous ?
4. Quelles méthodes de personnalisation du logo sont disponibles ?
5. Quels documents concernant l’émail ou le contact alimentaire pouvez-vous fournir ?
6. Avez-vous déjà exporté, et l’expédition est-elle incluse dans le devis ?
7. Quel emballage utiliseriez-vous pour un transport international ?
8. Quelles modalités de paiement s’appliqueraient ?

Expéditeur : MakerMesh au nom de Harbour Coffee Lab.

Il s’agit d’une démonstration fictive contrôlée. Si cette boîte ne doit plus recevoir de message test, répondez « opt out »; aucun suivi n’est automatisé.`;
  return {subject, bodyEnglish, bodyLocalized, questionKeys: [...questionKeys]};
}

export async function controlledDraftContentHash(recipient: string) {
  const template = buildControlledTemplate();
  return sha256Hex(
    JSON.stringify({
      recipient,
      templateVersion: CONTROLLED_TEMPLATE_VERSION,
      ...template,
    }),
  );
}

export async function requireDedicatedDemoRecipient(recipient: string) {
  const senderInboxId = env.AGENTMAIL_INBOX_ID?.trim();
  const recipientInboxId = env.AGENTMAIL_DEMO_SUPPLIER_INBOX_ID?.trim();
  if (!senderInboxId || !recipientInboxId || senderInboxId === recipientInboxId) {
    throw new Error('Controlled sender and demo-supplier inboxes are not safely configured.');
  }
  const recipientHash = await mailboxHash(recipient);
  if (
    recipientHash !== env.CONTROLLED_DEMO_SUPPLIER_RECIPIENT_HASH?.trim().toLowerCase() ||
    !hashListIncludes(env.CONTROLLED_OUTREACH_ALLOWLIST_HASHES, recipientHash)
  ) {
    throw new Error('Recipient is not the dedicated controlled demo-supplier mailbox.');
  }
  return {recipientHash, recipientInboxId};
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
    supplier.slug !== CONTROLLED_ATLAS_SLUG ||
    supplier.canonicalName !== CONTROLLED_ATLAS_NAME ||
    !supplier.demoSupplier ||
    draft.projectId !== project._id ||
    draft.briefId !== brief._id ||
    draft.supplierId !== supplier._id ||
    draft.draftKind !== 'controlled_demo' ||
    draft.templateVersion !== CONTROLLED_TEMPLATE_VERSION
  ) {
    throw new Error('Controlled outreach draft scope is invalid.');
  }
  await requireCapturedResearchProof(ctx, project, brief);
  const recipient = await requireDedicatedDemoRecipient(draft.recipient);
  const contentHash = await controlledDraftContentHash(draft.recipient);
  if (
    draft.recipientHash !== recipient.recipientHash ||
    draft.recipientInboxId !== recipient.recipientInboxId ||
    draft.contentHash !== contentHash
  ) {
    throw new Error('Controlled outreach draft content or recipient changed.');
  }
  return {project, brief, supplier, contentHash};
}
