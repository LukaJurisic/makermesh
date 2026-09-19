// @vitest-environment node
/// <reference types="vite/client" />
import {convexTest} from 'convex-test';
import rateLimiter from '@convex-dev/rate-limiter/test';
import workflow from '@convex-dev/workflow/test';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {api, internal} from './_generated/api';
import schema from './schema';
import {
  buildResearchSources,
  evidenceSpans,
  publicResearchUrl,
  redactContacts,
} from './model/buyerResearch';
import {SessionId} from 'convex-helpers/server/sessions';
const modules = import.meta.glob('./**/*.ts');
const provider = vi.hoisted(() => ({search: vi.fn(), scrape: vi.fn()}));
vi.mock('@firecrawl/firecrawl-convex', () => ({
  FirecrawlClient: class {
    search = provider.search;
    scrape = provider.scrape;
  },
}));
const sessionId = 'visitor-session-private-0000000001' as SessionId;
const otherSession = 'visitor-session-private-0000000002' as SessionId;
const input = {
  request: 'Find Moroccan workshops for 300 custom ceramic dinner plates.',
  quantity: '300 plates',
  destination: 'Toronto, Canada',
  budget: 'CAD 4000',
  timing: '50 days',
};
const brief = {
  product: 'Custom ceramic dinner plates',
  summary: '300 plates for Toronto',
  searchQuery: 'Morocco ceramic dinner plate manufacturer custom',
  requirements: [
    {
      key: 'custom_logo',
      label: 'Custom logo',
      kind: 'must' as const,
      question: 'Can you apply our logo to 300 plates?',
    },
  ],
};
async function setup(remaining = 2) {
  vi.useFakeTimers();
  const t = convexTest(schema, modules);
  rateLimiter.register(t);
  workflow.register(t);
  const userId = await t.run(async (ctx) => {
    const id = await ctx.db.insert('users', {});
    await ctx.db.insert('operatorProfiles', {
      authUserId: id,
      role: 'operator',
      createdAt: 1,
      updatedAt: 1,
    });
    return id;
  });
  const operator = t.withIdentity({subject: `${userId}|test`});
  await operator.mutation(api.buyerResearch.configureBudget, {enabled: true, remaining});
  return {t, operator};
}
afterEach(() => vi.useRealTimers());

