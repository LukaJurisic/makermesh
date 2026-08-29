import {v} from 'convex/values';
import {internal} from './_generated/api';
import {internalMutation} from './_generated/server';

export const cleanupExpiredProductEvents = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const expired = await ctx.db
      .query('productEvents')
      .withIndex('by_expiresAt', (index) => index.lte('expiresAt', Date.now()))
      .take(100);
    for (const event of expired) await ctx.db.delete(event._id);
    if (expired.length === 100) {
      await ctx.scheduler.runAfter(0, internal.analytics.cleanupExpiredProductEvents, {});
    }
    return null;
  },
});
