import type {Doc, Id} from '../_generated/dataModel';
import type {MutationCtx, QueryCtx} from '../_generated/server';

export type ProjectStatus = Doc<'projects'>['status'];

const allowedTransitions: Record<ProjectStatus, readonly ProjectStatus[]> = {
  draft: ['brief_ready', 'error', 'archived'],
  brief_ready: ['brief_ready', 'researching', 'error', 'archived'],
  researching: ['researching', 'reviewing_candidates', 'error', 'archived'],
  reviewing_candidates: ['researching', 'outreach_ready', 'error', 'archived'],
  outreach_ready: ['researching', 'awaiting_replies', 'error', 'archived'],
  awaiting_replies: ['outreach_ready', 'comparing', 'error', 'archived'],
  comparing: ['outreach_ready', 'selected', 'error', 'archived'],
  selected: ['archived'],
  archived: [],
  error: ['draft', 'brief_ready', 'researching', 'outreach_ready', 'archived'],
};

export function requireLiveProjectStatus(
  project: Doc<'projects'> | null,
  allowed: readonly ProjectStatus[],
  operation: string,
): asserts project is Doc<'projects'> {
  if (!project || project.dataMode !== 'live') {
    throw new Error(`${operation} requires a live project.`);
  }
  if (!allowed.includes(project.status)) {
    throw new Error(`${operation} is not allowed while the project is ${project.status}.`);
  }
}

export function isLiveProjectStatus(
  project: Doc<'projects'> | null,
  allowed: readonly ProjectStatus[],
): project is Doc<'projects'> {
  return Boolean(project && project.dataMode === 'live' && allowed.includes(project.status));
}

export function isCurrentApprovedBrief(
  project: Doc<'projects'>,
  brief: Doc<'briefs'> | null,
): brief is Doc<'briefs'> {
  return Boolean(
    brief &&
    brief.projectId === project._id &&
    brief.approvedAt &&
    project.currentApprovedBriefId === brief._id,
  );
}

export function assertProjectTransition(from: ProjectStatus, to: ProjectStatus) {
  if (!allowedTransitions[from].includes(to)) {
    throw new Error(`Project transition ${from} → ${to} is not allowed.`);
  }
}

export async function transitionProject(
  ctx: {db: MutationCtx['db']},
  project: Doc<'projects'>,
  to: ProjectStatus,
  updatedAt = Date.now(),
) {
  if (project.status === to) return project;
  assertProjectTransition(project.status, to);
  await ctx.db.patch(project._id, {status: to, updatedAt});
  return {...project, status: to, updatedAt};
}

export async function requireCurrentApprovedBrief(
  ctx: {db: QueryCtx['db']},
  project: Doc<'projects'>,
  briefId: Id<'briefs'>,
) {
  const brief = await ctx.db.get(briefId);
  if (!brief || brief.projectId !== project._id || !brief.approvedAt) {
    throw new Error('The approved brief version is missing.');
  }
  if (!isCurrentApprovedBrief(project, brief)) {
    throw new Error('The operation does not use the current approved brief.');
  }
  return brief;
}
