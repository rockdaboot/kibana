/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Filter, Query } from '@kbn/es-query';

export interface AlertsSelectionSettings {
  end: string;
  filters: Filter[];
  query: Query;
  size: number;
  start: string;
}
