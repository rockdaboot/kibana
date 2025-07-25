/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiSpacer } from '@elastic/eui';
import { OpenTelemetryInstructions } from './opentelemetry_instructions';
import {
  getApmAgentCommands,
  getApmAgentVariables,
  getApmAgentLineNumbers,
  getApmAgentHighlightLang,
} from './commands/get_apm_agent_commands';
import { AgentConfigurationTable } from './agent_config_table';
import { CommandsInstructionsCodeblock } from './commands_instructions_codeblock';

const SECRET_TOKEN_COMMAND_PLACEHOLDER = '<SECRET_TOKEN>';

export function AgentConfigInstructions({
  variantId,
  apmServerUrl,
  secretToken,
}: {
  variantId: string;
  apmServerUrl?: string;
  secretToken?: string;
}) {
  const defaultValues = {
    apmServiceName: 'my-service-name',
    apmEnvironment: 'my-environment',
  };

  if (variantId === 'openTelemetry') {
    return (
      <>
        <EuiSpacer />
        <OpenTelemetryInstructions apmServerUrl={apmServerUrl} secretToken={secretToken} />
      </>
    );
  }

  const commands = getApmAgentCommands({
    variantId,
    policyDetails: {
      apmServerUrl,
      secretToken: `${SECRET_TOKEN_COMMAND_PLACEHOLDER}`,
    },
    defaultValues,
  });

  const commandsWithSecrets = getApmAgentCommands({
    variantId,
    policyDetails: {
      apmServerUrl,
      secretToken,
    },
    defaultValues,
  });

  const variables = getApmAgentVariables(variantId);
  const lineNumbers = getApmAgentLineNumbers(variantId);
  const highlightLang = getApmAgentHighlightLang(variantId);

  return (
    <>
      <EuiSpacer />
      <AgentConfigurationTable
        variables={variables}
        data={{ apmServerUrl, secretToken, ...defaultValues }}
      />
      <EuiSpacer />
      <CommandsInstructionsCodeblock
        variantId={variantId}
        lineNumbers={lineNumbers}
        highlightLang={highlightLang}
        commands={commands}
        commandsWithSecrets={commandsWithSecrets}
      />
    </>
  );
}
