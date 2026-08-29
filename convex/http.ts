import {AgentMail} from '@agentmail/convex';
import {registerStaticRoutes} from '@convex-dev/static-hosting';
import {httpRouter} from 'convex/server';
import {components, internal} from './_generated/api';
import {httpAction} from './_generated/server';
import {auth} from './auth';

const http = httpRouter();
type AgentMailMutationCtx = Parameters<AgentMail['handleWebhook']>[0];
const agentMailWebhook: AgentMail = new AgentMail(components.agentmail, {
  onMessageReceived: internal.agentMail.onMessageReceived,
  onEvent: internal.agentMail.onEvent,
  retryAttempts: 5,
  initialBackoffMs: 30_000,
});
auth.addHttpRoutes(http);
http.route({
  path: '/agentmail/webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) =>
    agentMailWebhook.handleWebhook(ctx as unknown as AgentMailMutationCtx, request),
  ),
});
registerStaticRoutes(http, components.staticHosting);

export default http;
