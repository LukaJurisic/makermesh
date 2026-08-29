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

    const now = Date.now();
    const first = await t.query(api.demo.getSession, {sessionId: firstId, now});
    const second = await t.query(api.demo.getSession, {sessionId: secondId, now});
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

  it('makes retried commands no-ops and resets only the caller overlay', async () => {
    const t = await setup();
    const testSessionId = sessionId('session-test-retry-000000001');
    await t.mutation(api.demo.createSession, {sessionId: testSessionId});
    const args = {sessionId: testSessionId, commandId: 'approve-retry-001'};
    await t.mutation(api.demo.approveBrief, args);
    await t.mutation(api.demo.approveBrief, args);

    const idempotencyCount = await t.run(async (ctx) => {
      const row = await ctx.db
        .query('idempotencyRecords')
        .withIndex('by_key', (query) => query.eq('key', `demo:${testSessionId}:${args.commandId}`))
        .unique();
      return row ? 1 : 0;
    });
    expect(idempotencyCount).toBe(1);

    const baselineBefore = await t.run(async (ctx) =>
      ctx.db
        .query('demoBaselines')
        .withIndex('by_slug_and_version', (query) =>
          query.eq('slug', 'espresso-cup-demo').eq('version', 1),
        )
        .unique(),
    );
    await t.mutation(api.demo.resetOwnDemo, {
      sessionId: testSessionId,
      commandId: 'reset-retry-001',
    });
    const state = await t.query(api.demo.getSession, {
      sessionId: testSessionId,
      now: Date.now(),
    });
    const baselineAfter = await t.run(async (ctx) => ctx.db.get(baselineBefore!._id));
    expect(state?.state.briefApproved).toBe(false);
    expect(state?.state.replayStep).toBe(0);
    expect(baselineAfter).toEqual(baselineBefore);
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
    expect(
      await t.query(api.demo.getSession, {sessionId: testSessionId, now: Date.now()}),
    ).toBeNull();

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
    const recreated = await t.query(api.demo.getSession, {
      sessionId: testSessionId,
      now: Date.now(),
    });
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
    const session = await t.query(api.demo.getSession, {
      sessionId: testSessionId,
      now: Date.now(),
    });
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
