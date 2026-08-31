import {vEvent, vOutboundStatus, type OutboundId} from '@agentmail/convex';
import {DAY, RateLimiter} from '@convex-dev/rate-limiter';
import {z} from 'zod';
import {v} from 'convex/values';
import {components, internal} from './_generated/api';
import type {Id} from './_generated/dataModel';
import type {MutationCtx} from './_generated/server';
import {env, internalMutation, mutation, query} from './_generated/server';
import {promptRegistry} from './ai/prompts';
import {agentMail} from './lib/agentMailClient';
import {
  requireControlledDraftScope,
  requireFreshControlledDraftScope,
} from './model/controlledOutreach';
import {
  hashListIncludes,
  mailboxHash,
  normalizeMailbox,
  parseSingleMailboxHeader,
  sha256Hex,
} from './model/mailboxAllowlist';
import {mergeProviderDeliveryStatus} from './model/outreachState';
import {
  isCurrentApprovedBrief,
  isLiveProjectStatus,
  requireCurrentApprovedBrief,
  requireLiveProjectStatus,
  transitionProject,
} from './model/projectState';
import {requireOperator} from './model/requireOperator';

const INBOUND_OPERATION_LEASE_MS = 2 * 60 * 1000;
const inboundExtractionLimiter = new RateLimiter(components.rateLimiter, {
  projectDaily: {kind: 'fixed window', rate: 10, period: DAY},
  globalDaily: {kind: 'fixed window', rate: 100, period: DAY},
});

const inboundMessageSchema = z.object({
  inbox_id: z.string().min(1).max(200),
  thread_id: z.string().min(1).max(200),
  message_id: z.string().min(1).max(200),
  from: z.string().min(1).max(500),
  to: z.union([z.string().max(500), z.array(z.string().max(500)).max(20)]),
  subject: z.string().max(1_000).optional(),
  text: z.string().max(20_000).optional(),
  extracted_text: z.string().max(20_000).optional(),
  timestamp: z.string().min(1).max(100),
});

const eventMessageSchema = z
  .object({
    thread_id: z.string().min(1),
    message_id: z.string().min(1).optional(),
  })
  .passthrough();

const deliveryStatusValidator = v.union(
  v.null(),
  v.object({
    status: vOutboundStatus,
    threadLinked: v.boolean(),
    hasError: v.boolean(),
  }),
);

const sendStatusValidator = v.union(
  v.literal('queued'),
  v.literal('sent'),
  v.literal('delivered'),
  v.literal('replied'),
);

function mapOutboundStatus(status: string) {
  switch (status) {
    case 'pending':
      return 'queued' as const;
    case 'sent':
      return 'sent' as const;
    case 'delivered':
      return 'delivered' as const;
    case 'bounced':
      return 'bounced' as const;
    default:
      return 'failed' as const;
  }
}

async function recipientIsAllowlisted(recipient: string) {
  const digest = await mailboxHash(recipient);
  return hashListIncludes(env.CONTROLLED_OUTREACH_ALLOWLIST_HASHES, digest);
}

async function senderMatchesControlledRecipient(sender: string, recipient: string) {
  let normalizedSender: string;
  try {
    normalizedSender = parseSingleMailboxHeader(sender);
  } catch {
    return false;
  }
  if (normalizedSender === normalizeMailbox(recipient)) return recipientIsAllowlisted(recipient);
  const configured = env.CONTROLLED_REPLY_ALIAS_ALLOWLIST_HASHES;
  if (!configured) return false;
  const digest = await mailboxHash(normalizedSender);
  return hashListIncludes(configured, digest);
}

async function recordInboundDecision(
  ctx: MutationCtx,
  args: {
    key: string;
    messageId: string;
    projectId: Id<'projects'>;
    supplierId: Id<'supplierEntities'>;
    accepted: boolean;
    reason: string;
  },
) {
  await ctx.db.insert('idempotencyRecords', {
    key: args.key,
    scope: args.accepted ? 'agentmail_inbound' : 'agentmail_quarantine',
    subjectKey: args.messageId,
    createdAt: Date.now(),
  });
  if (!args.accepted) {
    await ctx.db.insert('activityEvents', {
      projectId: args.projectId,
      supplierId: args.supplierId,
      provider: 'agentmail',
      eventType: 'supplier_reply_quarantined',
      label: 'Inbound reply held for operator review',
      status: 'failed',
      safeMetadata: {reason: args.reason},
      occurredAt: Date.now(),
      publicSafe: false,
    });
  }
}

