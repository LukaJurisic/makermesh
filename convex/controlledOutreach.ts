import {v} from 'convex/values';
import {mutation, query} from './_generated/server';
import {CONTROLLED_SMOKE_SLUG} from './model/controlledDemo';
import {
  buildControlledTemplate,
  CONTROLLED_ATLAS_NAME,
  CONTROLLED_ATLAS_SLUG,
  CONTROLLED_TEMPLATE_VERSION,
  controlledDraftContentHash,
  requireCapturedResearchProof,
  requireControlledDraftScope,
  requireDedicatedDemoRecipient,
} from './model/controlledOutreach';
import {transitionProject} from './model/projectState';
import {requireOperator} from './model/requireOperator';

const preparationResultValidator = v.object({
  outreachDraftId: v.id('outreachDrafts'),
  created: v.boolean(),
  status: v.union(v.literal('draft'), v.literal('approved')),
  contentHash: v.string(),
});

export const prepareControlledDemoDraft = mutation({
  args: {recipient: v.string()},
  returns: preparationResultValidator,
  handler: async (ctx, args) => {
    await requireOperator(ctx);
    if (args.recipient.length < 5 || args.recipient.length > 320) {
      throw new Error('Controlled demo recipient is invalid.');
    }
    const recipient = await requireDedicatedDemoRecipient(args.recipient);
    const project = await ctx.db
      .query('projects')
      .withIndex('by_slug', (index) => index.eq('slug', CONTROLLED_SMOKE_SLUG))
      .unique();
    if (
      !project ||
      project.dataMode !== 'live' ||
      !project.demoMode ||
      !['reviewing_candidates', 'outreach_ready'].includes(project.status) ||
      !project.currentApprovedBriefId
    ) {
      throw new Error('Controlled smoke project is not ready for outreach preparation.');
    }
    const brief = await ctx.db.get(project.currentApprovedBriefId);
    if (!brief || brief.projectId !== project._id || brief.approvedAt === undefined) {
      throw new Error('Current approved controlled brief is missing.');
    }
    await requireCapturedResearchProof(ctx, project, brief);

    const existingSuppliers = await ctx.db
      .query('supplierEntities')
      .withIndex('by_slug', (index) => index.eq('slug', CONTROLLED_ATLAS_SLUG))
      .take(2);
    if (existingSuppliers.length > 1) {
      throw new Error('Controlled Atlas supplier identity is duplicated.');
    }
    let supplier = existingSuppliers[0];
    if (supplier) {
      if (
        supplier.canonicalName !== CONTROLLED_ATLAS_NAME ||
        !supplier.demoSupplier ||
        supplier.publicEmail !== undefined ||
        supplier.consentStatus === 'suppressed'
      ) {
        throw new Error('Controlled Atlas slug is occupied by a mismatched supplier.');
      }
    } else {
      const now = Date.now();
      const supplierId = await ctx.db.insert('supplierEntities', {
        canonicalName: CONTROLLED_ATLAS_NAME,
        slug: CONTROLLED_ATLAS_SLUG,
        country: 'Morocco',
        city: 'Safi',
        languages: ['French', 'English'],
        summary: 'Fictional controlled-email participant for the MakerMesh demonstration.',
        demoSupplier: true,
        consentStatus: 'preview_only',
        visualPath: '/images/espresso-cup-study.webp',
        createdAt: now,
        updatedAt: now,
      });
      supplier = (await ctx.db.get(supplierId))!;
    }

    let appearance = await ctx.db
      .query('projectSuppliers')
      .withIndex('by_projectId_and_supplierId', (index) =>
        index.eq('projectId', project._id).eq('supplierId', supplier._id),
      )
      .unique();
    if (!appearance) {
      const appearanceId = await ctx.db.insert('projectSuppliers', {
        projectId: project._id,
        supplierId: supplier._id,
        stage: 'outreach_selected',
        eligibility: 'not_publicly_evaluated',
        preferenceFit: 0,
        evidenceCoverage: 0,
        commercialCompleteness: 0,
        openQuestionCount: 8,
        latestActivityAt: Date.now(),
      });
      appearance = (await ctx.db.get(appearanceId))!;
    } else if (
      appearance.eligibility !== 'not_publicly_evaluated' ||
      !['outreach_selected', 'contacted', 'replied'].includes(appearance.stage)
    ) {
      throw new Error('Controlled Atlas project appearance has incompatible state.');
    }

    const template = buildControlledTemplate();
    const contentHash = await controlledDraftContentHash(args.recipient);
    const idempotencyKey = [
      'agentmail:controlled-demo',
      project._id,
      brief._id,
      supplier._id,
      recipient.recipientHash,
      CONTROLLED_TEMPLATE_VERSION,
    ].join(':');
    const existingDraft = await ctx.db
      .query('outreachDrafts')
      .withIndex('by_idempotencyKey', (index) => index.eq('idempotencyKey', idempotencyKey))
      .unique();
    if (existingDraft) {
      const scope = await requireControlledDraftScope(ctx, existingDraft);
      if (
        scope.contentHash !== contentHash ||
        !['draft', 'approved'].includes(existingDraft.status)
      ) {
        throw new Error('Existing controlled draft cannot be overwritten or prepared again.');
      }
      if (project.status === 'reviewing_candidates') {
        await transitionProject(ctx, project, 'outreach_ready');
      }
      return {
        outreachDraftId: existingDraft._id,
        created: false,
        status: existingDraft.status as 'draft' | 'approved',
        contentHash,
      };
    }

    const outreachDraftId = await ctx.db.insert('outreachDrafts', {
      projectId: project._id,
      briefId: brief._id,
      supplierId: supplier._id,
      recipient: args.recipient,
      recipientSource: 'Dedicated project-owned AgentMail demo-supplier inbox',
      subject: template.subject,
      bodyEnglish: template.bodyEnglish,
      bodyLocalized: template.bodyLocalized,
      language: 'fr',
      questionKeys: template.questionKeys,
      status: 'draft',
      idempotencyKey,
      draftKind: 'controlled_demo',
      templateVersion: CONTROLLED_TEMPLATE_VERSION,
      recipientHash: recipient.recipientHash,
      recipientInboxId: recipient.recipientInboxId,
      contentHash,
    });
    if (project.status === 'reviewing_candidates') {
      await transitionProject(ctx, project, 'outreach_ready');
    }
    return {outreachDraftId, created: true, status: 'draft' as const, contentHash};
  },
});

