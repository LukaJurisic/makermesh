/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agentMail from "../agentMail.js";
import type * as ai_modelConfig from "../ai/modelConfig.js";
import type * as ai_prompts from "../ai/prompts.js";
import type * as ai_replyResponseSchema from "../ai/replyResponseSchema.js";
import type * as ai_schemas from "../ai/schemas.js";
import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as buyerResearch from "../buyerResearch.js";
import type * as buyerResearchActions from "../buyerResearchActions.js";
import type * as buyerResearchStore from "../buyerResearchStore.js";
import type * as buyerResearchWorkflow from "../buyerResearchWorkflow.js";
import type * as controlledOutreach from "../controlledOutreach.js";
import type * as controlledReply from "../controlledReply.js";
import type * as crons from "../crons.js";
import type * as demo from "../demo.js";
import type * as demoCapture from "../demoCapture.js";
import type * as fixtures_demoData from "../fixtures/demoData.js";
import type * as http from "../http.js";
import type * as lib_agentMailClient from "../lib/agentMailClient.js";
import type * as model_buyerResearch from "../model/buyerResearch.js";
import type * as model_controlledDemo from "../model/controlledDemo.js";
import type * as model_controlledOutreach from "../model/controlledOutreach.js";
import type * as model_controlledReply from "../model/controlledReply.js";
import type * as model_controlledScenario from "../model/controlledScenario.js";
import type * as model_evaluateRequirement from "../model/evaluateRequirement.js";
import type * as model_mailboxAllowlist from "../model/mailboxAllowlist.js";
import type * as model_normalizeRequirementValue from "../model/normalizeRequirementValue.js";
import type * as model_operatorVerifier from "../model/operatorVerifier.js";
import type * as model_outreachState from "../model/outreachState.js";
import type * as model_projectState from "../model/projectState.js";
import type * as model_publicDemoResearch from "../model/publicDemoResearch.js";
import type * as model_replyScope from "../model/replyScope.js";
import type * as model_requireOperator from "../model/requireOperator.js";
import type * as model_validators from "../model/validators.js";
import type * as openaiActions from "../openaiActions.js";
import type * as openaiStore from "../openaiStore.js";
import type * as operatorAuth from "../operatorAuth.js";
import type * as projects from "../projects.js";
import type * as researchFirecrawl from "../researchFirecrawl.js";
import type * as seed from "../seed.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agentMail: typeof agentMail;
  "ai/modelConfig": typeof ai_modelConfig;
  "ai/prompts": typeof ai_prompts;
  "ai/replyResponseSchema": typeof ai_replyResponseSchema;
  "ai/schemas": typeof ai_schemas;
  analytics: typeof analytics;
  auth: typeof auth;
  buyerResearch: typeof buyerResearch;
  buyerResearchActions: typeof buyerResearchActions;
  buyerResearchStore: typeof buyerResearchStore;
  buyerResearchWorkflow: typeof buyerResearchWorkflow;
  controlledOutreach: typeof controlledOutreach;
  controlledReply: typeof controlledReply;
  crons: typeof crons;
  demo: typeof demo;
  demoCapture: typeof demoCapture;
  "fixtures/demoData": typeof fixtures_demoData;
  http: typeof http;
  "lib/agentMailClient": typeof lib_agentMailClient;
  "model/buyerResearch": typeof model_buyerResearch;
  "model/controlledDemo": typeof model_controlledDemo;
  "model/controlledOutreach": typeof model_controlledOutreach;
  "model/controlledReply": typeof model_controlledReply;
  "model/controlledScenario": typeof model_controlledScenario;
  "model/evaluateRequirement": typeof model_evaluateRequirement;
  "model/mailboxAllowlist": typeof model_mailboxAllowlist;
  "model/normalizeRequirementValue": typeof model_normalizeRequirementValue;
  "model/operatorVerifier": typeof model_operatorVerifier;
  "model/outreachState": typeof model_outreachState;
  "model/projectState": typeof model_projectState;
  "model/publicDemoResearch": typeof model_publicDemoResearch;
  "model/replyScope": typeof model_replyScope;
  "model/requireOperator": typeof model_requireOperator;
  "model/validators": typeof model_validators;
  openaiActions: typeof openaiActions;
  openaiStore: typeof openaiStore;
  operatorAuth: typeof operatorAuth;
  projects: typeof projects;
  researchFirecrawl: typeof researchFirecrawl;
  seed: typeof seed;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
  workflow: import("@convex-dev/workflow/_generated/component.js").ComponentApi<"workflow">;
  firecrawl: import("@firecrawl/firecrawl-convex/_generated/component.js").ComponentApi<"firecrawl">;
  agentmail: import("@agentmail/convex/_generated/component.js").ComponentApi<"agentmail">;
  staticHosting: import("@convex-dev/static-hosting/_generated/component.js").ComponentApi<"staticHosting">;
};
