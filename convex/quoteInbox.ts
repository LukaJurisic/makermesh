import {HOUR, DAY, RateLimiter} from '@convex-dev/rate-limiter';
import {z} from 'zod';
import {v} from 'convex/values';
import {components, internal} from './_generated/api';
import type {Id} from './_generated/dataModel';
import type {MutationCtx} from './_generated/server';
import {env, internalMutation, internalQuery, query} from './_generated/server';
import {agentMail} from './lib/agentMailClient';
import {mailboxHash, normalizeMailbox, parseSingleMailboxHeader} from './model/mailboxAllowlist';
import {
  QUOTE_BODY_LIMIT,
  QUOTE_RETENTION_MS,
  buildReplyText,
  isAutomatedMessage,
  quotePageUrl,
  quoteResult,
  type QuoteResult,
} from './model/quoteInbox';

const quoteLimits = new RateLimiter(components.rateLimiter, {
  quoteSenderHour: {kind: 'fixed window', rate: 3, period: HOUR},
  quoteGlobalDay: {kind: 'fixed window', rate: 40, period: DAY},
});

const looseInboundSchema = z.object({
  inbox_id: z.string().min(1).max(200),
  thread_id: z.string().min(1).max(200),
  message_id: z.string().min(1).max(200),
  from: z.string().min(1).max(500),
  subject: z.string().max(1_000).optional(),
  text: z.string().optional(),
  extracted_text: z.string().optional(),
});

async function recordDecision(ctx: MutationCtx, key: string, reason: string) {
  await ctx.db.insert('idempotencyRecords', {
    key,
    scope: `quote_inbox:${reason}`,
    expiresAt: Date.now() + QUOTE_RETENTION_MS,
    createdAt: Date.now(),
  });
}

/**
 * Handles a new message to the project inbox that is not a reply on a known supplier thread.
 * Returns false when the message is not for the quote reader, so the caller keeps its existing
 * behaviour. Returns true once the message has been accepted or deliberately dropped.
 */
export async function receiveForwardedQuote(
  ctx: MutationCtx,
  rawMessage: unknown,
): Promise<boolean> {
  const parsed = looseInboundSchema.safeParse(rawMessage);
  if (!parsed.success) return false;
  const message = parsed.data;
  const inboxId = env.AGENTMAIL_INBOX_ID;
  if (!inboxId || message.inbox_id !== inboxId) return false;
  const supplierThread = await ctx.db
    .query('mailThreads')
    .withIndex('by_agentMailInboxId_and_agentMailThreadId', (q) =>
      q.eq('agentMailInboxId', inboxId).eq('agentMailThreadId', message.thread_id),
    )
    .first();
  if (supplierThread) return false;

  const key = `agentmail:quote:${inboxId}:${message.message_id}`;
  const seen = await ctx.db
    .query('idempotencyRecords')
    .withIndex('by_key', (q) => q.eq('key', key))
    .unique();
  if (seen) return true;

  const settings = await ctx.db
    .query('quoteInboxSettings')
    .withIndex('by_key', (q) => q.eq('key', 'public'))
    .unique();
  if (!settings?.enabled) {
    await recordDecision(ctx, key, 'disabled');
    return true;
  }

  let sender: string;
  try {
    sender = parseSingleMailboxHeader(message.from);
  } catch {
    await recordDecision(ctx, key, 'sender_unparseable');
    return true;
  }
  const ownInboxes = [inboxId, env.AGENTMAIL_DEMO_SUPPLIER_INBOX_ID]
    .filter((id): id is string => Boolean(id))
    .map(normalizeMailbox);
  const headers = (rawMessage as {headers?: unknown}).headers;
  if (
    ownInboxes.includes(normalizeMailbox(sender)) ||
    isAutomatedMessage({from: sender, subject: message.subject, headers})
  ) {
    await recordDecision(ctx, key, 'automated_or_own');
    return true;
  }

  // Only the first message of a thread is read. Replies to our own answer are ignored,
  // which also stops any loop with an auto-responder that slipped through.
  const existingThread = await ctx.db
    .query('forwardedQuotes')
    .withIndex('by_agentMailInboxId_and_agentMailThreadId', (q) =>
      q.eq('agentMailInboxId', inboxId).eq('agentMailThreadId', message.thread_id),
    )
    .first();
  if (existingThread) {
    await recordDecision(ctx, key, 'thread_already_answered');
    return true;
  }

  const body = (message.text ?? message.extracted_text ?? '').slice(0, QUOTE_BODY_LIMIT);
  if (!body.trim()) {
    await recordDecision(ctx, key, 'empty_body');
    return true;
  }

  const senderHash = await mailboxHash(sender);
  const senderLimit = await quoteLimits.limit(ctx, 'quoteSenderHour', {key: senderHash});
  if (!senderLimit.ok) {
    await recordDecision(ctx, key, 'sender_rate_limited');
    return true;
  }
  const globalLimit = await quoteLimits.limit(ctx, 'quoteGlobalDay');
  if (!globalLimit.ok) {
    await recordDecision(ctx, key, 'global_rate_limited');
    return true;
  }

  const now = Date.now();
  const quoteId = await ctx.db.insert('forwardedQuotes', {
    agentMailInboxId: inboxId,
    agentMailThreadId: message.thread_id,
    agentMailMessageId: message.message_id,
    senderHash,
    subject: (message.subject ?? '').slice(0, 300),
    body,
    status: 'received',
    createdAt: now,
    updatedAt: now,
    expiresAt: now + QUOTE_RETENTION_MS,
  });
  await recordDecision(ctx, key, 'accepted');
  await ctx.scheduler.runAfter(0, internal.quoteInboxActions.read, {quoteId});
  return true;
}

