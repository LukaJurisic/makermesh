// @vitest-environment edge-runtime
/// <reference types="vite/client" />

import {convexTest} from 'convex-test';
import type {SessionId} from 'convex-helpers/server/sessions';
import rateLimiterTest from '@convex-dev/rate-limiter/test';
import {describe, expect, it} from 'vitest';
import {api, internal} from './_generated/api';
import schema from './schema';

const modules = import.meta.glob('./**/*.ts');

const sessionId = (value: string) => value as SessionId;

async function setup() {
  const t = convexTest(schema, modules);
  rateLimiterTest.register(t);
  await t.mutation(internal.seed.ensureDemoBaseline, {});
  return t;
}

describe('Convex demo baseline and overlays', () => {
  it('recovers the selected fixture baseline idempotently and derives its counts', async () => {
    const t = await setup();
    const secondRun = await t.mutation(internal.seed.ensureDemoBaseline, {});
    expect(secondRun).toMatchObject({
      created: false,
      supplierCount: 6,
      sourceCount: 17,
      claimCount: 39,
    });
    await t.run(async (ctx) => ctx.db.patch(secondRun.baselineId, {status: 'retired'}));
    await t.mutation(internal.seed.ensureDemoBaseline, {});
    const restored = await t.run(async (ctx) => ctx.db.get('demoBaselines', secondRun.baselineId));
    expect(restored?.status).toBe('published');
  });

  it('publishes a new normalized version without mutating the legacy snapshot project or claims', async () => {
    const t = convexTest(schema, modules);
    rateLimiterTest.register(t);
    const legacy = await t.run(async (ctx) => {
      const projectId = await ctx.db.insert('projects', {
        title: 'Legacy demo project',
        slug: 'harbour-coffee-lab',
        buyerName: 'Harbour Coffee Lab',
        destination: 'Toronto, Canada',
        defaultCurrency: 'CAD',
        status: 'comparing',
        dataMode: 'demo_baseline',
        demoMode: true,
        presentationMode: false,
        createdAt: 1,
        updatedAt: 1,
      });
      const supplierId = await ctx.db.insert('supplierEntities', {
        canonicalName: 'Legacy Atlas fixture',
        slug: 'legacy-atlas-fixture',
        country: 'Morocco',
        city: 'Safi',
        languages: ['French'],
        summary: 'Legacy fictional record.',
        demoSupplier: true,
        consentStatus: 'preview_only',
        createdAt: 1,
        updatedAt: 1,
      });
      const sourceId = await ctx.db.insert('sources', {
        projectId,
        supplierId,
        sourceType: 'demo_fixture',
        canonicalUrl: 'https://demo.makermesh.invalid/legacy',
        title: 'Legacy source',
        domain: 'demo.makermesh.invalid',
        fetchedAt: 1,
        contentHash: 'legacy-content-hash',
        excerpt: 'Legacy public fixture excerpt.',
        truncated: false,
        status: 'active',
        publicSafe: true,
      });
      const claimId = await ctx.db.insert('capabilityClaims', {
        projectId,
        supplierId,
        key: 'legacy_claim',
        normalizedValue: true,
        displayValue: 'Legacy claim',
        status: 'confirmed',
        evidenceState: 'public_source',
        sourceId,
        supportingExcerpt: 'legacy non-matching fixture text',
        observedAt: 1,
      });
      const baselineId = await ctx.db.insert('demoBaselines', {
        slug: 'espresso-cup-demo',
        version: 1,
        baselineProjectId: projectId,
        capturedAt: 1,
        sourceMode: 'fixture',
        captureLabel: 'Legacy fixture baseline.',
        status: 'published',
      });
      return {projectId, claimId, baselineId};
    });

    const seeded = await t.mutation(internal.seed.ensureDemoBaseline, {});
    expect(seeded.created).toBe(true);
    expect(seeded.projectId).not.toBe(legacy.projectId);
    const after = await t.run(async (ctx) => ({
      project: await ctx.db.get(legacy.projectId),
      claim: await ctx.db.get(legacy.claimId),
      baseline: await ctx.db.get(legacy.baselineId),
      published: await ctx.db
        .query('demoBaselines')
        .withIndex('by_slug_and_status', (index) =>
          index.eq('slug', 'espresso-cup-demo').eq('status', 'published'),
        )
        .unique(),
    }));
    expect(after.project?.currentApprovedBriefId).toBeUndefined();
    expect(after.claim?.supportingExcerpt).toBe('legacy non-matching fixture text');
    expect(after.baseline?.status).toBe('retired');
    expect(after.published).toMatchObject({version: 2, baselineProjectId: seeded.projectId});
  });

  it('creates isolated sessions over one immutable baseline', async () => {
    const t = await setup();
    const firstId = sessionId('session-test-first-00000001');
    const secondId = sessionId('session-test-second-0000002');
    await t.mutation(api.demo.createSession, {sessionId: firstId});
    await t.mutation(api.demo.createSession, {sessionId: secondId});
    await t.mutation(api.demo.approveBrief, {
      sessionId: firstId,
      commandId: 'approve-first-001',
    });

    const first = await t.query(api.demo.getSession, {sessionId: firstId});
    const second = await t.query(api.demo.getSession, {sessionId: secondId});
    expect(first?.state.briefApproved).toBe(true);
    expect(second?.state.briefApproved).toBe(false);
    expect(first?.baseline).toEqual(second?.baseline);
    expect(first?.metrics).toEqual({
      sourcesAnalyzed: 17,
      makersDiscovered: 6,
      claimsExtracted: 39,
      openQuestions: 13,
      repliesReceived: 1,
    });
  });

  it('returns only public-safe research evidence through the public session query', async () => {
    const t = await setup();
    const testSessionId = sessionId('session-test-public-research-001');
    await t.mutation(api.demo.createSession, {sessionId: testSessionId});
    await t.run(async (ctx) => {
      const baseline = await ctx.db
        .query('demoBaselines')
        .withIndex('by_slug_and_status', (index) =>
          index.eq('slug', 'espresso-cup-demo').eq('status', 'published'),
        )
        .unique();
      const atlas = await ctx.db
        .query('supplierEntities')
        .withIndex('by_slug', (index) => index.eq('slug', 'atlas-clay-studio'))
        .unique();
      const privateSourceId = await ctx.db.insert('sources', {
        projectId: baseline!.baselineProjectId,
        supplierId: atlas!._id,
        sourceType: 'supplier_email',
        canonicalUrl: 'https://private.invalid/message',
        title: 'PRIVATE_RESEARCH_MARKER',
        domain: 'private.invalid',
        fetchedAt: 1,
        contentHash: 'private-source-hash',
        excerpt: 'PRIVATE_RESEARCH_MARKER',
        truncated: false,
        status: 'active',
        publicSafe: false,
      });
      await ctx.db.insert('capabilityClaims', {
        projectId: baseline!.baselineProjectId,
        supplierId: atlas!._id,
        key: 'private_claim',
        normalizedValue: true,
        displayValue: 'PRIVATE_RESEARCH_MARKER',
        status: 'confirmed',
        evidenceState: 'supplier_claimed',
        sourceId: privateSourceId,
        agentMailMessageId: 'PRIVATE_PROVIDER_IDENTIFIER',
        supportingExcerpt: 'PRIVATE_RESEARCH_MARKER',
        observedAt: 1,
        extractionModel: 'private-model',
        promptVersion: 'private-prompt',
      });
    });

    const result = await t.query(api.demo.getSession, {sessionId: testSessionId});
    expect(result?.research.makers).toHaveLength(6);
    expect(result?.research.sources).toHaveLength(17);
    expect(result?.research.claims).toHaveLength(39);
    const serialized = JSON.stringify(result?.research);
    expect(serialized).not.toContain('PRIVATE_RESEARCH_MARKER');
    expect(serialized).not.toContain('PRIVATE_PROVIDER_IDENTIFIER');
    for (const forbiddenField of [
      'snapshotStorageId',
      'publicEmail',
      'firecrawlReference',
      'contentHash',
      'agentMailMessageId',
      'eligibility',
      'preferenceFit',
      'commercialCompleteness',
    ]) {
      expect(serialized).not.toContain(`"${forbiddenField}"`);
    }
    const publicSourceKeys = new Set(result?.research.sources.map((source) => source.sourceKey));
    expect(result?.research.claims.every((claim) => publicSourceKeys.has(claim.sourceKey))).toBe(
      true,
    );
    expect(
      result?.research.claims.find((claim) => claim.requirementKey === 'preferred_timing'),
    ).toMatchObject({observationState: 'conflict'});
  });

  it('keeps real and suppressed supplier records inside the public reputation boundary', async () => {
    const t = await setup();
    await t.run(async (ctx) => {
      const realSupplier = await ctx.db
        .query('supplierEntities')
        .withIndex('by_slug', (index) => index.eq('slug', 'fez-form-house'))
        .unique();
      const suppressed = await ctx.db
        .query('supplierEntities')
        .withIndex('by_slug', (index) => index.eq('slug', 'riad-form-workshop'))
        .unique();
      await ctx.db.patch(realSupplier!._id, {
        demoSupplier: false,
        publicEmail: 'private-contact@example.test',
        summary: 'Stored summary that must not be publicly repeated.',
      });
      await ctx.db.patch(suppressed!._id, {consentStatus: 'suppressed'});
    });

    const testSessionId = sessionId('session-test-reputation-boundary');
    await t.mutation(api.demo.createSession, {sessionId: testSessionId});
    const result = await t.query(api.demo.getSession, {sessionId: testSessionId});
    const realMaker = result?.research.makers.find((maker) => maker.slug === 'fez-form-house');
    expect(realMaker).toMatchObject({
      summary: 'Observed public supplier footprint. Open the attributed sources for details.',
      visual: '/images/maker-hands-hero.webp',
      demoSupplier: false,
      publicSourceCount: 0,
      publicClaimCount: 0,
    });
    expect(realMaker).not.toHaveProperty('languages');
    expect(realMaker).not.toHaveProperty('stage');
    expect(realMaker).not.toHaveProperty('openQuestionCount');
    expect(result?.research.makers.some((maker) => maker.slug === 'riad-form-workshop')).toBe(
      false,
    );
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('private-contact@example.test');
    expect(serialized).not.toContain('Stored summary that must not be publicly repeated.');
    expect(serialized).not.toContain('hard_failure');
  });

  it('rebinds an active visitor session when its immutable baseline is retired', async () => {
    const t = await setup();
    const testSessionId = sessionId('session-test-baseline-rebind-001');
    await t.mutation(api.demo.createSession, {sessionId: testSessionId});
    await t.run(async (ctx) => {
      const active = await ctx.db
        .query('demoBaselines')
        .withIndex('by_slug_and_status', (index) =>
          index.eq('slug', 'espresso-cup-demo').eq('status', 'published'),
        )
        .unique();
      await ctx.db.patch(active!._id, {status: 'retired'});
      await ctx.db.insert('demoBaselines', {
        slug: 'espresso-cup-demo',
        version: 3,
        baselineProjectId: active!.baselineProjectId,
        capturedAt: 2,
        sourceMode: 'captured_live',
        captureLabel: 'Captured from a controlled live run; downstream supplier data is fictional.',
        status: 'published',
      });
    });

    expect(await t.query(api.demo.getSession, {sessionId: testSessionId})).toBeNull();
    await expect(
      t.mutation(api.demo.createSession, {sessionId: testSessionId}),
    ).resolves.toMatchObject({created: true});
    const rebound = await t.query(api.demo.getSession, {sessionId: testSessionId});
    expect(rebound?.baseline.version).toBe(3);
    expect(rebound?.baseline.sourceMode).toBe('captured_live');
  });

  it('makes retried commands no-ops and resets only the caller overlay', async () => {
    const t = await setup();
    const testSessionId = sessionId('session-test-retry-000000001');
    await t.mutation(api.demo.createSession, {sessionId: testSessionId});
    const args = {sessionId: testSessionId, commandId: 'approve-retry-001'};
    await t.mutation(api.demo.approveBrief, args);
    await t.mutation(api.demo.approveBrief, args);

    const idempotencyCount = await t.run(async (ctx) => {
      const session = await ctx.db
        .query('demoSessions')
        .withIndex('by_sessionId', (query) => query.eq('sessionId', testSessionId))
        .unique();
      const row = await ctx.db
        .query('idempotencyRecords')
        .withIndex('by_key', (query) =>
          query.eq('key', `demo:${testSessionId}:${session!.expiresAt}:${args.commandId}`),
        )
        .unique();
      return row ? 1 : 0;
    });
    expect(idempotencyCount).toBe(1);

    const baselineBefore = await t.run(async (ctx) =>
      ctx.db
        .query('demoBaselines')
        .withIndex('by_slug_and_version', (query) =>
          query.eq('slug', 'espresso-cup-demo').eq('version', 2),
        )
        .unique(),
    );
    await t.mutation(api.demo.resetOwnDemo, {
      sessionId: testSessionId,
      commandId: 'reset-retry-001',
    });
    const state = await t.query(api.demo.getSession, {sessionId: testSessionId});
    const baselineAfter = await t.run(async (ctx) => ctx.db.get(baselineBefore!._id));
    expect(state?.state.briefApproved).toBe(false);
    expect(state?.state.replayStep).toBe(0);
    expect(baselineAfter).toEqual(baselineBefore);
  });

  it('rejects reuse of one command identifier for a different demo operation', async () => {
    const t = await setup();
    const testSessionId = sessionId('session-test-command-scope-001');
    await t.mutation(api.demo.createSession, {sessionId: testSessionId});
    const commandId = 'shared-command-001';
    await t.mutation(api.demo.approveBrief, {sessionId: testSessionId, commandId});
    await expect(
      t.mutation(api.demo.setStage, {
        sessionId: testSessionId,
        stage: 'makers',
        commandId,
      }),
    ).rejects.toThrow('different operation');
  });

  it('rejects invalid weights and expired sessions', async () => {
    const t = await setup();
    const testSessionId = sessionId('session-test-expiry-00000001');
    await t.mutation(api.demo.createSession, {sessionId: testSessionId});
    await expect(
      t.mutation(api.demo.setPreferenceWeights, {
        sessionId: testSessionId,
        commandId: 'weights-invalid-001',
        weights: {
          preferenceFit: 40,
          evidenceCoverage: 30,
          commercialCompleteness: 20,
          leadTime: 10,
          price: 1,
        },
      }),
    ).rejects.toThrow('totaling 100');

    await t.mutation(api.demo.approveBrief, {
      sessionId: testSessionId,
      commandId: 'approve-before-expiry-001',
    });

    await t.run(async (ctx) => {
      const session = await ctx.db
        .query('demoSessions')
        .withIndex('by_sessionId', (query) => query.eq('sessionId', testSessionId))
        .unique();
      await ctx.db.patch(session!._id, {expiresAt: 1});
    });
    await t.mutation(internal.demo.expireSession, {sessionId: testSessionId});
    await t.finishAllScheduledFunctions(() => undefined);
    expect(await t.query(api.demo.getSession, {sessionId: testSessionId})).toBeNull();

    const expiredOverlayCounts = await t.run(async (ctx) => {
      const state = await ctx.db
        .query('demoSessionState')
        .withIndex('by_sessionId', (query) => query.eq('sessionId', testSessionId))
        .unique();
      const commands = await ctx.db
        .query('idempotencyRecords')
        .withIndex('by_subjectKey', (query) => query.eq('subjectKey', testSessionId))
        .take(100);
      return {state: state ? 1 : 0, commands: commands.length};
    });
    expect(expiredOverlayCounts).toEqual({state: 0, commands: 0});

    await t.mutation(api.demo.createSession, {sessionId: testSessionId});
    const recreated = await t.query(api.demo.getSession, {sessionId: testSessionId});
    const sessionCount = await t.run(async (ctx) => {
      const row = await ctx.db
        .query('demoSessions')
        .withIndex('by_sessionId', (query) => query.eq('sessionId', testSessionId))
        .unique();
      return row ? 1 : 0;
    });
    expect(sessionCount).toBe(1);
    expect(recreated?.state.briefApproved).toBe(false);
  });

  it('reads expiry from materialized Convex state instead of a client clock', async () => {
    const t = await setup();
    const testSessionId = sessionId('session-test-materialized-expiry');
    await t.mutation(api.demo.createSession, {sessionId: testSessionId});
    await expect(t.query(api.demo.getSession, {sessionId: testSessionId})).resolves.not.toBeNull();
    await t.run(async (ctx) => {
      const session = await ctx.db
        .query('demoSessions')
        .withIndex('by_sessionId', (index) => index.eq('sessionId', testSessionId))
        .unique();
      await ctx.db.patch(session!._id, {expiresAt: 1});
    });
    await t.mutation(internal.demo.expireSession, {sessionId: testSessionId});
    await expect(t.query(api.demo.getSession, {sessionId: testSessionId})).resolves.toBeNull();
  });

  it('enforces the demo sequence and never returns private activity', async () => {
    const t = await setup();
    const testSessionId = sessionId('session-test-sequence-0000001');
    await t.mutation(api.demo.createSession, {sessionId: testSessionId});
    await expect(
      t.mutation(api.demo.startResearchReplay, {
        sessionId: testSessionId,
        commandId: 'research-too-early-001',
      }),
    ).rejects.toThrow('Approve the brief');
    await t.mutation(api.demo.approveBrief, {
      sessionId: testSessionId,
      commandId: 'approve-sequence-001',
    });
    await expect(
      t.mutation(api.demo.approveFixtureOutreach, {
        sessionId: testSessionId,
        commandId: 'outreach-too-early-001',
      }),
    ).rejects.toThrow('Review research');
    await t.mutation(api.demo.startResearchReplay, {
      sessionId: testSessionId,
      commandId: 'research-sequence-001',
    });
    await expect(
      t.mutation(api.demo.applyFixtureReply, {
        sessionId: testSessionId,
        commandId: 'reply-too-early-001',
      }),
    ).rejects.toThrow('Approve the controlled draft');

    await t.run(async (ctx) => {
      const baseline = await ctx.db
        .query('demoBaselines')
        .withIndex('by_slug_and_status', (query) =>
          query.eq('slug', 'espresso-cup-demo').eq('status', 'published'),
        )
        .first();
      await ctx.db.insert('activityEvents', {
        projectId: baseline!.baselineProjectId,
        provider: 'convex',
        eventType: 'private_test',
        label: 'Private activity must not appear',
        status: 'completed',
        safeMetadata: {},
        occurredAt: 9_999,
        publicSafe: false,
      });
    });
    const session = await t.query(api.demo.getSession, {sessionId: testSessionId});
    expect(
      session?.activity.some((event: {label: string}) => event.label.includes('Private activity')),
    ).toBe(false);
  });

  it('stores only fixed privacy-conscious events and removes them after retention', async () => {
    const t = await setup();
    const testSessionId = sessionId('session-test-analytics-000001');
    await t.mutation(api.demo.createSession, {sessionId: testSessionId});
    const event = {
      sessionId: testSessionId,
      eventType: 'landing_viewed' as const,
    };
    await t.mutation(api.demo.trackProductEvent, event);
    await t.mutation(api.demo.trackProductEvent, event);
    await t.mutation(api.demo.trackProductEvent, {
      sessionId: testSessionId,
      eventType: 'demo_opened',
    });
    const beforeCleanup = await t.run(async (ctx) => {
      const events = await ctx.db
        .query('productEvents')
        .withIndex('by_sessionId_and_occurredAt', (index) => index.eq('sessionId', testSessionId))
        .take(10);
      const commandRows = await ctx.db
        .query('idempotencyRecords')
        .withIndex('by_subjectKey', (index) => index.eq('subjectKey', testSessionId))
        .take(10);
      return {events, commandRows};
    });
    expect(beforeCleanup.events).toHaveLength(2);
    expect(beforeCleanup.events.filter((item) => item.eventType === 'landing_viewed')).toHaveLength(
      1,
    );
    expect(beforeCleanup.commandRows).toHaveLength(0);
    await t.run(async (ctx) => {
      for (const eventRow of beforeCleanup.events) {
        await ctx.db.patch(eventRow._id, {expiresAt: 1});
      }
    });
    await t.mutation(internal.analytics.cleanupExpiredProductEvents, {});
    const afterCleanup = await t.run(async (ctx) =>
      ctx.db
        .query('productEvents')
        .withIndex('by_sessionId_and_occurredAt', (index) => index.eq('sessionId', testSessionId))
        .take(10),
    );
    expect(afterCleanup).toHaveLength(0);
  });

  it('enforces a fixed lifetime quota for unique session commands', async () => {
    const t = await setup();
    const testSessionId = sessionId('session-test-lifetime-0000001');
    await t.mutation(api.demo.createSession, {sessionId: testSessionId});
    await t.run(async (ctx) => {
      const session = await ctx.db
        .query('demoSessions')
        .withIndex('by_sessionId', (index) => index.eq('sessionId', testSessionId))
        .unique();
      await ctx.db.patch(session!._id, {commandCount: 127});
    });
    await t.mutation(api.demo.setStage, {
      sessionId: testSessionId,
      stage: 'research',
      commandId: 'lifetime-command-127',
    });
    await expect(
      t.mutation(api.demo.setStage, {
        sessionId: testSessionId,
        stage: 'makers',
        commandId: 'lifetime-command-128',
      }),
    ).rejects.toThrow('24-hour command limit');
  });
});