export const sendApproved = mutation({
  args: {outreachDraftId: v.id('outreachDrafts')},
  returns: v.object({status: sendStatusValidator, reused: v.boolean()}),
  handler: async (ctx, args) => {
    await requireOperator(ctx);
    const draft = await ctx.db.get(args.outreachDraftId);
    if (!draft) throw new Error('Outreach draft not found.');
    const controlledScope = await requireFreshControlledDraftScope(ctx, draft);
    const project = controlledScope.project;
    requireLiveProjectStatus(project, ['outreach_ready', 'awaiting_replies'], 'Real outreach');
    await requireCurrentApprovedBrief(ctx, project, draft.briefId);
    if (draft.agentMailOutboundId) {
      if (!['queued', 'sent', 'delivered', 'replied'].includes(draft.status)) {
        throw new Error('Existing controlled outbound state is inconsistent.');
      }
      return {
        status: draft.status as 'queued' | 'sent' | 'delivered' | 'replied',
        reused: true,
      };
    }
    if (draft.status !== 'approved' || !draft.approvedAt) {
      throw new Error('Explicit outreach approval is required.');
    }
    if (env.ALLOW_CONTROLLED_DEMO_OUTREACH !== 'true') {
      throw new Error('Controlled demo outreach is locked.');
    }
    if (!(await recipientIsAllowlisted(draft.recipient))) {
      throw new Error('Recipient is not on the controlled outreach allowlist.');
    }
    const inboxId = env.AGENTMAIL_INBOX_ID;
    if (!inboxId) throw new Error('AgentMail inbox is not configured.');
    let alreadySent = 0;
    for (const status of ['queued', 'sent', 'delivered', 'replied'] as const) {
      const drafts = await ctx.db
        .query('outreachDrafts')
        .withIndex('by_briefId_and_status', (index) =>
          index.eq('briefId', draft.briefId).eq('status', status),
        )
        .take(4);
      alreadySent += drafts.length;
    }
    if (alreadySent >= 3) throw new Error('The controlled outreach limit is three recipients.');

    const outboundId: OutboundId = await agentMail.sendMessage(ctx, inboxId, {
      to: draft.recipient,
      subject: draft.subject,
      text: `${draft.bodyLocalized}\n\n--- English copy ---\n\n${draft.bodyEnglish}`,
      labels: ['makermesh', `project-${project.slug}`, 'controlled-demo'],
    });
    const now = Date.now();
    await ctx.db.patch(draft._id, {
      status: 'queued',
      agentMailOutboundId: outboundId,
      sentAt: now,
    });
    if (project.status !== 'awaiting_replies') {
      await transitionProject(ctx, project, 'awaiting_replies', now);
    }
    await ctx.db.insert('activityEvents', {
      projectId: project._id,
      supplierId: draft.supplierId,
      provider: 'agentmail',
      eventType: 'outreach_queued',
      label: 'Approved controlled outreach queued',
      status: 'queued',
      safeMetadata: {controlled: true},
      occurredAt: now,
      publicSafe: false,
    });
    return {status: 'queued' as const, reused: false};
  },
});

export const getDeliveryStatus = query({
  args: {outreachDraftId: v.id('outreachDrafts')},
  returns: deliveryStatusValidator,
  handler: async (ctx, args) => {
    await requireOperator(ctx);
    const draft = await ctx.db.get(args.outreachDraftId);
    if (!draft?.agentMailOutboundId) return null;
    await requireControlledDraftScope(ctx, draft);
    const status = await agentMail.status(ctx, draft.agentMailOutboundId as OutboundId);
    if (!status) return null;
    return {
      status: status.status,
      threadLinked: Boolean(status.threadId),
      hasError: Boolean(status.errorMessage),
    };
  },
});

