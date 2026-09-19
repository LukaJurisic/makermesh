'use node';

import OpenAI from 'openai';
import {zodTextFormat} from 'openai/helpers/zod';
import {z} from 'zod';
import {v} from 'convex/values';
import {components, internal} from './_generated/api';
import type {Id} from './_generated/dataModel';
import {env, action, internalAction} from './_generated/server';
import {briefModel, extractionModel} from './ai/modelConfig';
import {promptRegistry} from './ai/prompts';
import {SourcingBriefSchema, SupplierReplySchema} from './ai/schemas';
import {supplierReplyResponseSchema} from './ai/replyResponseSchema';

const inboundMessagesSchema = z.array(
  z
    .object({
      messageId: z.string(),
      threadId: z.string(),
      text: z.string().optional(),
      extractedText: z.string().optional(),
    })
    .passthrough(),
);

function openaiClient() {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI is not configured.');
  return new OpenAI({apiKey, timeout: 45_000, maxRetries: 1});
}

async function sha256Hex(value: string) {
  const digest = new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)),
  );
  return [...digest].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export const compileBrief = action({
  args: {
    projectId: v.id('projects'),
    rawRequest: v.string(),
    destination: v.string(),
    requestId: v.string(),
  },
  returns: v.object({
    briefId: v.id('briefs'),
    model: v.string(),
    promptVersion: v.string(),
    reused: v.boolean(),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{
    briefId: Id<'briefs'>;
    model: string;
    promptVersion: string;
    reused: boolean;
  }> => {
    await ctx.runQuery(internal.operatorAuth.assertCurrent, {});
    if (env.PUBLIC_LIVE_BRIEF_COMPILATION !== 'true') {
      throw new Error('Live brief compilation is locked.');
    }
    if (args.rawRequest.length < 20 || args.rawRequest.length > 12_000) {
      throw new Error('Sourcing request length is invalid.');
    }
    if (args.destination.length < 2 || args.destination.length > 160) {
      throw new Error('Destination is invalid.');
    }
    if (!/^[a-zA-Z0-9_-]{8,80}$/.test(args.requestId)) {
      throw new Error('Request identifier is invalid.');
    }
    const prompt = promptRegistry.compileBrief;
    const requestHash = await sha256Hex(
      JSON.stringify({
        destination: args.destination,
        rawRequest: args.rawRequest,
        promptVersion: prompt.version,
      }),
    );
    const reservation: {
      created: boolean;
      operationId: Id<'externalOperations'>;
      resultReference: string | null;
      attempt: number;
    } = await ctx.runMutation(internal.openaiStore.reserve, {
      projectId: args.projectId,
      operation: 'compile_brief',
      idempotencyKey: `openai:compile:${args.projectId}:${args.requestId}`,
      requestHash,
    });
    const model = briefModel();
    if (!reservation.created) {
      if (!reservation.resultReference) throw new Error('Brief compilation is already running.');
      return {
        briefId: reservation.resultReference as Id<'briefs'>,
        model,
        promptVersion: prompt.version,
        reused: true,
      };
    }
    const startedAt = Date.now();
    try {
      const response = await openaiClient().responses.parse({
        model,
        store: false,
        reasoning: {effort: 'low'},
        max_output_tokens: 6_000,
        input: [
          {role: 'system', content: prompt.instructions},
          {
            role: 'user',
            content: `Destination: ${args.destination}\n\nBuyer request:\n${args.rawRequest}`,
          },
        ],
        text: {format: zodTextFormat(SourcingBriefSchema, 'sourcing_brief')},
      });
      const parsed = SourcingBriefSchema.parse(response.output_parsed);
      const briefId: Id<'briefs'> = await ctx.runMutation(
        internal.openaiStore.persistCompiledBrief,
        {
          operationId: reservation.operationId,
          projectId: args.projectId,
          rawRequest: args.rawRequest,
          resultJson: JSON.stringify(parsed),
          model,
          promptVersion: prompt.version,
          latencyMs: Date.now() - startedAt,
          attempt: reservation.attempt,
        },
      );
      return {briefId, model, promptVersion: prompt.version, reused: false};
    } catch (error) {
      await ctx.runMutation(internal.openaiStore.markFailed, {
        operationId: reservation.operationId,
        attempt: reservation.attempt,
        errorCode:
          error instanceof z.ZodError ? 'INVALID_STRUCTURED_OUTPUT' : 'OPENAI_REQUEST_FAILED',
      });
      throw new Error('OpenAI brief compilation failed.');
    }
  },
});

export const extractSupplierReply = internalAction({
  args: {operationId: v.id('externalOperations'), attempt: v.number()},
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const startedAt = Date.now();
    let claimed = false;
    try {
      const context = await ctx.runMutation(internal.openaiStore.claimReplyExtraction, {
        operationId: args.operationId,
        expectedAttempt: args.attempt,
      });
      claimed = true;
      const rawMessages: unknown = await ctx.runQuery(
        components.agentmail.lib.listInboundMessages,
        {threadId: context.threadId},
      );
      const messages = inboundMessagesSchema.parse(rawMessages);
      const message = messages.find((item) => item.messageId === context.messageId);
      const rawOriginalText = message?.extractedText ?? message?.text;
      const originalText = rawOriginalText?.slice(0, 12_000);
      if (!originalText) throw new Error('Inbound message text is unavailable.');
      if ((await sha256Hex(originalText)) !== context.sourceContentHash) {
        throw new Error('Inbound message content changed before extraction.');
      }
      const prompt = promptRegistry.supplierReply;
      if (context.parserVersion !== prompt.version) {
        throw new Error('Supplier reply parser version is stale.');
      }
      const model = extractionModel();
      const response = await openaiClient().responses.parse({
        model,
        store: false,
        reasoning: {effort: 'low'},
        max_output_tokens: 6_000,
        input: [
          {role: 'system', content: prompt.instructions},
          {
            role: 'user',
            content: `Project: ${context.projectTitle}\nSupplier: ${context.supplierName}\nRequirement keys: ${JSON.stringify(context.requirements)}\n\nOriginal supplier email:\n${originalText}`,
          },
        ],
        text: {format: zodTextFormat(supplierReplyResponseSchema(originalText), 'supplier_reply')},
      });
      const parsed = SupplierReplySchema.parse(response.output_parsed);
      await ctx.runMutation(internal.openaiStore.persistSupplierReply, {
        operationId: args.operationId,
        attempt: args.attempt,
        originalText,
        resultJson: JSON.stringify(parsed),
        model,
        promptVersion: prompt.version,
        latencyMs: Date.now() - startedAt,
      });
      return null;
    } catch (error) {
      if (claimed) {
        await ctx.runMutation(internal.openaiStore.markFailed, {
          operationId: args.operationId,
          attempt: args.attempt,
          errorCode:
            error instanceof z.ZodError ? 'INVALID_STRUCTURED_OUTPUT' : 'OPENAI_REQUEST_FAILED',
        });
      }
      return null;
    }
  },
});
