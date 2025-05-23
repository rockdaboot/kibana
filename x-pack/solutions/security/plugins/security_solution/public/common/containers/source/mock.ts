/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { flatten } from 'lodash';
import type { FieldSpec } from '@kbn/data-views-plugin/common';
import type { BrowserFields } from '../../../../common/search_strategy/index_fields';

export const mocksSource = {
  indexFields: [
    {
      name: 'bytes',
      type: 'number',
      esTypes: ['long'],
      aggregatable: true,
      searchable: true,
      count: 10,
      readFromDocValues: true,
      scripted: false,
      isMapped: true,
    },
    {
      name: 'ssl',
      type: 'boolean',
      esTypes: ['boolean'],
      aggregatable: true,
      searchable: true,
      count: 20,
      readFromDocValues: true,
      scripted: false,
      isMapped: true,
    },
    {
      name: '@timestamp',
      type: 'date',
      esTypes: ['date'],
      aggregatable: true,
      searchable: true,
      count: 30,
      readFromDocValues: true,
      scripted: false,
      isMapped: true,
    },
  ],
};

export const mockBrowserFields: BrowserFields = {
  agent: {
    fields: {
      'agent.ephemeral_id': {
        aggregatable: true,
        name: 'agent.ephemeral_id',
        searchable: true,
        type: 'string',
        esTypes: ['keyword'],
      },
      'agent.hostname': {
        aggregatable: true,
        name: 'agent.hostname',
        searchable: true,
        type: 'string',
        esTypes: ['keyword'],
      },
      'agent.id': {
        aggregatable: true,
        name: 'agent.id',
        searchable: true,
        type: 'string',
        esTypes: ['keyword'],
      },
      'agent.name': {
        aggregatable: true,
        name: 'agent.name',
        searchable: true,
        type: 'string',
        esTypes: ['keyword'],
      },
    },
  },
  auditd: {
    fields: {
      'auditd.data.a0': {
        aggregatable: true,
        name: 'auditd.data.a0',
        searchable: true,
        type: 'string',
        esTypes: ['keyword'],
      },
      'auditd.data.a1': {
        aggregatable: true,
        name: 'auditd.data.a1',
        searchable: true,
        type: 'string',
        esTypes: ['keyword'],
      },
      'auditd.data.a2': {
        aggregatable: true,
        name: 'auditd.data.a2',
        searchable: true,
        type: 'string',
        esTypes: ['keyword'],
      },
    },
  },
  base: {
    fields: {
      '@timestamp': {
        aggregatable: true,
        name: '@timestamp',
        searchable: true,
        type: 'date',
        esTypes: ['date'],
        readFromDocValues: true,
      },
      _id: {
        name: '_id',
        type: 'string',
        esTypes: [],
        searchable: true,
        aggregatable: false,
      },
      message: {
        name: 'message',
        type: 'string',
        esTypes: ['text'],
        searchable: true,
        aggregatable: false,
        format: { id: 'string' },
      },
    },
  },
  client: {
    fields: {
      'client.address': {
        aggregatable: true,
        name: 'client.address',
        searchable: true,
        type: 'string',
        esTypes: ['keyword'],
      },
      'client.bytes': {
        aggregatable: true,
        name: 'client.bytes',
        searchable: true,
        type: 'number',
        esTypes: ['long'],
      },
      'client.domain': {
        aggregatable: true,
        name: 'client.domain',
        searchable: true,
        type: 'string',
        esTypes: ['keyword'],
      },
      'client.geo.country_iso_code': {
        aggregatable: true,
        name: 'client.geo.country_iso_code',
        searchable: true,
        type: 'string',
        esTypes: ['keyword'],
      },
    },
  },
  cloud: {
    fields: {
      'cloud.account.id': {
        aggregatable: true,
        name: 'cloud.account.id',
        searchable: true,
        type: 'string',
        esTypes: ['keyword'],
      },
      'cloud.availability_zone': {
        aggregatable: true,
        name: 'cloud.availability_zone',
        searchable: true,
        type: 'string',
        esTypes: ['keyword'],
      },
    },
  },
  container: {
    fields: {
      'container.id': {
        aggregatable: true,
        name: 'container.id',
        searchable: true,
        type: 'string',
        esTypes: ['keyword'],
      },
      'container.image.name': {
        aggregatable: true,
        name: 'container.image.name',
        searchable: true,
        type: 'string',
        esTypes: ['keyword'],
      },
      'container.image.tag': {
        aggregatable: true,
        name: 'container.image.tag',
        searchable: true,
        type: 'string',
        esTypes: ['keyword'],
      },
    },
  },
  destination: {
    fields: {
      'destination.address': {
        aggregatable: true,
        name: 'destination.address',
        searchable: true,
        type: 'string',
        esTypes: ['keyword'],
      },
      'destination.bytes': {
        aggregatable: true,
        name: 'destination.bytes',
        searchable: true,
        type: 'number',
        esTypes: ['long'],
      },
      'destination.domain': {
        aggregatable: true,
        name: 'destination.domain',
        searchable: true,
        type: 'string',
        esTypes: ['keyword'],
      },
      'destination.ip': {
        aggregatable: true,
        name: 'destination.ip',
        searchable: true,
        type: 'ip',
        esTypes: ['ip'],
      },
      'destination.port': {
        aggregatable: true,
        name: 'destination.port',
        searchable: true,
        type: 'number',
        esTypes: ['long'],
      },
    },
  },
  event: {
    fields: {
      'event.end': {
        name: 'event.end',
        searchable: true,
        type: 'date',
        esTypes: ['date'],
        aggregatable: true,
      },
      'event.action': {
        name: 'event.action',
        type: 'string',
        esTypes: ['keyword'],
        searchable: true,
        aggregatable: true,
        format: { id: 'string' },
      },
      'event.category': {
        name: 'event.category',
        type: 'string',
        esTypes: ['keyword'],
        searchable: true,
        aggregatable: true,
        format: { id: 'string' },
      },
      'event.severity': {
        name: 'event.severity',
        type: 'number',
        esTypes: ['long'],
        format: { id: 'number' },
        searchable: true,
        aggregatable: true,
      },
      'event.kind': {
        name: 'event.kind',
        type: 'string',
        esTypes: ['keyword'],
        format: { id: 'string' },
        searchable: true,
        aggregatable: true,
      },
    },
  },
  host: {
    fields: {
      'host.name': {
        name: 'host.name',
        type: 'string',
        esTypes: ['keyword'],
        searchable: true,
        aggregatable: true,
        format: { id: 'string' },
      },
    },
  },
  source: {
    fields: {
      'source.ip': {
        aggregatable: true,
        name: 'source.ip',
        searchable: true,
        type: 'ip',
        esTypes: ['ip'],
      },
      'source.port': {
        aggregatable: true,
        name: 'source.port',
        searchable: true,
        type: 'number',
        esTypes: ['long'],
      },
    },
  },
  user: {
    fields: {
      'user.name': {
        name: 'user.name',
        type: 'string',
        esTypes: ['keyword'],
        searchable: true,
        aggregatable: true,
        format: { id: 'string' },
      },
    },
  },
  nestedField: {
    fields: {
      'nestedField.firstAttributes': {
        aggregatable: false,
        name: 'nestedField.firstAttributes',
        searchable: true,
        type: 'string',
        subType: {
          nested: {
            path: 'nestedField',
          },
        },
      },
      'nestedField.secondAttributes': {
        aggregatable: false,
        name: 'nestedField.secondAttributes',
        searchable: true,
        type: 'string',
        subType: {
          nested: {
            path: 'nestedField',
          },
        },
      },
      'nestedField.thirdAttributes': {
        aggregatable: false,
        name: 'nestedField.thirdAttributes',
        searchable: true,
        type: 'date',
        subType: {
          nested: {
            path: 'nestedField',
          },
        },
      },
    },
  },

  process: {
    fields: {
      'process.args': {
        name: 'process.args',
        type: 'string',
        esTypes: ['keyword'],
        searchable: true,
        aggregatable: true,
        readFromDocValues: true,
      },
    },
  },
};

export const mockIndexFields = flatten(
  Object.values(mockBrowserFields).map((fieldItem) => Object.values(fieldItem.fields ?? {}))
);

export const mockIndexFieldsByName = mockIndexFields.reduce((acc, indexFieldObj) => {
  if (indexFieldObj.name) {
    acc[indexFieldObj.name] = indexFieldObj;
  }
  return acc;
}, {} as { [fieldName: string]: Partial<FieldSpec> });