export const syncDeliveryStatus = mutation({
  args: {outreachDraftId: v.id('outreachDrafts')},
  returns: deliveryStatusValidator,
  handler: async (ctx, args) => {
    await requireOperator(ctx);
    const draft = await ctx.db.get(args.outreachDraftId);
    if (!draft?.agentMailOutboundId) return null;
    await requireControlledDraftScope(ctx, draft);
    const providerStatus = await agentMail.status(ctx, draft.agentMailOutboundId as OutboundId);
    if (!providerStatus) return null;
    const applicationStatus = mapOutboundStatus(providerStatus.status);
    const nextDraftStatus = mergeProviderDeliveryStatus(draft.status, applicationStatus);
    const now = Date.now();
    if (draft.status !== nextDraftStatus) {
      await ctx.db.patch(draft._id, {status: nextDraftStatus});
      await ctx.db.insert('activityEvents', {
        projectId: draft.projectId,
        supplierId: draft.supplierId,
        provider: 'agentmail',
        eventType: `outreach_${nextDraftStatus}`,
        label: `Controlled outreach ${nextDraftStatus}`,
        status:
          nextDraftStatus === 'failed' || nextDraftStatus === 'bounced' ? 'failed' : 'completed',
        safeMetadata: {controlled: true},
        occurredAt: now,
        publicSafe: false,
      });
    }
    if (providerStatus.threadId) {
      const existing = await ctx.db
        .query('mailThreads')
        .withIndex('by_agentMailOutboundId', (index) =>
          index.eq('agentMailOutboundId', draft.agentMailOutboundId),
        )
        .unique();
      if (existing) {
        const nextThreadStatus = mergeProviderDeliveryStatus(existing.status, applicationStatus);
        await ctx.db.patch(existing._id, {
          briefId: draft.briefId,
          outreachDraftId: draft._id,
          agentMailInboxId: env.AGENTMAIL_INBOX_ID,
          agentMailThreadId: providerStatus.threadId,
          status: nextThreadStatus,
          latestMessageAt: now,
        });
      } else {
        await ctx.db.insert('mailThreads', {
          projectId: draft.projectId,
          briefId: draft.briefId,
          supplierId: draft.supplierId,
          outreachDraftId: draft._id,
          agentMailOutboundId: draft.agentMailOutboundId,
          agentMailInboxId: env.AGENTMAIL_INBOX_ID,
          agentMailThreadId: providerStatus.threadId,
          inboundProcessedCount: 0,
          status: applicationStatus,
          latestMessageAt: now,
        });
      }
    }
    return {
      status: providerStatus.status,
      threadLinked: Boolean(providerStatus.threadId),
      hasError: Boolean(providerStatus.errorMessage),
    };
  },
});

