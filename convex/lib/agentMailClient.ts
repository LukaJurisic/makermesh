import {AgentMail} from '@agentmail/convex';
import {components} from '../_generated/api';
import {env} from '../_generated/server';

export const agentMail: AgentMail = new AgentMail(components.agentmail, {
  webhookSecret: env.AGENTMAIL_WEBHOOK_SECRET,
});
