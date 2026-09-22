// @vitest-environment edge-runtime
/// <reference types="vite/client" />

import {convexTest} from 'convex-test';
import rateLimiterTest from '@convex-dev/rate-limiter/test';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {api, internal} from './_generated/api';
import schema from './schema';
import {
  buildQuoteResult,
  buildReplyText,
  isAutomatedMessage,
  quoteSpans,
  type QuoteExtraction,
} from './model/quoteInbox';

const replyToMessage = vi.hoisted(() => vi.fn(async () => 'outbound-id'));
vi.mock('./lib/agentMailClient', () => ({agentMail: {replyToMessage}}));

const modules = import.meta.glob('./**/*.ts');
const INBOX = 'makermesh@agentmail.to';

const quoteText = [
  'Hi Sam,',
  'Thanks for your enquiry. We can make the 200 cups.',
  'Price: 72 MAD per cup, EXW Safi.',
  'MOQ: 150',
  'Production takes 30 to 35 days after sample approval.',
  'Shipping is not included.',
].join('\n');

function message(overrides: Record<string, unknown> = {}) {
  return {
    inbox_id: INBOX,
    thread_id: 'thread-1',
    message_id: 'message-1',
    from: 'Sam Buyer <sam@example.com>',
    to: [INBOX],
    subject: 'Fwd: Quote for espresso cups',
    text: quoteText,
    timestamp: '2026-09-22T15:00:00Z',
    ...overrides,
  };
}

async function setup(enabled = true) {
  vi.stubEnv('AGENTMAIL_INBOX_ID', INBOX);
  vi.stubEnv('AGENTMAIL_DEMO_SUPPLIER_INBOX_ID', 'atlas@agentmail.to');
  vi.stubEnv('CONVEX_SITE_URL', 'https://site.example');
  const t = convexTest(schema, modules);
  rateLimiterTest.register(t);
  await t.mutation(internal.quoteInbox.setEnabled, {enabled});
  return t;
}

async function receive(t: Awaited<ReturnType<typeof setup>>, overrides = {}) {
  await t.mutation(internal.agentMail.onMessageReceived, {
    message: message(overrides),
    thread: {},
    eventId: `event-${Math.random()}`,
  });
}

async function quotes(t: Awaited<ReturnType<typeof setup>>) {
  return await t.run(async (ctx) => await ctx.db.query('forwardedQuotes').collect());
}

afterEach(() => {
  vi.unstubAllEnvs();
  replyToMessage.mockClear();
});

describe('quote reader model', () => {
  it('keeps short quote lines as citable spans', () => {
    const spans = quoteSpans(quoteText);
    expect(spans).toContain('MOQ: 150');
    expect(spans).toContain('Production takes 30 to 35 days after sample approval.');
  });

  it('uses verbatim spans and derives what is not stated', () => {
    const spans = quoteSpans(quoteText);
    const extraction: QuoteExtraction = {
      isQuote: true,
      supplierName: 'Atlas',
      supplierNameSpanIndex: 0,
      terms: [
        {
          kind: 'lead_time',
          label: 'Lead time',
          value: '30-35 days',
          condition: 'after sample approval',
          spanIndex: spans.indexOf('Production takes 30 to 35 days after sample approval.'),
        },
        {
          kind: 'price',
          label: 'Unit price',
          value: '72 MAD per cup',
          condition: 'EXW',
          spanIndex: spans.indexOf('Price: 72 MAD per cup, EXW Safi.'),
        },
      ],
      questions: ['Can you confirm packaging for export?'],
    };
    const result = buildQuoteResult(spans, extraction);
    expect(result.terms.map((t) => t.excerpt)).toEqual([
      'Production takes 30 to 35 days after sample approval.',
      'Price: 72 MAD per cup, EXW Safi.',
    ]);
    expect(result.supplierName).toBeNull();
    expect(result.notStated).toEqual([
      'Minimum order',
      'Shipping',
      'Payment terms',
      'How long the quote is valid',
    ]);
  });

  it('is not a quote without any cited term', () => {
    const result = buildQuoteResult(['Hello there'], {
      isQuote: true,
      supplierName: null,
      supplierNameSpanIndex: null,
      terms: [],
      questions: [],
    });
    expect(result.isQuote).toBe(false);
  });

  it('recognises automated mail', () => {
    expect(isAutomatedMessage({from: 'mailer-daemon@example.com'})).toBe(true);
    expect(isAutomatedMessage({from: 'a@b.com', subject: 'Out of Office: back Monday'})).toBe(true);
    expect(isAutomatedMessage({from: 'a@b.com', headers: {'Auto-Submitted': 'auto-replied'}})).toBe(
      true,
    );
    expect(isAutomatedMessage({from: 'a@b.com', subject: 'Fwd: quote'})).toBe(false);
  });

  it('writes a reply with excerpts and the private link', () => {
    const text = buildReplyText(
      {
        isQuote: true,
        supplierName: null,
        terms: [
          {
            kind: 'price',
            label: 'Unit price',
            value: '72 MAD',
            condition: null,
            excerpt: 'Price: 72 MAD',
          },
        ],
        notStated: ['Shipping'],
        questions: ['Is shipping included?'],
      },
      'https://site.example/q/token',
    );
    expect(text).toContain('"Price: 72 MAD"');
    expect(text).toContain('Not stated anywhere in the quote: Shipping.');
    expect(text).toContain('https://site.example/q/token');
  });
});