export const onMessageReceived = internalMutation({
  args: {message: v.any(), thread: v.any(), eventId: v.string()},
  returns: v.null(),
  handler: async (ctx, args) => {
    const message = inboundMessageSchema.safeParse(args.message);
    if (!message.success || args.eventId.length < 8 || args.eventId.length > 180) return null;
    const configuredInboxId = env.AGENTMAIL_INBOX_ID;
    if (!configuredInboxId || message.data.inbox_id !== configuredInboxId) return null;
    const mailThread = await ctx.db
      .query('mailThreads')
      .withIndex('by_agentMailInboxId_and_agentMailThreadId', (index) =>
        index
          .eq('agentMailInboxId', configuredInboxId)
          .eq('agentMailThreadId', message.data.thread_id),
      )
      .unique();
    if (!mailThread?.outreachDraftId) return null;
    const idempotencyKey = `agentmail:inbound:${configuredInboxId}:${message.data.message_id}`;
    const existing = await ctx.db
      .query('idempotencyRecords')
      .withIndex('by_key', (index) => index.eq('key', idempotencyKey))
      .unique();
    if (existing) return null;

    const draft = await ctx.db.get(mailThread.outreachDraftId);
    const project = await ctx.db.get(mailThread.projectId);
    const brief = draft ? await ctx.db.get(draft.briefId) : null;
    const projectSupplier = await ctx.db
      .query('projectSuppliers')
      .withIndex('by_projectId_and_supplierId', (index) =>
        index.eq('projectId', mailThread.projectId).eq('supplierId', mailThread.supplierId),
      )
      .unique();
    if (!project || !draft) return null;

    let controlledScopeIsValid = false;
    try {
      await requireControlledDraftScope(ctx, draft);
      controlledScopeIsValid = true;
    } catch {
      controlledScopeIsValid = false;
    }

    const associationsMatch = Boolean(
      brief &&
      projectSupplier &&
      mailThread.briefId === draft.briefId &&
      draft.projectId === project._id &&
      draft.supplierId === mailThread.supplierId &&
      mailThread.agentMailOutboundId &&
      mailThread.agentMailOutboundId === draft.agentMailOutboundId,
    );
    const scopeIsCurrent =
      isLiveProjectStatus(project, ['awaiting_replies', 'comparing']) &&
      isCurrentApprovedBrief(project, brief);
    const draftCanReceive = Boolean(
      draft.approvedAt &&
      draft.agentMailOutboundId &&
      ['queued', 'sent', 'delivered'].includes(draft.status),
    );
    const senderMatches = await senderMatchesControlledRecipient(
      message.data.from,
      draft.recipient,
    );
    const rawOriginalText = message.data.extracted_text ?? message.data.text;
    const originalText = rawOriginalText?.slice(0, 12_000);
    const hasAnalyzableText = Boolean(originalText?.trim());
    const belowThreadQuota = (mailThread.inboundProcessedCount ?? 0) < 3;

    const quarantineReason = !controlledScopeIsValid
      ? 'controlled_scope_invalid'
      : !associationsMatch
        ? 'scope_mismatch'
        : !scopeIsCurrent
          ? 'stale_project_or_brief'
          : !draftCanReceive
            ? 'draft_not_receiving'
            : !senderMatches
              ? 'sender_mismatch'
              : !hasAnalyzableText
                ? 'message_text_missing'
                : !belowThreadQuota
                  ? 'thread_quota_reached'
                  : null;
    if (quarantineReason) {
      await recordInboundDecision(ctx, {
        key: idempotencyKey,
        messageId: message.data.message_id,
        projectId: project._id,
        supplierId: mailThread.supplierId,
        accepted: false,
        reason: quarantineReason,
      });
      return null;
    }

    const projectLimit = await inboundExtractionLimiter.limit(ctx, 'projectDaily', {
      key: project._id,
    });
    const globalLimit = await inboundExtractionLimiter.limit(ctx, 'globalDaily');
    if (!projectLimit.ok || !globalLimit.ok) {
      await recordInboundDecision(ctx, {
        key: idempotencyKey,
        messageId: message.data.message_id,
        projectId: project._id,
        supplierId: mailThread.supplierId,
        accepted: false,
        reason: 'extraction_quota_reached',
      });
      return null;
    }

    const now = Date.now();
    await recordInboundDecision(ctx, {
      key: idempotencyKey,
      messageId: message.data.message_id,
      projectId: project._id,
      supplierId: mailThread.supplierId,
      accepted: true,
      reason: 'accepted',
    });
    await ctx.db.patch(mailThread._id, {
      status: 'replied',
      latestMessageAt: now,
      inboundProcessedCount: (mailThread.inboundProcessedCount ?? 0) + 1,
    });
    await ctx.db.patch(mailThread.outreachDraftId, {status: 'replied'});
    await ctx.db.insert('activityEvents', {
      projectId: mailThread.projectId,
      supplierId: mailThread.supplierId,
      provider: 'agentmail',
      eventType: 'supplier_reply_received',
      label: 'New controlled supplier reply received',
      status: 'completed',
      safeMetadata: {hasText: Boolean(message.data.text ?? message.data.extracted_text)},
      occurredAt: now,
      publicSafe: false,
    });
    const sourceContentHash = await sha256Hex(originalText!);
    const parserVersion = promptRegistry.supplierReply.version;
    const extractionKey = `openai:reply:${project._id}:${draft.briefId}:${message.data.message_id}:${parserVersion}`;
    const existingExtraction = await ctx.db
      .query('externalOperations')
      .withIndex('by_provider_and_operation_and_projectId_and_idempotencyKey', (index) =>
        index
          .eq('provider', 'openai')
          .eq('operation', 'extract_supplier_reply')
          .eq('projectId', project._id)
          .eq('idempotencyKey', extractionKey),
      )
      .unique();
    if (!existingExtraction) {
      const operationId = await ctx.db.insert('externalOperations', {
        projectId: project._id,
        provider: 'openai',
        operation: 'extract_supplier_reply',
        idempotencyKey: extractionKey,
        scopeKey: `${draft._id}:${message.data.message_id}`,
        briefId: draft.briefId,
        supplierId: draft.supplierId,
        outreachDraftId: draft._id,
        sourceMessageId: message.data.message_id,
        sourceContentHash,
        requestHash: sourceContentHash,
        attempt: 1,
        leaseExpiresAt: now + INBOUND_OPERATION_LEASE_MS,
        status: 'queued',
        safeMetadata: {source: 'agentmail', parserVersion},
        createdAt: now,
        updatedAt: now,
      });
      await ctx.scheduler.runAfter(0, internal.openaiActions.extractSupplierReply, {
        operationId,
        attempt: 1,
      });
    }
    return null;
  },
});

export const onEvent = internalMutation({
  args: {event: vEvent},
  returns: v.null(),
  handler: async (ctx, args) => {
    const parsedMessage = eventMessageSchema.safeParse(args.event.message);
    if (!parsedMessage.success) return null;
    const mailThread = await ctx.db
      .query('mailThreads')
      .withIndex('by_agentMailThreadId', (index) =>
        index.eq('agentMailThreadId', parsedMessage.data.thread_id),
      )
      .unique();
    if (!mailThread) return null;
    const key = `agentmail-event:${args.event.event_id}`;
    const existing = await ctx.db
      .query('idempotencyRecords')
      .withIndex('by_key', (index) => index.eq('key', key))
      .unique();
    if (existing) return null;
    await ctx.db.insert('idempotencyRecords', {
      key,
      scope: 'agentmail_event',
      subjectKey: parsedMessage.data.thread_id,
      createdAt: Date.now(),
    });
    return null;
  },
});
