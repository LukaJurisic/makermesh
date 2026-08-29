import {HOUR, RateLimiter} from '@convex-dev/rate-limiter';
import {getAuthUserId} from '@convex-dev/auth/server';
import {v} from 'convex/values';
import {components} from './_generated/api';
import {internalMutation, internalQuery, query} from './_generated/server';
import {requireOperator} from './model/requireOperator';

const operatorLoginLimiter = new RateLimiter(components.rateLimiter, {
  operatorLoginGlobal: {kind: 'token bucket', rate: 5, period: HOUR, capacity: 5},
});

export const getCurrent = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      role: v.literal('operator'),
      disabled: v.boolean(),
    }),
  ),
  handler: async (ctx) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) return null;
    const profile = await ctx.db
      .query('operatorProfiles')
      .withIndex('by_authUserId', (index) => index.eq('authUserId', authUserId))
      .unique();
    if (!profile || profile.role !== 'operator' || profile.disabledAt) return null;
    return {role: profile.role, disabled: false};
  },
});

export const assertCurrent = internalQuery({
  args: {},
  returns: v.id('operatorProfiles'),
  handler: async (ctx) => {
    const profile = await requireOperator(ctx);
    return profile._id;
  },
});

export const ensureProfile = internalMutation({
  args: {authUserId: v.id('users')},
  returns: v.id('operatorProfiles'),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('operatorProfiles')
      .withIndex('by_authUserId', (query) => query.eq('authUserId', args.authUserId))
      .unique();
    if (existing?.disabledAt) throw new Error('Operator access is disabled.');
    if (existing) return existing._id;
    const now = Date.now();
    return await ctx.db.insert('operatorProfiles', {
      authUserId: args.authUserId,
      role: 'operator',
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const consumeLoginAttempt = internalMutation({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const result = await operatorLoginLimiter.limit(ctx, 'operatorLoginGlobal');
    return result.ok;
  },
});
