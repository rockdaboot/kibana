/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import DateMath from '@kbn/datemath';
import moment from 'moment';
import { getCerts } from './get_certs';
import { getUptimeESMockClient } from './test_helpers';

describe('getCerts', () => {
  let mockHits: any;

  beforeEach(() => {
    mockHits = [
      {
        _index: 'heartbeat-8.0.0-2020.04.16-000001',
        _id: 'DJwmhHEBnyP8RKDrEYVK',
        _score: 0,
        _source: {
          tls: {
            server: {
              x509: {
                not_before: '2019-08-16T01:40:25.000Z',
                not_after: '2020-07-16T03:15:39.000Z',
                subject: {
                  common_name: 'r2.shared.global.fastly.net',
                },
                issuer: {
                  common_name: 'GlobalSign CloudSSL CA - SHA256 - G3',
                },
              },
              hash: {
                sha1: 'b7b4b89ef0d0caf39d223736f0fdbb03c7b426f1',
                sha256: '12b00d04db0db8caa302bfde043e88f95baceb91e86ac143e93830b4bbec726d',
              },
            },
          },
          monitor: {
            name: 'Real World Test',
            id: 'real-world-test',
          },
          url: {
            full: 'https://fullurl.com',
          },
        },
        fields: {
          'tls.server.hash.sha256': [
            '12b00d04db0db8caa302bfde043e88f95baceb91e86ac143e93830b4bbec726d',
          ],
        },
        inner_hits: {
          monitors: {
            hits: {
              total: {
                value: 32,
                relation: 'eq',
              },
              max_score: null,
              hits: [
                {
                  _index: 'heartbeat-8.0.0-2020.04.16-000001',
                  _id: 'DJwmhHEBnyP8RKDrEYVK',
                  _score: null,
                  _source: {
                    monitor: {
                      name: 'Real World Test',
                      id: 'real-world-test',
                    },
                  },
                  fields: {
                    'monitor.id': ['real-world-test'],
                  },
                  sort: ['real-world-test'],
                },
              ],
            },
          },
        },
      },
    ];
  });

  it('parses query result and returns expected values', async () => {
    const dateMathSpy = jest.spyOn(DateMath, 'parse');

    dateMathSpy.mockReturnValue(moment(10000));
    const { esClient, uptimeEsClient } = getUptimeESMockClient();

    esClient.search.mockResponseOnce({
      hits: {
        hits: mockHits,
      },
    } as any);

    const result = await getCerts({
      uptimeEsClient,
      pageIndex: 1,
      from: 'now-2d',
      to: 'now+1h',
      search: 'my_common_name',
      size: 30,
      sortBy: 'not_after',
      direction: 'desc',
      notValidAfter: 'now+100d',
    });
    expect(result).toMatchInlineSnapshot(`
      Object {
        "certs": Array [
          Object {
            "common_name": "r2.shared.global.fastly.net",
            "issuer": "GlobalSign CloudSSL CA - SHA256 - G3",
            "locationName": undefined,
            "monitorName": "Real World Test",
            "monitorType": undefined,
            "monitorUrl": "https://fullurl.com",
            "monitors": Array [
              Object {
                "configId": undefined,
                "id": "real-world-test",
                "name": "Real World Test",
                "url": undefined,
              },
            ],
            "not_after": "2020-07-16T03:15:39.000Z",
            "not_before": "2019-08-16T01:40:25.000Z",
            "sha1": "b7b4b89ef0d0caf39d223736f0fdbb03c7b426f1",
            "sha256": "12b00d04db0db8caa302bfde043e88f95baceb91e86ac143e93830b4bbec726d",
          },
        ],
        "total": 0,
      }
    `);
    expect(esClient.search.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "_source": Array [
              "monitor.id",
              "monitor.name",
              "monitor.type",
              "url.full",
              "observer.geo.name",
              "tls.server.x509.issuer.common_name",
              "tls.server.x509.subject.common_name",
              "tls.server.hash.sha1",
              "tls.server.hash.sha256",
              "tls.server.x509.not_after",
              "tls.server.x509.not_before",
            ],
            "aggs": Object {
              "total": Object {
                "cardinality": Object {
                  "field": "tls.server.hash.sha256",
                },
              },
            },
            "collapse": Object {
              "field": "tls.server.hash.sha256",
              "inner_hits": Object {
                "_source": Object {
                  "includes": Array [
                    "monitor.id",
                    "monitor.name",
                    "url.full",
                    "config_id",
                  ],
                },
                "collapse": Object {
                  "field": "monitor.id",
                },
                "name": "monitors",
                "sort": Array [
                  Object {
                    "monitor.id": "asc",
                  },
                ],
              },
            },
            "from": 30,
            "index": "heartbeat-*",
            "query": Object {
              "bool": Object {
                "filter": Array [
                  Object {
                    "exists": Object {
                      "field": "summary",
                    },
                  },
                  Object {
                    "bool": Object {
                      "must_not": Object {
                        "exists": Object {
                          "field": "run_once",
                        },
                      },
                    },
                  },
                  Object {
                    "exists": Object {
                      "field": "tls.server.hash.sha256",
                    },
                  },
                  Object {
                    "range": Object {
                      "monitor.timespan": Object {
                        "gte": 10000,
                        "lte": 10000,
                      },
                    },
                  },
                  Object {
                    "bool": Object {
                      "minimum_should_match": 1,
                      "should": Array [
                        Object {
                          "range": Object {
                            "tls.certificate_not_valid_after": Object {
                              "lte": 10000,
                            },
                          },
                        },
                      ],
                    },
                  },
                ],
                "minimum_should_match": 1,
                "should": Array [
                  Object {
                    "multi_match": Object {
                      "fields": Array [
                        "monitor.id.text",
                        "monitor.name.text",
                        "url.full.text",
                        "tls.server.x509.subject.common_name.text",
                        "tls.server.x509.issuer.common_name.text",
                      ],
                      "query": "my_common_name",
                      "type": "phrase_prefix",
                    },
                  },
                ],
              },
            },
            "size": 30,
            "sort": Array [
              Object {
                "tls.server.x509.not_after": Object {
                  "order": "desc",
                },
              },
            ],
          },
          Object {
            "context": Object {
              "loggingOptions": Object {
                "loggerName": "uptime",
              },
            },
            "meta": true,
          },
        ],
      ]
    `);
  });
});