describe('bounded buyer research', () => {
  it.each(['search', 'scrape'])(
    'does not report an empty success when every %s call fails',
    async (stage) => {
      const {t} = await setup();
      provider.search.mockReset();
      provider.scrape.mockReset();
      if (stage === 'search') provider.search.mockRejectedValue(new Error('Provider unavailable'));
      else {
        provider.search.mockResolvedValue({
          web: [{url: 'https://maker.example.com', title: 'Maker'}],
        });
        provider.scrape.mockRejectedValue(new Error('Provider unavailable'));
      }
      const requestId = await t.run((ctx) =>
        ctx.db.insert('buyerResearchRequests', {
          sessionId,
          requestKey: 'provider-failure',
          input,
          brief,
          status: 'searching',
          approvedAt: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          expiresAt: Date.now() + 100000,
        }),
      );
      await expect(t.action(internal.buyerResearchActions.search, {requestId})).rejects.toThrow(
        'failed',
      );
      const row = await t.query(api.buyerResearch.get, {sessionId, requestId});
      expect(row?.status).not.toBe('complete');
      expect(row?.sourceCount).toBe(0);
    },
  );
  it('enforces the visitor limit without consuming allowance on a rejected request', async () => {
    const {t, operator} = await setup(5);
    await expect(
      operator.mutation(api.buyerResearch.configureBudget, {enabled: true, remaining: 26}),
    ).rejects.toThrow('0 to 25');
    await t.mutation(api.buyerResearch.create, {sessionId, input, requestKey: 'visitor-limit-001'});
    await t.mutation(api.buyerResearch.create, {sessionId, input, requestKey: 'visitor-limit-002'});
    await expect(
      t.mutation(api.buyerResearch.create, {sessionId, input, requestKey: 'visitor-limit-003'}),
    ).rejects.toThrow();
    const remaining = await t.run(
      async (ctx) =>
        (
          await ctx.db
            .query('buyerResearchBudget')
            .withIndex('by_key', (q) => q.eq('key', 'public'))
            .unique()
        )?.remaining,
    );
    expect(remaining).toBe(3);
  });
  it('preserves inspected sources omitted by the model', () => {
    const page = {
      url: 'https://example.com',
      title: 'A source',
      text: 'An inspected page with no useful facts.',
      observedAt: 1,
    };
    expect(buildResearchSources([page], brief, {sources: []})).toEqual([
      {
        url: page.url,
        title: page.title,
        observedAt: 1,
        makerName: null,
        kind: 'unclear',
        facts: [],
      },
    ]);
  });
  it('scheduled expiry removes the request and its private pages without the hourly sweep', async () => {
    vi.useFakeTimers();
    const t = convexTest(schema, modules);
    const requestId = await t.run(async (ctx) => {
      const id = await ctx.db.insert('buyerResearchRequests', {
        sessionId,
        requestKey: 'expiry-case',
        input,
        status: 'complete',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        expiresAt: Date.now() + 1000,
      });
      await ctx.db.insert('buyerResearchPages', {
        requestId: id,
        url: 'https://example.com',
        title: 'Page',
        text: 'Private retained content',
        observedAt: Date.now(),
      });
      await ctx.scheduler.runAfter(1000, internal.buyerResearchStore.expireRequest, {
        requestId: id,
      });
      return id;
    });
    await t.finishAllScheduledFunctions(() => vi.advanceTimersByTime(1000));
    expect(await t.query(api.buyerResearch.get, {sessionId, requestId})).toBeNull();
    expect(await t.query(api.buyerResearch.get, {sessionId, requestId: 'invalid'})).toBeNull();
    expect(
      await t.run((ctx) =>
        ctx.db
          .query('buyerResearchPages')
          .withIndex('by_request', (q) => q.eq('requestId', requestId))
          .take(4),
      ),
    ).toEqual([]);
  });
  it('reserves a fixed allowance once, protects browser ownership, and rejects changed retries', async () => {
    const {t} = await setup(1);
    await expect(
      t.mutation(api.buyerResearch.configureBudget, {enabled: true, remaining: 25}),
    ).rejects.toThrow('Unauthenticated');
    const requestId = await t.mutation(api.buyerResearch.create, {
      sessionId,
      input,
      requestKey: 'test-request-001',
    });
    expect(
      await t.mutation(api.buyerResearch.create, {
        sessionId,
        input,
        requestKey: 'test-request-001',
      }),
    ).toBe(requestId);
    expect(await t.query(api.buyerResearch.get, {sessionId: otherSession, requestId})).toBeNull();
    await expect(
      t.mutation(api.buyerResearch.create, {
        sessionId,
        input: {...input, quantity: '500 plates'},
        requestKey: 'test-request-001',
      }),
    ).rejects.toThrow('different brief');
    await expect(
      t.mutation(api.buyerResearch.create, {
        sessionId: otherSession,
        input,
        requestKey: 'test-request-002',
      }),
    ).rejects.toThrow('at capacity');
  });
  it('requires reviewed brief approval and persists only source-backed facts', async () => {
    const {t} = await setup();
    const requestId = await t.mutation(api.buyerResearch.create, {
      sessionId,
      input,
      requestKey: 'test-request-003',
    });
    expect(await t.mutation(internal.buyerResearchStore.claim, {requestId, stage: 'search'})).toBe(
      false,
    );
    expect(await t.mutation(internal.buyerResearchStore.claim, {requestId, stage: 'compile'})).toBe(
      true,
    );
    expect(await t.mutation(internal.buyerResearchStore.claim, {requestId, stage: 'compile'})).toBe(
      false,
    );
    await t.mutation(internal.buyerResearchStore.saveBrief, {requestId, inScope: true, brief});
    const reviewed = await t.query(api.buyerResearch.get, {sessionId, requestId});
    await expect(
      t.mutation(api.buyerResearch.approve, {
        sessionId: otherSession,
        requestId,
        expectedBriefHash: reviewed!.briefHash!,
      }),
    ).rejects.toThrow('not available');
    await expect(
      t.mutation(api.buyerResearch.approve, {sessionId, requestId, expectedBriefHash: 'wrong'}),
    ).rejects.toThrow('changed after review');
    await t.mutation(api.buyerResearch.approve, {
      sessionId,
      requestId,
      expectedBriefHash: reviewed!.briefHash!,
    });
    await t.mutation(api.buyerResearch.approve, {
      sessionId,
      requestId,
      expectedBriefHash: reviewed!.briefHash!,
    });
    expect(await t.mutation(internal.buyerResearchStore.claim, {requestId, stage: 'search'})).toBe(
      true,
    );
    expect(await t.mutation(internal.buyerResearchStore.claim, {requestId, stage: 'search'})).toBe(
      false,
    );
    const pages = [
      {
        url: 'https://example.com/ceramics',
        title: 'Ceramic workshop',
        text: 'Our workshop offers custom logos on ceramic plates. Every item is crafted in Morocco.',
        observedAt: 10,
      },
    ];
    await t.mutation(internal.buyerResearchStore.savePages, {requestId, pages});
    await t.mutation(internal.buyerResearchStore.claim, {requestId, stage: 'extract'});
    const results = buildResearchSources(pages, brief, {
      sources: [
        {
          sourceIndex: 0,
          makerName: 'Example workshop',
          kind: 'maker',
          locationSpanIndex: null,
          facts: [{requirementKey: 'custom_logo', spanIndex: 0}],
        },
      ],
    });
    await expect(
      t.mutation(internal.buyerResearchStore.complete, {
        requestId,
        results: [
          {
            ...results[0]!,
            facts: [{requirementKey: 'custom_logo', excerpt: 'Food certified and verified.'}],
          },
        ],
      }),
    ).rejects.toThrow('unsupported');
    await t.mutation(internal.buyerResearchStore.complete, {requestId, results});
    const view = await t.query(api.buyerResearch.get, {sessionId, requestId});
    expect(view?.status).toBe('complete');
    expect(view?.results[0]?.facts[0]?.excerpt).toBe(pages[0]!.text.split('. ')[0] + '.');
    for (const forbidden of ['sessionId', 'workflowId', 'score', 'eligibility', 'providerId'])
      expect(JSON.stringify(view)).not.toContain(`"${forbidden}"`);
    vi.setSystemTime(Date.now() + 49 * 60 * 60 * 1000);
    await t.mutation(internal.buyerResearchStore.cleanupExpired, {});
    expect(await t.query(api.buyerResearch.get, {sessionId, requestId})).toBeNull();
  });
  it('never approves an out-of-scope request', async () => {
    const {t} = await setup();
    const requestId = await t.mutation(api.buyerResearch.create, {
      sessionId,
      input,
      requestKey: 'scope-test-001',
    });
    await t.mutation(internal.buyerResearchStore.claim, {requestId, stage: 'compile'});
    await t.mutation(internal.buyerResearchStore.saveBrief, {requestId, inScope: false, brief});
    const r = await t.query(api.buyerResearch.get, {sessionId, requestId});
    await expect(
      t.mutation(api.buyerResearch.approve, {
        sessionId,
        requestId,
        expectedBriefHash: r!.briefHash!,
      }),
    ).rejects.toThrow('not ready');
  });
  it('blocks private targets, strips URL tracking, and rejects invented source references', () => {
    for (const url of [
      'http://example.com',
      'https://127.0.0.1',
      'https://[::1]',
      'https://user:pass@example.com',
      'https://foo.internal',
      'https://foo.test',
      'https://foo.internal.',
      'https://example.com/contact/alice@example.com',
      'https://example.com/contact/alice%40example.com',
      'https://example.com/contact/alice%2540example.com',
      'https://example.com/contact/+14165551212',
    ])
      expect(publicResearchUrl(url)).toBeNull();
    expect(publicResearchUrl('https://example.com/path?email=x#ref')).toBe(
      'https://example.com/path',
    );
    expect(redactContacts('hello@example.com +1 (416) 555-1212 MOQ 200')).not.toContain(
      'hello@example.com',
    );
    const pages = [
      {
        url: 'https://example.com',
        title: 'Maker',
        text: 'We make custom ceramic plates.',
        observedAt: 1,
      },
    ];
    expect(() =>
      buildResearchSources(pages, brief, {
        sources: [
          {
            sourceIndex: 0,
            makerName: 'Maker',
            kind: 'maker',
            locationSpanIndex: null,
            facts: [{requirementKey: 'invented', spanIndex: 0}],
          },
        ],
      }),
    ).toThrow();
    for (const span of evidenceSpans('x'.repeat(199) + '😀' + 'y'.repeat(300)))
      expect(decodeURIComponent(encodeURIComponent(span))).toBe(span);
  });
});
