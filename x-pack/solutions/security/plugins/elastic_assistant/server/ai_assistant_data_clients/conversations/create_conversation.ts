/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedUser, ElasticsearchClient, Logger } from '@kbn/core/server';

import {
  ConversationCategoryEnum,
  ConversationCreateProps,
  ConversationResponse,
} from '@kbn/elastic-assistant-common';
import { getConversation } from './get_conversation';
import { CreateMessageSchema } from './types';

export interface CreateConversationParams {
  esClient: ElasticsearchClient;
  logger: Logger;
  conversationIndex: string;
  spaceId: string;
  user: AuthenticatedUser;
  conversation: ConversationCreateProps;
}

export const createConversation = async ({
  esClient,
  conversationIndex,
  spaceId,
  user,
  conversation,
  logger,
}: CreateConversationParams): Promise<ConversationResponse | null> => {
  const createdAt = new Date().toISOString();
  const document = transformToCreateScheme(createdAt, spaceId, user, conversation);
  try {
    const response = await esClient.create({
      document,
      id: conversation?.id || uuidv4(),
      index: conversationIndex,
      refresh: 'wait_for',
    });

    const createdConversation = await getConversation({
      esClient,
      conversationIndex,
      id: response._id,
      logger,
      user,
    });
    return createdConversation;
  } catch (err) {
    logger.error(`Error creating conversation: ${err} with title: ${conversation.title}`);
    throw err;
  }
};

export const transformToCreateScheme = (
  createdAt: string,
  spaceId: string,
  user: AuthenticatedUser,
  {
    title,
    apiConfig,
    category,
    excludeFromLastConversationStorage,
    messages,
    replacements,
  }: ConversationCreateProps
): CreateMessageSchema => {
  return {
    '@timestamp': createdAt,
    created_at: createdAt,
    users: [
      {
        id: user.profile_uid,
        name: user.username,
      },
    ],
    title,
    category: category ?? ConversationCategoryEnum.assistant,
    api_config: apiConfig
      ? {
          action_type_id: apiConfig.actionTypeId,
          connector_id: apiConfig.connectorId,
          default_system_prompt_id: apiConfig.defaultSystemPromptId,
          model: apiConfig.model,
          provider: apiConfig.provider,
        }
      : undefined,
    exclude_from_last_conversation_storage: excludeFromLastConversationStorage,
    messages: messages?.map((message) => ({
      '@timestamp': message.timestamp,
      content: message.content,
      is_error: message.isError,
      reader: message.reader,
      role: message.role,
      ...(message.traceData
        ? {
            trace_data: {
              trace_id: message.traceData.traceId,
              transaction_id: message.traceData.transactionId,
            },
          }
        : {}),
    })),
    updated_at: createdAt,
    replacements: replacements
      ? Object.keys(replacements).map((key) => ({
          uuid: key,
          value: replacements[key],
        }))
      : undefined,
    namespace: spaceId,
  };
};
