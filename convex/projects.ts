import {v} from 'convex/values';
import {mutation} from './_generated/server';
import {CONTROLLED_SMOKE_SLUG} from './model/controlledDemo';
import {requireOperator} from './model/requireOperator';

export const ensureControlledSmokeProject = mutation({
  args: {},
  returns: v.object({projectId: v.id('projects'), created: v.boolean()}),
  handler: async (ctx) => {
    await requireOperator(ctx);
    const existing = await ctx.db
      .query('projects')
      .withIndex('by_slug', (index) => index.eq('slug', CONTROLLED_SMOKE_SLUG))
      .unique();
    if (existing) {
      if (existing.dataMode !== 'live' || !existing.demoMode) {
        throw new Error('The controlled smoke-project slug is already in use.');
      }
      return {projectId: existing._id, created: false};
    }

    const now = Date.now();
    const projectId = await ctx.db.insert('projects', {
      title: 'Harbour Coffee Lab — controlled live smoke',
      slug: CONTROLLED_SMOKE_SLUG,
      buyerName: 'Harbour Coffee Lab — fictional demonstration buyer',
      destination: 'Toronto, Canada',
      defaultCurrency: 'CAD',
      status: 'draft',
      dataMode: 'live',
      demoMode: true,
      presentationMode: false,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert('activityEvents', {
      projectId,
      provider: 'convex',
      eventType: 'controlled_smoke_project_created',
      label: 'Controlled live smoke project created',
      status: 'completed',
      safeMetadata: {fixtureBuyer: true},
      occurredAt: now,
      publicSafe: false,
    });
    return {projectId, created: true};
  },
});
