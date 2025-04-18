/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/*
 * NOTICE: Do not edit this file manually.
 * This file is automatically generated by the OpenAPI Generator, @kbn/openapi-generator.
 *
 * info:
 *   title: Chat Complete API endpoint
 *   version: 2023-10-31
 */

import { z } from '@kbn/zod';
import { BooleanFromString } from '@kbn/zod-helpers';

import { NonEmptyString } from '../common_attributes.gen';

export type RootContext = z.infer<typeof RootContext>;
export const RootContext = z.literal('security');

/**
 * Message role.
 */
export type ChatMessageRole = z.infer<typeof ChatMessageRole>;
export const ChatMessageRole = z.enum(['system', 'user', 'assistant']);
export type ChatMessageRoleEnum = typeof ChatMessageRole.enum;
export const ChatMessageRoleEnum = ChatMessageRole.enum;

export type MessageData = z.infer<typeof MessageData>;
export const MessageData = z.object({}).catchall(z.unknown());

/**
 * AI assistant message.
 */
export type ChatMessage = z.infer<typeof ChatMessage>;
export const ChatMessage = z.object({
  /**
   * Message content.
   */
  content: z.string().optional(),
  /**
   * Message role.
   */
  role: ChatMessageRole,
  /**
   * ECS object to attach to the context of the message.
   */
  data: MessageData.optional(),
  fields_to_anonymize: z.array(z.string()).optional(),
});

export type ChatCompleteProps = z.infer<typeof ChatCompleteProps>;
export const ChatCompleteProps = z.object({
  conversationId: NonEmptyString.optional(),
  promptId: z.string().optional(),
  isStream: z.boolean().optional(),
  responseLanguage: z.string().optional(),
  langSmithProject: z.string().optional(),
  langSmithApiKey: z.string().optional(),
  connectorId: z.string(),
  model: z.string().optional(),
  persist: z.boolean(),
  messages: z.array(ChatMessage),
});

export type ChatCompleteRequestQuery = z.infer<typeof ChatCompleteRequestQuery>;
export const ChatCompleteRequestQuery = z.object({
  /**
   * If true, the response will not include content references.
   */
  content_references_disabled: BooleanFromString.optional().default(false),
});
export type ChatCompleteRequestQueryInput = z.input<typeof ChatCompleteRequestQuery>;

export type ChatCompleteRequestBody = z.infer<typeof ChatCompleteRequestBody>;
export const ChatCompleteRequestBody = ChatCompleteProps;
export type ChatCompleteRequestBodyInput = z.input<typeof ChatCompleteRequestBody>;
