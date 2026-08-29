import type {Id} from '../_generated/dataModel';
import type {QueryCtx} from '../_generated/server';
import {requireCurrentApprovedBrief, requireLiveProjectStatus} from './projectState';

export async function loadReplyOperationScope(
  ctx: {db: QueryCtx['db']},
  operationId: Id<'externalOperations'>,
) {
  const operation = await ctx.db.get(operationId);
  if (
    !operation ||
    operation.provider !== 'openai' ||
    operation.operation !== 'extract_supplier_reply' ||
    !operation.briefId ||
    !operation.supplierId ||
    !operation.outreachDraftId ||
    !operation.sourceMessageId ||
    !operation.sourceContentHash
  ) {
    throw new Error('Supplier reply operation scope is incomplete.');
  }
  const project = await ctx.db.get(operation.projectId);
  requireLiveProjectStatus(project, ['awaiting_replies', 'comparing'], 'Supplier reply extraction');
  const brief = await requireCurrentApprovedBrief(ctx, project, operation.briefId);
  const draft = await ctx.db.get(operation.outreachDraftId);
  if (
    !draft ||
    draft.projectId !== project._id ||
    draft.briefId !== brief._id ||
    draft.supplierId !== operation.supplierId ||
    !draft.approvedAt ||
    !draft.agentMailOutboundId ||
    !['queued', 'sent', 'delivered', 'replied'].includes(draft.status)
  ) {
    throw new Error('Supplier reply outreach scope is invalid.');
  }
  const thread = await ctx.db
    .query('mailThreads')
    .withIndex('by_outreachDraftId', (index) =>
      index.eq('outreachDraftId', operation.outreachDraftId),
    )
    .unique();
  if (
    !thread ||
    thread.projectId !== project._id ||
    thread.briefId !== brief._id ||
    thread.supplierId !== operation.supplierId ||
    thread.agentMailOutboundId !== draft.agentMailOutboundId
  ) {
    throw new Error('Supplier reply mail thread scope is invalid.');
  }
  const supplier = await ctx.db.get(operation.supplierId);
  if (!supplier) throw new Error('Supplier reply supplier is missing.');
  return {operation, project, brief, draft, thread, supplier};
}