describe('quote inbox', () => {
  it('stores a forwarded quote privately and schedules reading', async () => {
    const t = await setup();
    await receive(t);
    const rows = await quotes(t);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.status).toBe('received');
    expect(rows[0]!.senderHash).not.toContain('sam@example.com');
    expect(rows[0]!.accessToken).toBeUndefined();
  });

  it('processes each message once and only the first message of a thread', async () => {
    const t = await setup();
    await receive(t);
    await receive(t);
    await receive(t, {message_id: 'message-2'});
    expect(await quotes(t)).toHaveLength(1);
  });

  it('does nothing while switched off', async () => {
    const t = await setup(false);
    await receive(t);
    expect(await quotes(t)).toHaveLength(0);
  });

  it('never answers automated mail or our own inboxes', async () => {
    const t = await setup();
    await receive(t, {subject: 'Automatic reply: away'});
    await receive(t, {thread_id: 't2', message_id: 'm2', from: 'atlas@agentmail.to'});
    await receive(t, {thread_id: 't3', message_id: 'm3', from: INBOX});
    await receive(t, {
      thread_id: 't4',
      message_id: 'm4',
      headers: {'Auto-Submitted': 'auto-replied'},
    });
    expect(await quotes(t)).toHaveLength(0);
  });

  it('limits each sender to three quotes an hour', async () => {
    const t = await setup();
    for (let i = 0; i < 5; i++) await receive(t, {thread_id: `t${i}`, message_id: `m${i}`});
    expect(await quotes(t)).toHaveLength(3);
  });

  it('ignores mail for other inboxes', async () => {
    const t = await setup();
    await receive(t, {inbox_id: 'someone-else@agentmail.to'});
    expect(await quotes(t)).toHaveLength(0);
  });

  it('shows the result only to the token holder and replies once', async () => {
    const t = await setup();
    await receive(t);
    const [row] = await quotes(t);
    const token = 'x'.repeat(32);
    expect(
      await t.mutation(internal.quoteInbox.claimReading, {quoteId: row!._id, accessToken: token}),
    ).toBe(true);
    const result = {
      isQuote: true,
      supplierName: null,
      terms: [
        {
          kind: 'price',
          label: 'Unit price',
          value: '72 MAD',
          condition: null,
          excerpt: 'Price: 72 MAD per cup, EXW Safi.',
        },
      ],
      notStated: ['Shipping'],
      questions: ['Is shipping included?'],
    };
    await t.mutation(internal.quoteInbox.saveResult, {quoteId: row!._id, result});
    await t.mutation(internal.quoteInbox.saveResult, {quoteId: row!._id, result});

    const page = await t.query(api.quoteInbox.get, {token});
    expect(page?.status).toBe('done');
    expect(page?.result?.terms[0]!.excerpt).toBe('Price: 72 MAD per cup, EXW Safi.');
    expect(await t.query(api.quoteInbox.get, {token: 'y'.repeat(32)})).toBeNull();

    const [updated] = await quotes(t);
    expect(updated!.repliedAt).toBeTypeOf('number');
    expect(replyToMessage).toHaveBeenCalledTimes(1);
    const [, inboxId, parentMessageId, reply] = replyToMessage.mock.calls[0] as unknown as [
      unknown,
      string,
      string,
      {text: string; headers: Record<string, string>},
    ];
    expect(inboxId).toBe(INBOX);
    expect(parentMessageId).toBe('message-1');
    expect(reply.headers['Auto-Submitted']).toBe('auto-replied');
    expect(reply.text).toContain(`/q/${token}`);
  });
});
