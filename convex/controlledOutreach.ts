import {z} from 'zod';
import {v} from 'convex/values';
import {internal} from './_generated/api';
import {action, env, internalMutation, mutation, query} from './_generated/server';
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
  configuredDemoSenderIdentityHashes,
  configuredDemoRecipient,
  demoMailboxBindingKey,
  isCanonicalControlledSupplier,
  requireCapturedResearchProof,
  requireControlledDraftScope,
  requireFreshControlledDraftScope,
  requireFreshDedicatedDemoRecipient,
  requireFrozenDemoBrief,
} from './model/controlledOutreach';
import {hashListIncludes, sha256Hex} from './model/mailboxAllowlist';
import {transitionProject} from './model/projectState';
import {requireOperator} from './model/requireOperator';

const preparationResultValidator = v.object({
  outreachDraftId: v.id('outreachDrafts'),
  created: v.boolean(),
  status: v.union(v.literal('draft'), v.literal('approved')),
  contentHash: v.string(),
});

const inboxResponseSchema = z
  .object({
    inbox_id: z.string().min(1).max(320),
    email: z.string().min(3).max(320),
    display_name: z.string().min(1).max(200).optional(),
  })
  .passthrough();

const AGENTMAIL_RESPONSE_LIMIT_BYTES = 10_000;
const AGENTMAIL_API_BASE_URLS = new Set([
  'https://api.agentmail.to/v0',
  'https://api.agentmail.eu/v0',
]);

function configuredAgentMailBaseUrl() {
  const configured = env.AGENTMAIL_BASE_URL?.trim() || 'https://api.agentmail.to/v0';
  let url: URL;
  try {
    url = new URL(configured);
  } catch {
    throw new Error('AgentMail API base URL is invalid.');
  }
  const normalized = `${url.origin}${url.pathname.replace(/\/+$/u, '')}`;
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !AGENTMAIL_API_BASE_URLS.has(normalized)
  ) {
    throw new Error('AgentMail API base URL is not an approved provider origin.');
  }
  return normalized;
}

async function readBoundedResponseText(response: Response) {
  const contentLength = response.headers.get('content-length');
  if (contentLength !== null) {
    const parsedLength = Number(contentLength);
    if (!Number.isSafeInteger(parsedLength) || parsedLength < 0) {
      throw new Error('AgentMail inbox verification returned an invalid content length.');
    }
    if (parsedLength > AGENTMAIL_RESPONSE_LIMIT_BYTES) {
      throw new Error('AgentMail inbox verification response exceeded the safe limit.');
    }
  }
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > AGENTMAIL_RESPONSE_LIMIT_BYTES) {
        await reader.cancel('response limit exceeded');
        throw new Error('AgentMail inbox verification response exceeded the safe limit.');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

export async function fetchAgentMailInbox(inboxId: string) {
  const apiKey = env.AGENTMAIL_API_KEY?.trim();
  if (!apiKey || apiKey.length > 512 || !/^[\x21-\x7e]+$/u.test(apiKey)) {
    throw new Error('AgentMail API credentials are not safely configured.');
  }
  if (!inboxId || inboxId.length > 320) {
    throw new Error('AgentMail inbox identifier is invalid.');
  }
  const baseUrl = configuredAgentMailBaseUrl();
  const response = await fetch(`${baseUrl}/inboxes/${encodeURIComponent(inboxId)}`, {
    method: 'GET',
    headers: {Authorization: `Bearer ${apiKey}`},
    redirect: 'error',
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`AgentMail inbox verification failed with status ${response.status}.`);
  }
  const responseText = await readBoundedResponseText(response);
  return inboxResponseSchema.parse(JSON.parse(responseText) as unknown);
}

export const recordDemoMailboxBinding = internalMutation({
  args: {
    senderInboxIdHash: v.string(),
    senderEmailHash: v.string(),
    senderDisplayNameHash: v.string(),
    inboxIdHash: v.string(),
    recipientHash: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    if (
      !/^[a-f0-9]{64}$/u.test(args.senderInboxIdHash) ||
      !/^[a-f0-9]{64}$/u.test(args.senderEmailHash) ||
      !/^[a-f0-9]{64}$/u.test(args.senderDisplayNameHash) ||
      !/^[a-f0-9]{64}$/u.test(args.inboxIdHash) ||
      !/^[a-f0-9]{64}$/u.test(args.recipientHash)
    ) {
      throw new Error('Controlled mailbox binding hashes are invalid.');
    }
    const senderInboxId = env.AGENTMAIL_INBOX_ID?.trim();
    const recipientInboxId = env.AGENTMAIL_DEMO_SUPPLIER_INBOX_ID?.trim();
    const senderIdentity = configuredDemoSenderIdentityHashes();
    if (
      !senderInboxId ||
      !recipientInboxId ||
      senderInboxId === recipientInboxId ||
      (await sha256Hex(senderInboxId)) !== args.senderInboxIdHash ||
      senderIdentity.senderEmailHash !== args.senderEmailHash ||
      senderIdentity.senderDisplayNameHash !== args.senderDisplayNameHash ||
      (await sha256Hex(recipientInboxId)) !== args.inboxIdHash ||
      env.CONTROLLED_DEMO_SUPPLIER_RECIPIENT_HASH?.trim().toLowerCase() !== args.recipientHash ||
      !hashListIncludes(env.CONTROLLED_OUTREACH_ALLOWLIST_HASHES, args.recipientHash)
    ) {
      throw new Error('Controlled mailbox binding does not match current server configuration.');
    }
    const key = demoMailboxBindingKey({
      senderInboxIdHash: args.senderInboxIdHash,
      senderEmailHash: args.senderEmailHash,
      senderDisplayNameHash: args.senderDisplayNameHash,
      recipientInboxIdHash: args.inboxIdHash,
      recipientHash: args.recipientHash,
    });
    const existing = await ctx.db
      .query('idempotencyRecords')
      .withIndex('by_key', (index) => index.eq('key', key))
      .unique();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {createdAt: now, expiresAt: now + 15 * 60 * 1000});
      return false;
    }
    await ctx.db.insert('idempotencyRecords', {
      key,
      scope: 'agentmail_demo_mailbox_binding',
      subjectKey: args.recipientHash,
      expiresAt: now + 15 * 60 * 1000,
      createdAt: now,
    });
    return true;
  },
});