export const context = internalQuery({
  args: {quoteId: v.id('forwardedQuotes')},
  returns: v.union(v.null(), v.object({body: v.string(), subject: v.string(), status: v.string()})),
  handler: async (ctx, args) => {
    const quote = await ctx.db.get(args.quoteId);
    if (!quote) return null;
    return {body: quote.body, subject: quote.subject, status: quote.status};
  },
});

export const claimReading = internalMutation({
  args: {quoteId: v.id('forwardedQuotes'), accessToken: v.string()},
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const quote = await ctx.db.get(args.quoteId);
    if (!quote || quote.status !== 'received') return false;
    await ctx.db.patch(quote._id, {
      status: 'reading',
      accessToken: args.accessToken,
      updatedAt: Date.now(),
    });
    return true;
  },
});

async function replyOnce(
  ctx: MutationCtx,
  quoteId: Id<'forwardedQuotes'>,
  result: QuoteResult | null,
) {
  const quote = await ctx.db.get(quoteId);
  if (!quote || quote.repliedAt || !quote.accessToken) return;
  const text = buildReplyText(result, quotePageUrl(env.CONVEX_SITE_URL, quote.accessToken));
  await agentMail.replyToMessage(ctx, quote.agentMailInboxId, quote.agentMailMessageId, {
    text,
    labels: ['makermesh', 'quote-reader'],
    headers: {'Auto-Submitted': 'auto-replied'},
  });
  await ctx.db.patch(quote._id, {repliedAt: Date.now()});
}

export const saveResult = internalMutation({
  args: {quoteId: v.id('forwardedQuotes'), result: quoteResult},
  returns: v.null(),
  handler: async (ctx, args) => {
    const quote = await ctx.db.get(args.quoteId);
    if (!quote || quote.status !== 'reading') return null;
    await ctx.db.patch(quote._id, {status: 'done', result: args.result, updatedAt: Date.now()});
    await replyOnce(ctx, args.quoteId, args.result);
    return null;
  },
});

export const markFailed = internalMutation({
  args: {quoteId: v.id('forwardedQuotes'), error: v.string()},
  returns: v.null(),
  handler: async (ctx, args) => {
    const quote = await ctx.db.get(args.quoteId);
    if (!quote || quote.status !== 'reading') return null;
    await ctx.db.patch(quote._id, {
      status: 'failed',
      error: args.error.slice(0, 200),
      updatedAt: Date.now(),
    });
    await replyOnce(ctx, args.quoteId, null);
    return null;
  },
});

/** The private result page. Only the unguessable token grants access; nothing is listed. */
export const get = query({
  args: {token: v.string()},
  returns: v.union(
    v.null(),
    v.object({
      status: v.string(),
      subject: v.string(),
      receivedAt: v.number(),
      expiresAt: v.number(),
      result: v.union(v.null(), quoteResult),
    }),
  ),
  handler: async (ctx, args) => {
    if (args.token.length < 24 || args.token.length > 64) return null;
    const quote = await ctx.db
      .query('forwardedQuotes')
      .withIndex('by_accessToken', (q) => q.eq('accessToken', args.token))
      .unique();
    if (!quote) return null;
    return {
      status: quote.status,
      subject: quote.subject,
      receivedAt: quote.createdAt,
      expiresAt: quote.expiresAt,
      result: quote.result ?? null,
    };
  },
});

/** Kill switch, run by the operator from the Convex CLI. */
export const setEnabled = internalMutation({
  args: {enabled: v.boolean()},
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('quoteInboxSettings')
      .withIndex('by_key', (q) => q.eq('key', 'public'))
      .unique();
    if (existing) await ctx.db.patch(existing._id, {enabled: args.enabled, updatedAt: Date.now()});
    else
      await ctx.db.insert('quoteInboxSettings', {
        key: 'public',
        enabled: args.enabled,
        updatedAt: Date.now(),
      });
    return null;
  },
});

export const cleanupExpired = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const expired = await ctx.db
      .query('forwardedQuotes')
      .withIndex('by_expiresAt', (q) => q.lte('expiresAt', Date.now()))
      .take(50);
    for (const quote of expired) await ctx.db.delete(quote._id);
    return expired.length;
  },
});

/** Whether the public "email us a quote" entry points should be shown. */
export const status = query({
  args: {},
  returns: v.object({enabled: v.boolean()}),
  handler: async (ctx) => {
    const settings = await ctx.db
      .query('quoteInboxSettings')
      .withIndex('by_key', (q) => q.eq('key', 'public'))
      .unique();
    return {enabled: Boolean(settings?.enabled)};
  },
});
