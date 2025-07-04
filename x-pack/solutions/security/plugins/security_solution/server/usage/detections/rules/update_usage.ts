/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { RulesTypeUsage, RuleMetric } from './types';
import { updateQueryUsage } from './usage_utils/update_query_usage';
import { updateTotalUsage } from './usage_utils/update_total_usage';

export const updateRuleUsage = (
  detectionRuleMetric: RuleMetric,
  usage: RulesTypeUsage
): RulesTypeUsage => {
  let updatedUsage = usage;
  if (detectionRuleMetric.rule_type === 'query') {
    updatedUsage = {
      ...usage,
      query: updateQueryUsage({
        ruleType: detectionRuleMetric.rule_type,
        usage,
        detectionRuleMetric,
      }),
    };

    if (!detectionRuleMetric.elastic_rule) {
      updatedUsage = {
        ...updatedUsage,
        query_custom: updateQueryUsage({
          ruleType: 'query_custom',
          usage,
          detectionRuleMetric,
        }),
      };
    }
  } else if (detectionRuleMetric.rule_type === 'threshold') {
    updatedUsage = {
      ...usage,
      threshold: updateQueryUsage({
        ruleType: detectionRuleMetric.rule_type,
        usage,
        detectionRuleMetric,
      }),
    };

    if (!detectionRuleMetric.elastic_rule) {
      updatedUsage = {
        ...updatedUsage,
        threshold_custom: updateQueryUsage({
          ruleType: 'threshold_custom',
          usage,
          detectionRuleMetric,
        }),
      };
    }
  } else if (detectionRuleMetric.rule_type === 'eql') {
    updatedUsage = {
      ...usage,
      eql: updateQueryUsage({
        ruleType: detectionRuleMetric.rule_type,
        usage,
        detectionRuleMetric,
      }),
    };

    if (!detectionRuleMetric.elastic_rule) {
      updatedUsage = {
        ...updatedUsage,
        eql_custom: updateQueryUsage({
          ruleType: 'eql_custom',
          usage,
          detectionRuleMetric,
        }),
      };
    }
  } else if (detectionRuleMetric.rule_type === 'machine_learning') {
    updatedUsage = {
      ...usage,
      machine_learning: updateQueryUsage({
        ruleType: detectionRuleMetric.rule_type,
        usage,
        detectionRuleMetric,
      }),
    };

    if (!detectionRuleMetric.elastic_rule) {
      updatedUsage = {
        ...updatedUsage,
        machine_learning_custom: updateQueryUsage({
          ruleType: 'machine_learning_custom',
          usage,
          detectionRuleMetric,
        }),
      };
    }
  } else if (detectionRuleMetric.rule_type === 'threat_match') {
    updatedUsage = {
      ...usage,
      threat_match: updateQueryUsage({
        ruleType: detectionRuleMetric.rule_type,
        usage,
        detectionRuleMetric,
      }),
    };

    if (!detectionRuleMetric.elastic_rule) {
      updatedUsage = {
        ...updatedUsage,
        threat_match_custom: updateQueryUsage({
          ruleType: 'threat_match_custom',
          usage,
          detectionRuleMetric,
        }),
      };
    }
  } else if (detectionRuleMetric.rule_type === 'new_terms') {
    updatedUsage = {
      ...usage,
      new_terms: updateQueryUsage({
        ruleType: detectionRuleMetric.rule_type,
        usage,
        detectionRuleMetric,
      }),
    };

    if (!detectionRuleMetric.elastic_rule) {
      updatedUsage = {
        ...updatedUsage,
        new_terms_custom: updateQueryUsage({
          ruleType: 'new_terms_custom',
          usage,
          detectionRuleMetric,
        }),
      };
    }
  } else if (detectionRuleMetric.rule_type === 'esql') {
    updatedUsage = {
      ...usage,
      esql: updateQueryUsage({
        ruleType: detectionRuleMetric.rule_type,
        usage,
        detectionRuleMetric,
      }),
    };

    if (!detectionRuleMetric.elastic_rule) {
      updatedUsage = {
        ...updatedUsage,
        esql_custom: updateQueryUsage({
          ruleType: 'esql_custom',
          usage,
          detectionRuleMetric,
        }),
      };
    }
  }

  if (detectionRuleMetric.elastic_rule) {
    updatedUsage = {
      ...updatedUsage,
      elastic_total: updateTotalUsage({
        detectionRuleMetric,
        updatedUsage,
        totalType: 'elastic_total',
      }),
    };
  } else {
    updatedUsage = {
      ...updatedUsage,
      custom_total: updateTotalUsage({
        detectionRuleMetric,
        updatedUsage,
        totalType: 'custom_total',
      }),
    };
  }

  return updatedUsage;
};
