/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { KueryNode, fromKueryExpression, toElasticsearchQuery } from '@kbn/es-query';
import { QueryDslQueryContainer } from '@elastic/elasticsearch/lib/api/types';
import { SyntheticsMonitorStatusRuleParams as StatusRuleParams } from '@kbn/response-ops-rule-params/synthetics_monitor_status';
import { ALL_SPACES_ID } from '@kbn/security-plugin/common/constants';
import { SyntheticsEsClient } from '../../../lib';
import {
  FINAL_SUMMARY_FILTER,
  getRangeFilter,
  getTimeSpanFilter,
} from '../../../../common/constants/client_defaults';

export async function queryFilterMonitors({
  spaceId,
  esClient,
  ruleParams,
}: {
  spaceId: string;
  esClient: SyntheticsEsClient;
  ruleParams: StatusRuleParams;
}) {
  if (!ruleParams.kqlQuery) {
    return;
  }

  let kueryNode: KueryNode;

  // This is to check if the kqlQuery is valid, if it is not the fromKueryExpression will throw an error
  try {
    kueryNode = fromKueryExpression(ruleParams.kqlQuery);
  } catch (error) {
    return;
  }

  const filters = toElasticsearchQuery(kueryNode);
  const { body: result } = await esClient.search(
    {
      size: 0,
      query: {
        bool: {
          filter: [
            FINAL_SUMMARY_FILTER,
            getRangeFilter({ from: 'now-24h/m', to: 'now/m' }),
            getTimeSpanFilter(),
            {
              terms: {
                'meta.space_id': [spaceId, ALL_SPACES_ID],
              },
            },
            {
              bool: {
                should: filters,
              },
            },
            ...getFilters(ruleParams),
          ],
        },
      },
      aggs: {
        ids: {
          terms: {
            size: 10000,
            field: 'config_id',
          },
        },
      },
    },
    'queryFilterMonitors'
  );

  return result.aggregations?.ids.buckets.map((bucket) => bucket.key as string);
}

export const getFilters = (ruleParams: StatusRuleParams) => {
  const { monitorTypes, locations, tags, projects } = ruleParams;
  const filters: QueryDslQueryContainer[] = [];
  if (monitorTypes?.length) {
    filters.push({
      terms: {
        'monitor.type': monitorTypes,
      },
    });
  }

  if (locations?.length) {
    filters.push({
      terms: {
        'observer.name': locations,
      },
    });
  }

  if (tags?.length) {
    filters.push({
      terms: {
        tags,
      },
    });
  }

  if (projects?.length) {
    filters.push({
      terms: {
        'monitor.project.id': projects,
      },
    });
  }

  return filters;
};