describe('operator authorization', () => {
  it('fails closed without identity and authorizes only an active operator profile', async () => {
    const t = convexTest(schema, modules);
    rateLimiterTest.register(t);
    expect(await t.query(api.operatorAuth.getCurrent, {})).toBeNull();

    const {userId, profileId} = await t.run(async (ctx) => {
      const userId = await ctx.db.insert('users', {name: 'Test operator'});
      const profileId = await ctx.db.insert('operatorProfiles', {
        authUserId: userId,
        role: 'operator',
        createdAt: 1,
        updatedAt: 1,
      });
      return {userId, profileId};
    });
    const authenticated = t.withIdentity({subject: `${userId}|test-session`});
    expect(await authenticated.query(api.operatorAuth.getCurrent, {})).toEqual({
      role: 'operator',
      disabled: false,
    });
    expect(await authenticated.query(internal.operatorAuth.assertCurrent, {})).toBe(profileId);

    await t.run(async (ctx) => ctx.db.patch(profileId, {disabledAt: 2, updatedAt: 2}));
    expect(await authenticated.query(api.operatorAuth.getCurrent, {})).toBeNull();
  });

  it('blocks operator attempts before expensive verification after the global budget is spent', async () => {
    const t = convexTest(schema, modules);
    rateLimiterTest.register(t);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(t.mutation(internal.operatorAuth.consumeLoginAttempt, {})).resolves.toBe(true);
    }
    await expect(t.mutation(internal.operatorAuth.consumeLoginAttempt, {})).resolves.toBe(false);
  });
});
