import {getAuthUserId} from '@convex-dev/auth/server';
import type {MutationCtx, QueryCtx} from '../_generated/server';

export async function requireOperator(ctx: QueryCtx | MutationCtx) {
  const authUserId = await getAuthUserId(ctx);
  if (!authUserId) throw new Error('Unauthenticated.');
  const profile = await ctx.db
    .query('operatorProfiles')
    .withIndex('by_authUserId', (query) => query.eq('authUserId', authUserId))
    .unique();
  if (!profile || profile.role !== 'operator' || profile.disabledAt) {
    throw new Error('Operator authorization required.');
  }
  return profile;
}