export const verifyControlledDemoMailbox = action({
  args: {},
  returns: v.object({verified: v.boolean(), created: v.boolean()}),
  handler: async (ctx): Promise<{verified: boolean; created: boolean}> => {
    await ctx.runQuery(internal.operatorAuth.assertCurrent, {});
    const recipientInboxId = env.AGENTMAIL_DEMO_SUPPLIER_INBOX_ID?.trim();
    const senderInboxId = env.AGENTMAIL_INBOX_ID?.trim();
    if (!recipientInboxId || !senderInboxId) {
      throw new Error('Controlled sender or demo-supplier inbox is not configured.');
    }
    const [inbox, sender] = await Promise.all([
      fetchAgentMailInbox(recipientInboxId),
      fetchAgentMailInbox(senderInboxId),
    ]);
    if (inbox.inbox_id !== recipientInboxId) {
      throw new Error('AgentMail returned a different demo-supplier inbox.');
    }
    if (
      sender.inbox_id !== senderInboxId ||
      !['MakerMesh', 'MakerMesh on behalf of Harbour Coffee Lab'].includes(
        sender.display_name ?? '',
      )
    ) {
      throw new Error('AgentMail sender identity is not the configured MakerMesh inbox.');
    }
    const configured = await configuredDemoRecipient(inbox.email);
    const senderEmailHash = await sha256Hex(sender.email.trim().toLocaleLowerCase('en-US'));
    const senderDisplayNameHash = await sha256Hex(sender.display_name ?? '');
    const created: boolean = await ctx.runMutation(
      internal.controlledOutreach.recordDemoMailboxBinding,
      {
        senderInboxIdHash: await sha256Hex(sender.inbox_id),
        senderEmailHash,
        senderDisplayNameHash,
        inboxIdHash: await sha256Hex(inbox.inbox_id),
        recipientHash: configured.recipientHash,
      },
    );
    return {verified: true, created};
  },
});

export const prepareControlledDemoDraft = mutation({
  args: {recipient: v.string()},
  returns: preparationResultValidator,
  handler: async (ctx, args) => {
    await requireOperator(ctx);
    if (args.recipient.length < 5 || args.recipient.length > 320) {
      throw new Error('Controlled demo recipient is invalid.');
    }
    const recipient = await requireFreshDedicatedDemoRecipient(ctx, args.recipient);
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
    await requireFrozenDemoBrief(ctx, project, brief);
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
      if (!isCanonicalControlledSupplier(supplier)) {
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
        summary: CONTROLLED_ATLAS_SUMMARY,
        demoSupplier: true,
        consentStatus: 'preview_only',
        visualPath: CONTROLLED_ATLAS_VISUAL_PATH,
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

    const canonicalRecipient = recipient.canonicalRecipient;
    const template = buildControlledTemplate();
    const contentHash = await controlledDraftContentHash(canonicalRecipient);
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
      recipient: canonicalRecipient,
      recipientSource: CONTROLLED_RECIPIENT_SOURCE,
      subject: template.subject,
      bodyEnglish: template.bodyEnglish,
      bodyLocalized: template.bodyLocalized,
      language: CONTROLLED_LANGUAGE,
      questionKeys: template.questionKeys,
      status: 'draft',
      idempotencyKey,
      draftKind: 'controlled_demo',
      templateVersion: CONTROLLED_TEMPLATE_VERSION,
      recipientHash: recipient.recipientHash,
      recipientInboxId: recipient.recipientInboxId,
      recipientCount: CONTROLLED_RECIPIENT_COUNT,
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
    recipientCount: v.number(),
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
      recipientCount: draft.recipientCount!,
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
    const scope = await requireFreshControlledDraftScope(ctx, draft);
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
    await ctx.db.patch(draft._id, {
      status: 'approved',
      approvedAt,
      approvedContentHash: scope.contentHash,
    });
    return {status: 'approved' as const, approvedAt};
  },
});
