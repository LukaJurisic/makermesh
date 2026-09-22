import {z} from 'zod';
import {v, type Infer} from 'convex/values';

// Forwarded-quote reader: anyone can email a supplier quote to the project inbox and get back
// what it commits to. Everything here is pure so it can be tested without providers.

export const QUOTE_BODY_LIMIT = 20_000;
export const QUOTE_RETENTION_MS = 48 * 60 * 60 * 1000;
export const MAX_QUOTE_SPANS = 150;

export const termKinds = [
  'price',
  'minimum_order',
  'lead_time',
  'price_basis',
  'shipping',
  'payment',
  'sample',
  'validity',
  'packaging',
  'other',
] as const;
export type TermKind = (typeof termKinds)[number];

// What a buyer usually needs before ordering. Anything the quote does not cover with a cited
// sentence is reported as "not stated"; the model cannot mark an item as covered by itself.
export const buyerChecklist: Array<{kind: TermKind; label: string}> = [
  {kind: 'price', label: 'Price'},
  {kind: 'minimum_order', label: 'Minimum order'},
  {kind: 'lead_time', label: 'Lead time'},
  {kind: 'shipping', label: 'Shipping'},
  {kind: 'payment', label: 'Payment terms'},
  {kind: 'validity', label: 'How long the quote is valid'},
];

export const quoteTerm = v.object({
  kind: v.string(),
  label: v.string(),
  value: v.string(),
  condition: v.union(v.string(), v.null()),
  excerpt: v.string(),
});
export const quoteResult = v.object({
  isQuote: v.boolean(),
  supplierName: v.union(v.string(), v.null()),
  terms: v.array(quoteTerm),
  notStated: v.array(v.string()),
  questions: v.array(v.string()),
});
export type QuoteResult = Infer<typeof quoteResult>;

export const quoteStatus = v.union(
  v.literal('received'),
  v.literal('reading'),
  v.literal('done'),
  v.literal('failed'),
);

/** Splits an email body into short, citable spans. Keeps short lines like "MOQ: 150". */
export function quoteSpans(text: string): string[] {
  return text
    .replace(/\r/g, '')
    .split(/\n+|(?<=[.!?])\s+(?=[A-Z0-9"'(«])/u)
    .flatMap((line) => {
      const trimmed = line.replace(/^[>\s]+/u, '').trim();
      const spans: string[] = [];
      for (let i = 0; i < trimmed.length;) {
        let end = Math.min(i + 300, trimmed.length);
        if (end < trimmed.length && /[\uD800-\uDBFF]/.test(trimmed[end - 1]!)) end--;
        spans.push(trimmed.slice(i, end));
        i = end;
      }
      return spans;
    })
    .filter((span) => span.length >= 4 && /[\p{L}\p{N}]/u.test(span))
    .slice(0, MAX_QUOTE_SPANS);
}

export function quoteExtractionSchema(spanCount: number) {
  const maxIndex = Math.max(0, spanCount - 1);
  return z.object({
    isQuote: z.boolean(),
    supplierName: z.string().max(120).nullable(),
    supplierNameSpanIndex: z.number().int().min(0).max(maxIndex).nullable(),
    terms: z
      .array(
        z.object({
          kind: z.enum(termKinds),
          label: z.string().min(1).max(60),
          value: z.string().min(1).max(160),
          condition: z.string().max(160).nullable(),
          spanIndex: z.number().int().min(0).max(maxIndex),
        }),
      )
      .max(14),
    questions: z.array(z.string().min(5).max(300)).max(5),
  });
}
export type QuoteExtraction = z.infer<ReturnType<typeof quoteExtractionSchema>>;

/** Converts model output into a result whose every excerpt is a verbatim span. */
export function buildQuoteResult(spans: string[], extraction: QuoteExtraction): QuoteResult {
  const terms = extraction.terms
    .filter((term) => spans[term.spanIndex] !== undefined)
    .map((term) => ({
      kind: term.kind,
      label: term.label.trim(),
      value: term.value.trim(),
      condition: term.condition?.trim() || null,
      excerpt: spans[term.spanIndex]!,
    }));
  const covered = new Set(terms.map((t) => t.kind));
  const nameSpan =
    extraction.supplierNameSpanIndex === null ? undefined : spans[extraction.supplierNameSpanIndex];
  const supplierName =
    extraction.supplierName &&
    nameSpan?.toLowerCase().includes(extraction.supplierName.toLowerCase())
      ? extraction.supplierName.trim()
      : null;
  return {
    isQuote: extraction.isQuote && terms.length > 0,
    supplierName,
    terms,
    notStated: buyerChecklist.filter((item) => !covered.has(item.kind)).map((i) => i.label),
    questions: extraction.questions.map((q) => q.trim()).filter(Boolean),
  };
}

const autoReplySubject =
  /^(auto(matic)?[ -]?reply|out of (the )?office|autoresponder|undeliverable|delivery status notification|mail delivery failed|returned mail|abwesenheit|r[ée]ponse automatique|absence)/iu;
const robotSender = /^(mailer-daemon|postmaster|no-?reply|do-?not-?reply|bounce[s]?)@/iu;

/** True for bounces, out-of-office and other automated mail that must never get a reply. */
export function isAutomatedMessage(args: {
  from: string;
  subject?: string;
  headers?: unknown;
}): boolean {
  if (robotSender.test(args.from)) return true;
  if (args.subject && autoReplySubject.test(args.subject.trim())) return true;
  if (args.headers && typeof args.headers === 'object') {
    const headers = Object.fromEntries(
      Object.entries(args.headers as Record<string, unknown>).map(([k, val]) => [
        k.toLowerCase(),
        String(val).toLowerCase(),
      ]),
    );
    const autoSubmitted = headers['auto-submitted'];
    if (autoSubmitted && autoSubmitted !== 'no') return true;
    if (headers['x-autoreply'] || headers['x-autorespond']) return true;
    if (['bulk', 'junk', 'list', 'auto_reply'].includes(headers['precedence'] ?? '')) return true;
  }
  return false;
}

export function quotePageUrl(siteUrl: string, token: string) {
  return `${siteUrl.replace(/\/+$/, '')}/q/${token}`;
}

export function buildReplyText(result: QuoteResult | null, pageUrl: string): string {
  const footer = [
    '',
    `Full breakdown: ${pageUrl}`,
    '',
    'MakerMesh reads the text of your email only; attachments such as PDFs are not read yet.',
    'This email and the page are deleted after 48 hours. Built for the Convex All Gas Hackathon.',
  ];
  if (!result || !result.isQuote) {
    return [
      'Hi,',
      '',
      "Thanks for sending this. I couldn't find quote terms in the text of your email, such as a price, a minimum order or a lead time.",
      'If the quote is in an attachment, paste its text into the body of a new email and send it again.',
      ...footer,
    ].join('\n');
  }
  const lines = [
    'Hi,',
    '',
    `Here's what this quote${result.supplierName ? ` from ${result.supplierName}` : ''} actually commits to:`,
    '',
  ];
  for (const term of result.terms) {
    lines.push(`- ${term.label}: ${term.value}${term.condition ? ` (${term.condition})` : ''}`);
    lines.push(`  "${term.excerpt}"`);
  }
  if (result.notStated.length) {
    lines.push('', `Not stated anywhere in the quote: ${result.notStated.join(', ')}.`);
  }
  if (result.questions.length) {
    lines.push('', 'Questions to send back before you order:');
    result.questions.forEach((q, i) => lines.push(`${i + 1}. ${q}`));
  }
  return [...lines, ...footer].join('\n');
}
