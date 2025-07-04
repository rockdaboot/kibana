/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { i18n } from '@kbn/i18n';
import type { ServiceParams } from '@kbn/actions-plugin/server';
import { CaseConnector } from '@kbn/actions-plugin/server';
import type { AxiosError } from 'axios';
import type { Type } from '@kbn/config-schema';
import type { ConnectorUsageCollector } from '@kbn/actions-plugin/server/types';
import { SUB_ACTION } from '../../../common/thehive/constants';
import {
  TheHiveIncidentResponseSchema,
  TheHiveUpdateIncidentResponseSchema,
  TheHiveAddCommentResponseSchema,
  TheHiveCreateAlertResponseSchema,
  ExecutorSubActionCreateAlertParamsSchema,
} from '../../../common/thehive/schema';
import type {
  TheHiveConfig,
  TheHiveSecrets,
  ExecutorSubActionCreateAlertParams,
  TheHiveFailureResponse,
  ExternalServiceIncidentResponse,
  Incident,
  GetIncidentResponse,
} from '../../../common/thehive/types';

export const API_VERSION = 'v1';

export class TheHiveConnector extends CaseConnector<
  TheHiveConfig,
  TheHiveSecrets,
  Incident,
  GetIncidentResponse
> {
  private url: string;
  private apiKey: string;
  private organisation: string | null;
  private urlWithoutTrailingSlash: string;

  constructor(
    params: ServiceParams<TheHiveConfig, TheHiveSecrets>,
    pushToServiceParamsExtendedSchema: Record<string, Type<unknown>>
  ) {
    super(params, pushToServiceParamsExtendedSchema);

    this.registerSubAction({
      name: SUB_ACTION.CREATE_ALERT,
      method: 'createAlert',
      schema: ExecutorSubActionCreateAlertParamsSchema,
    });

    this.url = this.config.url;
    this.organisation = this.config.organisation;
    this.apiKey = this.secrets.apiKey;
    this.urlWithoutTrailingSlash = this.url?.endsWith('/') ? this.url.slice(0, -1) : this.url;
  }

  private getAuthHeaders() {
    return { Authorization: `Bearer ${this.apiKey}`, 'X-Organisation': this.organisation };
  }

  protected getResponseErrorMessage(error: AxiosError<TheHiveFailureResponse>): string {
    if (!error.response?.status) {
      return 'Unknown API Error';
    }
    return `API Error: ${error.response?.data?.type} - ${error.response?.data?.message}`;
  }

  public async createIncident(
    incident: Incident,
    connectorUsageCollector: ConnectorUsageCollector
  ): Promise<ExternalServiceIncidentResponse> {
    const res = await this.request(
      {
        method: 'post',
        url: `${this.url}/api/${API_VERSION}/case`,
        data: incident,
        headers: this.getAuthHeaders(),
        responseSchema: TheHiveIncidentResponseSchema,
      },
      connectorUsageCollector
    );

    return {
      id: res.data._id,
      title: res.data.title,
      url: `${this.urlWithoutTrailingSlash}/cases/${res.data._id}/details`,
      pushedDate: new Date(res.data._createdAt).toISOString(),
    };
  }

  public async addComment(
    { incidentId, comment }: { incidentId: string; comment: string },
    connectorUsageCollector: ConnectorUsageCollector
  ) {
    await this.request(
      {
        method: 'post',
        url: `${this.url}/api/${API_VERSION}/case/${incidentId}/comment`,
        data: { message: comment },
        headers: this.getAuthHeaders(),
        responseSchema: TheHiveAddCommentResponseSchema,
      },
      connectorUsageCollector
    );
  }

  public async updateIncident(
    {
      incidentId,
      incident,
    }: {
      incidentId: string;
      incident: Incident;
    },
    connectorUsageCollector: ConnectorUsageCollector
  ): Promise<ExternalServiceIncidentResponse> {
    await this.request(
      {
        method: 'patch',
        url: `${this.url}/api/${API_VERSION}/case/${incidentId}`,
        data: incident,
        headers: this.getAuthHeaders(),
        responseSchema: TheHiveUpdateIncidentResponseSchema,
      },
      connectorUsageCollector
    );

    return {
      id: incidentId,
      title: incident.title,
      url: `${this.urlWithoutTrailingSlash}/cases/${incidentId}/details`,
      pushedDate: new Date().toISOString(),
    };
  }

  public async getIncident(
    { id }: { id: string },
    connectorUsageCollector: ConnectorUsageCollector
  ): Promise<GetIncidentResponse> {
    const res = await this.request(
      {
        url: `${this.url}/api/${API_VERSION}/case/${id}`,
        headers: this.getAuthHeaders(),
        responseSchema: TheHiveIncidentResponseSchema,
      },
      connectorUsageCollector
    );

    return res.data;
  }

  private formatAlertBody(alert: ExecutorSubActionCreateAlertParams) {
    try {
      const { body, isRuleSeverity, ...restOfAlert } = alert;
      const bodyJson = JSON.parse(body || '{}');
      const mergedAlertBody = { ...bodyJson, ...restOfAlert };

      return mergedAlertBody;
    } catch (err) {
      throw new Error(
        i18n.translate('xpack.stackConnectors.thehive.alertBodyParsingError', {
          defaultMessage: 'Error parsing alert body for thehive: {err}',
          values: {
            err: err.toString(),
          },
        })
      );
    }
  }

  public async createAlert(
    alert: ExecutorSubActionCreateAlertParams,
    connectorUsageCollector: ConnectorUsageCollector
  ) {
    const mergedAlertBody = this.formatAlertBody(alert);
    await this.request(
      {
        method: 'post',
        url: `${this.url}/api/${API_VERSION}/alert`,
        data: mergedAlertBody,
        headers: this.getAuthHeaders(),
        responseSchema: TheHiveCreateAlertResponseSchema,
      },
      connectorUsageCollector
    );
  }
}
