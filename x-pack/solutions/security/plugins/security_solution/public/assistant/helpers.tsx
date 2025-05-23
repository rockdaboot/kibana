/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiIcon } from '@elastic/eui';
import type { CodeBlockDetails, Conversation } from '@kbn/elastic-assistant';
import { analyzeMarkdown } from '@kbn/elastic-assistant';
import React from 'react';
import { replaceAnonymizedValuesWithOriginalValues } from '@kbn/elastic-assistant-common';
import type { TimelineEventsDetailsItem } from '../../common/search_strategy';
import type { Rule } from '../detection_engine/rule_management/logic';
import { SendToTimelineButton } from './send_to_timeline';
import { DETECTION_RULES_CREATE_FORM_CONVERSATION_ID } from '../detection_engine/rule_creation_ui/components/ai_assistant/translations';
import { UpdateQueryInFormButton } from './update_query_in_form';

export const LOCAL_STORAGE_KEY = `securityAssistant`;

export const getPromptContextFromDetectionRules = (rules: Rule[]): string => {
  const data = rules.map((rule) => `Rule Name:${rule.name}\nRule Description:${rule.description}`);

  return data.join('\n\n');
};

export const getRawData = (data: TimelineEventsDetailsItem[]): Record<string, string[]> =>
  data
    .filter(({ field }) => !field.startsWith('signal.'))
    .reduce((acc, { field, values }) => ({ ...acc, [field]: values ?? [] }), {});

const sendToTimelineEligibleQueryTypes: Array<CodeBlockDetails['type']> = [
  'kql',
  'dsl',
  'eql',
  'esql',
  'sql', // Models often put the code block language as sql, for esql, so adding this as a fallback
];

/**
 * Augments the messages in a conversation with code block details, including
 * the start and end indices of the code block in the message, the type of the
 * code block, and the button to add the code block to the timeline.
 *
 * @param currentConversation
 */
export const augmentMessageCodeBlocks = (
  currentConversation: Conversation,
  showAnonymizedValues: boolean
): CodeBlockDetails[][] => {
  const cbd = currentConversation.messages.map(({ content }) =>
    analyzeMarkdown(
      showAnonymizedValues
        ? content ?? ''
        : replaceAnonymizedValuesWithOriginalValues({
            messageContent: content ?? '',
            replacements: currentConversation.replacements,
          })
    )
  );

  const output = cbd.map((codeBlocks, messageIndex) =>
    codeBlocks.map((codeBlock, codeBlockIndex) => {
      return {
        ...codeBlock,
        getControlContainer: () =>
          document.querySelectorAll(`.message-${messageIndex} .euiCodeBlock__controls`)[
            codeBlockIndex
          ],
        button: (
          <>
            {sendToTimelineEligibleQueryTypes.includes(codeBlock.type) ? (
              <SendToTimelineButton
                asEmptyButton={true}
                dataProviders={[
                  {
                    id: 'assistant-data-provider',
                    name: `Assistant Query from conversation ${currentConversation.id}`,
                    enabled: true,
                    excluded: false,
                    queryType: codeBlock.type,
                    kqlQuery: codeBlock.content ?? '',
                    queryMatch: {
                      field: 'host.name',
                      operator: ':',
                      value: 'test',
                    },
                    and: [],
                  },
                ]}
                keepDataView={true}
              >
                <EuiIcon type="timeline" />
              </SendToTimelineButton>
            ) : null}
            {DETECTION_RULES_CREATE_FORM_CONVERSATION_ID === currentConversation.title ? (
              <UpdateQueryInFormButton query={codeBlock.content ?? ''} />
            ) : null}
          </>
        ),
      };
    })
  );

  return output;
};