export const getControlledDemoDraft = query({
  args: {outreachDraftId: v.id('outreachDrafts')},
  returns: v.object({
    outreachDraftId: v.id('outreachDrafts'),
    recipient: v.string(),
    recipientSource: v.string(),
    subject: v.string(),
    bodyEnglish: v.string(),
    bodyLocalized: v.string(),
    language: v.string(),
    questionKeys: v.array(v.string()),
    status: v.union(v.literal('draft'), v.literal('approved')),
    templateVersion: v.string(),
    contentHash: v.string(),
    approvedAt: v.union(v.null(), v.number()),
  }),
  handler: async (ctx, args) => {
    await requireOperator(ctx);
    const draft = await ctx.db.get(args.outreachDraftId);
    if (!draft || !['draft', 'approved'].includes(draft.status)) {
      throw new Error('Controlled demo draft is unavailable for review.');
    }
    await requireControlledDraftScope(ctx, draft);
    return {
      outreachDraftId: draft._id,
      recipient: draft.recipient,
      recipientSource: draft.recipientSource,
      subject: draft.subject,
      bodyEnglish: draft.bodyEnglish,
      bodyLocalized: draft.bodyLocalized,
      language: draft.language,
      questionKeys: draft.questionKeys,
      status: draft.status as 'draft' | 'approved',
      templateVersion: draft.templateVersion!,
      contentHash: draft.contentHash!,
      approvedAt: draft.approvedAt ?? null,
    };
  },
});

export const approveControlledDemoDraft = mutation({
  args: {
    outreachDraftId: v.id('outreachDrafts'),
    expectedContentHash: v.string(),
  },
  returns: v.object({status: v.literal('approved'), approvedAt: v.number()}),
  handler: async (ctx, args) => {
    await requireOperator(ctx);
    if (!/^[a-f0-9]{64}$/u.test(args.expectedContentHash)) {
      throw new Error('Expected controlled draft hash is invalid.');
    }
    const draft = await ctx.db.get(args.outreachDraftId);
    if (!draft) throw new Error('Controlled demo draft was not found.');
    const scope = await requireControlledDraftScope(ctx, draft);
    if (scope.contentHash !== args.expectedContentHash) {
      throw new Error('Controlled draft content changed after review.');
    }
    if (draft.status === 'approved' && draft.approvedAt) {
      return {status: 'approved' as const, approvedAt: draft.approvedAt};
    }
    if (
      draft.status !== 'draft' ||
      draft.approvedAt !== undefined ||
      draft.sentAt !== undefined ||
      draft.agentMailOutboundId !== undefined
    ) {
      throw new Error('Controlled draft cannot be approved from its current state.');
    }
    const approvedAt = Date.now();
    await ctx.db.patch(draft._id, {status: 'approved', approvedAt});
    return {status: 'approved' as const, approvedAt};
  },
});
