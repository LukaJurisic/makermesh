import {WorkflowManager} from '@convex-dev/workflow';
import {v} from 'convex/values';
import {components, internal} from './_generated/api';
export const buyerWorkflow = new WorkflowManager(components.workflow, {
  workpoolOptions: {retryActionsByDefault: false, maxParallelism: 2},
});
export const compile = buyerWorkflow.define({
  args: {requestId: v.id('buyerResearchRequests')},
  returns: v.null(),
  handler: async (step, args): Promise<null> => {
    try {
      await step.runAction(internal.buyerResearchActions.compile, args, {retry: false});
    } catch {
      await step.runMutation(internal.buyerResearchStore.fail, {
        ...args,
        error: 'Brief preparation failed. Your original request is preserved.',
      });
    }
    return null;
  },
});
export const research = buyerWorkflow.define({
  args: {requestId: v.id('buyerResearchRequests')},
  returns: v.null(),
  handler: async (step, args): Promise<null> => {
    try {
      await step.runAction(internal.buyerResearchActions.search, args, {retry: false});
      await step.runAction(internal.buyerResearchActions.extract, args, {retry: false});
    } catch {
      await step.runMutation(internal.buyerResearchStore.fail, {
        ...args,
        error: 'Research could not be completed. No maker was contacted.',
      });
    }
    return null;
  },
});
