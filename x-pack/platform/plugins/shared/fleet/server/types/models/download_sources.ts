/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { schema } from '@kbn/config-schema';

const secretRefSchema = schema.oneOf([
  schema.object({
    id: schema.string(),
  }),
  schema.string(),
]);

const DownloadSourceBaseSchema = {
  id: schema.maybe(schema.string()),
  name: schema.string(),
  host: schema.uri({ scheme: ['http', 'https'] }),
  is_default: schema.boolean({ defaultValue: false }),
  proxy_id: schema.maybe(
    schema.oneOf([
      schema.literal(null),
      schema.string({
        meta: {
          description:
            'The ID of the proxy to use for this download source. See the proxies API for more information.',
        },
      }),
    ])
  ),
  ssl: schema.maybe(
    schema.object({
      certificate_authorities: schema.maybe(schema.arrayOf(schema.string())),
      certificate: schema.maybe(schema.string()),
      key: schema.maybe(schema.string()),
    })
  ),
  secrets: schema.maybe(
    schema.object({
      ssl: schema.maybe(schema.object({ key: schema.maybe(secretRefSchema) })),
    })
  ),
};

export const DownloadSourceSchema = schema.object({ ...DownloadSourceBaseSchema });

export const DownloadSourceResponseSchema = DownloadSourceSchema.extends({
  id: schema.string(),
});

export const GetDownloadSourceResponseSchema = schema.object({
  item: DownloadSourceResponseSchema,
});
