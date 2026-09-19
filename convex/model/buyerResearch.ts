import {v, type Infer} from 'convex/values';
import {z} from 'zod';

export const researchInput = v.object({
  request: v.string(),
  quantity: v.string(),
  destination: v.string(),
  budget: v.string(),
  timing: v.string(),
});
export const requirement = v.object({
  key: v.string(),
  label: v.string(),
  kind: v.union(v.literal('must'), v.literal('prefer')),
  question: v.string(),
});
export const researchBrief = v.object({
  product: v.string(),
  summary: v.string(),
  searchQuery: v.string(),
  requirements: v.array(requirement),
});
export const researchState = v.union(
  ...(
    [
      'compiling',
      'review',
      'searching',
      'reading',
      'extracting',
      'complete',
      'failed',
      'out_of_scope',
    ] as const
  ).map((s) => v.literal(s)),
);
export const researchFact = v.object({requirementKey: v.string(), excerpt: v.string()});
export const researchSource = v.object({
  url: v.string(),
  title: v.string(),
  observedAt: v.number(),
  makerName: v.union(v.null(), v.string()),
  kind: v.union(v.literal('maker'), v.literal('directory'), v.literal('unclear')),
  facts: v.array(researchFact),
  locationExcerpt: v.optional(v.string()),
});
export type ResearchInput = Infer<typeof researchInput>;
export type ResearchBrief = Infer<typeof researchBrief>;
export type ResearchSource = Infer<typeof researchSource>;

export function makerDiscoveryQuery(product: string) {
  const lower = product.toLowerCase();
  const noun = /plates?|assiettes?/.test(lower)
    ? 'plates'
    : /cups?|mugs?|tasses?/.test(lower)
      ? 'cups'
      : /bowls?|bols?/.test(lower)
        ? 'bowls'
        : /vases?/.test(lower)
          ? 'vases'
          : 'tableware';
  const french: Record<string, string> = {
    plates: 'assiettes',
    cups: 'tasses',
    bowls: 'bols',
    vases: 'vases',
    tableware: 'vaisselle',
  };
  return `Morocco pottery ceramic manufacturer atelier\nMaroc fabricant poterie artisanale ${french[noun]}`;
}
export function isDiscoveryHost(host: string) {
  const normalized = host.toLowerCase().replace(/^www\./, '');
  return ![
    'etsy.com',
    'pinterest.com',
    'amazon.com',
    'ebay.com',
    'walmart.com',
    'tripadvisor.com',
    'instagram.com',
    'facebook.com',
    'youtube.com',
    'made-in-china.com',
    'alibaba.com',
  ].some((domain) => normalized === domain || normalized.endsWith(`.${domain}`));
}

export const ResearchBriefSchema = z.object({
  inScope: z.boolean(),
  product: z.string().min(1).max(100),
  summary: z.string().max(500),
  searchQuery: z.string().min(5).max(200),
  requirements: z
    .array(
      z.object({
        key: z.string().regex(/^[a-z][a-z0-9_]{0,39}$/),
        label: z.string().min(1).max(80),
        kind: z.enum(['must', 'prefer']),
        question: z.string().min(1).max(220),
      }),
    )
    .min(1)
    .max(12),
});

export function validateResearchInput(input: ResearchInput) {
  if (input.request.trim().length < 20 || input.request.length > 2000)
    throw new Error('Describe the product in 20–2,000 characters.');
  if (input.destination.trim().length < 2 || input.destination.length > 120)
    throw new Error('Add a destination (up to 120 characters).');
  if ([input.quantity, input.budget, input.timing].some((value) => value.length > 120))
    throw new Error('Keep each request field under 120 characters.');
  if (/https?:\/\/|[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(Object.values(input).join(' ')))
    throw new Error('Use product details here; leave out email addresses and URLs.');
}

export function validateSession(sessionId: string) {
  if (!/^[a-zA-Z0-9_-]{24,100}$/.test(sessionId))
    throw new Error('A valid private browser session is required.');
}

export function publicResearchUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase().replace(/\.$/u, '');
    let decodedPath = url.pathname;
    for (let i = 0; i < 4; i++) {
      const next = decodeURIComponent(decodedPath);
      if (next === decodedPath) break;
      decodedPath = next;
    }
    if (redactContacts(decodedPath) !== decodedPath || /%[0-9a-f]{2}/i.test(decodedPath))
      return null;
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      !host.includes('.') ||
      /^[\d.]+$/.test(host) ||
      host.includes(':') ||
      /\.(local|internal|localhost|test|invalid)$/i.test(host) ||
      host === 'localhost' ||
      raw.length > 1000
    )
      return null;
    url.search = '';
    url.hash = '';
    return url.href;
  } catch {
    return null;
  }
}

