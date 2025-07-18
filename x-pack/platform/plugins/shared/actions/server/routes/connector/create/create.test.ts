/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { createConnectorRoute } from './create';
import { httpServiceMock } from '@kbn/core/server/mocks';
import { licenseStateMock } from '../../../lib/license_state.mock';
import { mockHandlerArguments } from '../../_mock_handler_arguments';
import { verifyAccessAndContext } from '../../verify_access_and_context';
import { errors as esErrors } from '@elastic/elasticsearch';
import { type DiagnosticResult } from '@elastic/elasticsearch';
import { omit } from 'lodash';
import { actionsClientMock } from '../../../actions_client/actions_client.mock';
import { createConnectorRequestBodySchemaV1 } from '../../../../common/routes/connector/apis/create';

jest.mock('../../verify_access_and_context', () => ({
  verifyAccessAndContext: jest.fn(),
}));

beforeEach(() => {
  jest.resetAllMocks();
  (verifyAccessAndContext as jest.Mock).mockImplementation((license, handler) => handler);
});

describe('createConnectorRoute', () => {
  it('creates an action with proper parameters', async () => {
    const licenseState = licenseStateMock.create();
    const router = httpServiceMock.createRouter();

    createConnectorRoute(router, licenseState);

    const [config, handler] = router.post.mock.calls[0];

    expect(config.path).toMatchInlineSnapshot(`"/api/actions/connector/{id?}"`);

    const createResult = {
      id: '1',
      name: 'My name',
      actionTypeId: 'abc',
      config: { foo: true },
      isPreconfigured: false,
      isDeprecated: false,
      isMissingSecrets: false,
      isSystemAction: false,
    };

    const createApiResult = {
      ...omit(createResult, [
        'actionTypeId',
        'isPreconfigured',
        'isDeprecated',
        'isMissingSecrets',
        'isSystemAction',
      ]),
      connector_type_id: createResult.actionTypeId,
      is_preconfigured: createResult.isPreconfigured,
      is_deprecated: createResult.isDeprecated,
      is_missing_secrets: createResult.isMissingSecrets,
      is_system_action: createResult.isSystemAction,
    };

    const actionsClient = actionsClientMock.create();
    actionsClient.create.mockResolvedValueOnce(createResult);

    const [context, req, res] = mockHandlerArguments(
      { actionsClient },
      {
        body: {
          name: 'My name',
          connector_type_id: 'abc',
          config: { foo: true },
          secrets: {},
        },
      },
      ['ok']
    );

    expect(await handler(context, req, res)).toEqual({ body: createApiResult });

    expect(actionsClient.create).toHaveBeenCalledTimes(1);
    expect(actionsClient.create.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        Object {
          "action": Object {
            "actionTypeId": "abc",
            "config": Object {
              "foo": true,
            },
            "name": "My name",
            "secrets": Object {},
          },
          "options": undefined,
        },
      ]
    `);

    expect(res.ok).toHaveBeenCalledWith({
      body: createApiResult,
    });
  });

  it('Returns error message to kibana on error', async () => {
    const licenseState = licenseStateMock.create();
    const router = httpServiceMock.createRouter();
    createConnectorRoute(router, licenseState);
    const [config, handler] = router.post.mock.calls[0];
    expect(config.path).toMatchInlineSnapshot(`"/api/actions/connector/{id?}"`);

    const actionsClient = actionsClientMock.create();
    actionsClient.create.mockRejectedValueOnce(
      new esErrors.ResponseError({
        statusCode: 400,
        body: {
          error: {
            type: 'Bad request',
            reason: 'error_reason',
          },
        },
        warnings: [],
        headers: {},
        meta: {} as DiagnosticResult['meta'],
      })
    );
    const [context, req, res] = mockHandlerArguments(
      { actionsClient },
      {
        body: {
          name: 'My name',
          connector_type_id: 'abc',
          config: { foo: true },
          secrets: {},
        },
      },
      ['customError', 'forbidden', 'badRequest', 'notFound']
    );

    expect(await handler(context, req, res)).toEqual({ body: { message: 'Bad request' } });
    expect(actionsClient.create).toHaveBeenCalledTimes(1);
    expect(actionsClient.create.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        Object {
          "action": Object {
            "actionTypeId": "abc",
            "config": Object {
              "foo": true,
            },
            "name": "My name",
            "secrets": Object {},
          },
          "options": undefined,
        },
      ]
    `);
  });

  it('ensures the license allows creating actions', async () => {
    const licenseState = licenseStateMock.create();
    const router = httpServiceMock.createRouter();

    createConnectorRoute(router, licenseState);

    const [, handler] = router.post.mock.calls[0];

    const actionsClient = actionsClientMock.create();
    actionsClient.create.mockResolvedValueOnce({
      id: '1',
      name: 'My name',
      actionTypeId: 'abc',
      isMissingSecrets: false,
      config: { foo: true },
      isPreconfigured: false,
      isDeprecated: false,
      isSystemAction: false,
    });

    const [context, req, res] = mockHandlerArguments(
      { actionsClient },
      {
        body: {
          name: 'My name',
          connector_type_id: 'abc',
          config: { foo: true },
          secrets: {},
        },
      }
    );

    await handler(context, req, res);

    expect(verifyAccessAndContext).toHaveBeenCalledWith(licenseState, expect.any(Function));
  });

  it('ensures the license check prevents creating actions', async () => {
    const licenseState = licenseStateMock.create();
    const router = httpServiceMock.createRouter();

    (verifyAccessAndContext as jest.Mock).mockImplementation(() => async () => {
      throw new Error('OMG');
    });

    createConnectorRoute(router, licenseState);

    const [, handler] = router.post.mock.calls[0];

    const actionsClient = actionsClientMock.create();
    actionsClient.create.mockResolvedValueOnce({
      id: '1',
      name: 'My name',
      actionTypeId: 'abc',
      config: { foo: true },
      isMissingSecrets: false,
      isPreconfigured: false,
      isDeprecated: false,
      isSystemAction: false,
    });

    const [context, req, res] = mockHandlerArguments(
      { actionsClient },
      {
        body: {
          name: 'My name',
          connector_type_id: 'abc',
          config: { foo: true },
          secrets: {},
        },
      }
    );

    await expect(handler(context, req, res)).rejects.toMatchInlineSnapshot(`[Error: OMG]`);
  });

  test('validates body to prevent empty strings', async () => {
    const body = {
      name: 'My name',
      connector_type_id: 'abc',
      config: { foo: ' ' },
      secrets: {},
    };
    expect(() =>
      createConnectorRequestBodySchemaV1.validate(body)
    ).toThrowErrorMatchingInlineSnapshot(`"[config.foo]: value '' is not valid"`);
  });
});