export function redactContacts(text: string) {
  return text
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, '[contact redacted]')
    .replace(/(?:\+?\d[\s().-]*){9,}/g, '[phone redacted]');
}
export function evidenceSpans(text: string): string[] {
  return text
    .split(/\r?\n+|(?<=[.!?])\s+/u)
    .flatMap((line) => {
      const spans: string[] = [];
      for (let i = 0; i < line.length;) {
        let end = Math.min(i + 200, line.length);
        if (end < line.length && /[\uD800-\uDBFF]/.test(line[end - 1]!)) end--;
        spans.push(line.slice(i, end));
        i = end;
      }
      return spans;
    })
    .filter((span) => span.trim().length > 15)
    .slice(0, 80);
}

export function sourceExtractionSchema(
  sourceCount: number,
  requirementKeys: string[] = ['unknown'],
) {
  return z.object({
    sources: z
      .array(
        z.object({
          sourceIndex: z
            .number()
            .int()
            .min(0)
            .max(Math.max(0, sourceCount - 1)),
          makerName: z.string().max(100).nullable(),
          kind: z.enum(['maker', 'directory', 'unclear']),
          locationSpanIndex: z.number().int().min(0).max(79).nullable(),
          facts: z
            .array(
              z.object({
                requirementKey: z.enum(requirementKeys as [string, ...string[]]),
                spanIndex: z.number().int().min(0).max(79),
              }),
            )
            .max(4),
        }),
      )
      .max(3),
  });
}

export function buildResearchSources(
  pages: Array<{url: string; title: string; text: string; observedAt: number}>,
  brief: ResearchBrief,
  result: z.infer<ReturnType<typeof sourceExtractionSchema>>,
): ResearchSource[] {
  const knownKeys = new Set(brief.requirements.map((r) => r.key));
  const seen = new Set<number>();
  const extracted = result.sources.map((item) => {
    if (seen.has(item.sourceIndex) || !pages[item.sourceIndex])
      throw new Error('Research sources were duplicated or invented.');
    seen.add(item.sourceIndex);
    const page = pages[item.sourceIndex]!;
    const spans = evidenceSpans(page.text);
    const keys = new Set<string>();
    const facts = item.facts.map((f) => {
      if (!knownKeys.has(f.requirementKey) || keys.has(f.requirementKey) || !spans[f.spanIndex])
        throw new Error('Research evidence reference is invalid.');
      keys.add(f.requirementKey);
      return {requirementKey: f.requirementKey, excerpt: spans[f.spanIndex]!};
    });
    const name = item.makerName ? redactContacts(item.makerName) : null;
    const supportedName =
      name &&
      (page.text.toLowerCase().includes(name.toLowerCase()) ||
        page.title.toLowerCase().includes(name.toLowerCase()))
        ? name
        : null;
    return {
      url: page.url,
      title: page.title,
      observedAt: page.observedAt,
      makerName: supportedName,
      kind: item.kind === 'maker' && !supportedName ? ('unclear' as const) : item.kind,
      facts,
      ...(item.locationSpanIndex !== undefined &&
      item.locationSpanIndex !== null &&
      spans[item.locationSpanIndex] &&
      /\b(?:morocco|maroc|safi|fez|fes|marrakech|casablanca)\b/iu.test(
        spans[item.locationSpanIndex]!,
      )
        ? {locationExcerpt: spans[item.locationSpanIndex]!}
        : {}),
    };
  });
  return pages.map(
    (page) =>
      extracted.find((source) => source.url === page.url) ?? {
        url: page.url,
        title: page.title,
        observedAt: page.observedAt,
        makerName: null,
        kind: 'unclear' as const,
        facts: [],
      },
  );
}
