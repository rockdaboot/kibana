/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { schema } from '@kbn/config-schema';
import {
  RequestHandlerContext,
  KibanaRequest,
  KibanaResponseFactory,
  IKibanaResponse,
  IRouter,
  IScopedClusterClient,
} from '@kbn/core/server';
import { EventEmitter } from 'events';
import { TaskManagerStartContract } from '@kbn/task-manager-plugin/server';
import { BACKGROUND_TASK_NODE_SO_NAME } from '@kbn/task-manager-plugin/server/saved_objects';

const scope = 'testing';
const taskManagerQuery = {
  bool: {
    filter: {
      bool: {
        must: [
          {
            term: {
              'task.scope': scope,
            },
          },
        ],
      },
    },
  },
};

const taskSchema = schema.object({
  task: schema.object({
    enabled: schema.boolean({ defaultValue: true }),
    taskType: schema.string(),
    schedule: schema.maybe(
      schema.oneOf([
        schema.object({
          interval: schema.string(),
        }),
        schema.object({
          rrule: schema.object({
            dtstart: schema.maybe(schema.string()),
            freq: schema.number(),
            interval: schema.number(),
            tzid: schema.string({ defaultValue: 'UTC' }),
            byhour: schema.maybe(schema.arrayOf(schema.number({ min: 0, max: 23 }))),
            byminute: schema.maybe(schema.arrayOf(schema.number({ min: 0, max: 59 }))),
            byweekday: schema.maybe(schema.arrayOf(schema.number({ min: 1, max: 7 }))),
            bymonthday: schema.maybe(schema.arrayOf(schema.number({ min: 1, max: 31 }))),
          }),
        }),
      ])
    ),
    interval: schema.maybe(schema.string()),
    params: schema.recordOf(schema.string(), schema.any(), { defaultValue: {} }),
    state: schema.recordOf(schema.string(), schema.any(), { defaultValue: {} }),
    id: schema.maybe(schema.string()),
    timeoutOverride: schema.maybe(schema.string()),
  }),
});

export function initRoutes(
  router: IRouter,
  taskManagerStart: Promise<TaskManagerStartContract>,
  taskTestingEvents: EventEmitter
) {
  async function ensureIndexIsRefreshed(client: IScopedClusterClient) {
    return await client.asInternalUser.indices.refresh({
      index: '.kibana_task_manager',
    });
  }

  router.post(
    {
      path: `/api/sample_tasks/schedule`,
      security: {
        authz: {
          enabled: false,
          reason: 'This route is opted out from authorization',
        },
      },
      validate: {
        body: taskSchema,
      },
    },
    async function (
      context: RequestHandlerContext,
      req: KibanaRequest<any, any, any, any>,
      res: KibanaResponseFactory
    ): Promise<IKibanaResponse<any>> {
      const taskManager = await taskManagerStart;
      const { task: taskFields } = req.body;
      const task = {
        ...taskFields,
        scope: [scope],
      };

      const taskResult = await taskManager.schedule(task, { req });

      return res.ok({ body: taskResult });
    }
  );

  router.post(
    {
      path: `/api/sample_tasks/schedule_with_api_key`,
      validate: {
        body: taskSchema,
      },
      security: {
        authz: {
          enabled: false,
          reason: 'This route is opted out from authorization',
        },
      },
    },
    async function (
      context: RequestHandlerContext,
      req: KibanaRequest<any, any, any, any>,
      res: KibanaResponseFactory
    ): Promise<IKibanaResponse<any>> {
      const taskManager = await taskManagerStart;
      const { task: taskFields } = req.body;
      const task = {
        ...taskFields,
        scope: [scope],
      };

      const taskResult = await taskManager.schedule(task, { request: req });

      return res.ok({ body: taskResult });
    }
  );

  router.post(
    {
      path: `/api/sample_tasks/run_soon`,
      security: {
        authz: {
          enabled: false,
          reason: 'This route is opted out from authorization',
        },
      },
      validate: {
        body: schema.object({
          task: schema.object({
            id: schema.string({}),
          }),
        }),
      },
    },
    async function (
      context: RequestHandlerContext,
      req: KibanaRequest<any, any, any, any>,
      res: KibanaResponseFactory
    ): Promise<IKibanaResponse<any>> {
      const {
        task: { id },
      } = req.body;
      try {
        const taskManager = await taskManagerStart;
        return res.ok({ body: await taskManager.runSoon(id) });
      } catch (err) {
        return res.ok({ body: { id, error: `${err}` } });
      }
    }
  );

  router.post(
    {
      path: `/api/sample_tasks/run_mark_removed_tasks_as_unrecognized`,
      security: {
        authz: {
          enabled: false,
          reason: 'This route is opted out from authorization',
        },
      },
      validate: {
        body: schema.object({}),
      },
    },
    async function (
      context: RequestHandlerContext,
      req: KibanaRequest<any, any, any, any>,
      res: KibanaResponseFactory
    ): Promise<IKibanaResponse<any>> {
      try {
        const taskManager = await taskManagerStart;
        await taskManager.ensureScheduled({
          id: 'mark_removed_tasks_as_unrecognized',
          taskType: 'task_manager:mark_removed_tasks_as_unrecognized',
          schedule: { interval: '1h' },
          state: {},
          params: {},
        });
        return res.ok({ body: await taskManager.runSoon('mark_removed_tasks_as_unrecognized') });
      } catch (err) {
        return res.ok({ body: { id: 'mark_removed_tasks_as_unrecognized', error: `${err}` } });
      }
    }
  );

  router.post(
    {
      path: `/api/sample_tasks/bulk_enable`,
      security: {
        authz: {
          enabled: false,
          reason: 'This route is opted out from authorization',
        },
      },
      validate: {
        body: schema.object({
          taskIds: schema.arrayOf(schema.string()),
          runSoon: schema.boolean({ defaultValue: true }),
        }),
      },
    },
    async function (
      context: RequestHandlerContext,
      req: KibanaRequest<any, any, any, any>,
      res: KibanaResponseFactory
    ) {
      const { taskIds, runSoon } = req.body;
      try {
        const taskManager = await taskManagerStart;
        return res.ok({ body: await taskManager.bulkEnable(taskIds, runSoon) });
      } catch (err) {
        return res.ok({ body: { taskIds, error: `${err}` } });
      }
    }
  );

  router.post(
    {
      path: `/api/sample_tasks/bulk_disable`,
      security: {
        authz: {
          enabled: false,
          reason: 'This route is opted out from authorization',
        },
      },
      validate: {
        body: schema.object({
          taskIds: schema.arrayOf(schema.string()),
        }),
      },
    },
    async function (
      context: RequestHandlerContext,
      req: KibanaRequest<any, any, any, any>,
      res: KibanaResponseFactory
    ) {
      const { taskIds } = req.body;
      try {
        const taskManager = await taskManagerStart;
        return res.ok({ body: await taskManager.bulkDisable(taskIds) });
      } catch (err) {
        return res.ok({ body: { taskIds, error: `${err}` } });
      }
    }
  );

  router.post(
    {
      path: `/api/sample_tasks/bulk_update_schedules`,
      security: {
        authz: {
          enabled: false,
          reason: 'This route is opted out from authorization',
        },
      },
      validate: {
        body: schema.object({
          taskIds: schema.arrayOf(schema.string()),
          schedule: schema.object({ interval: schema.string() }),
        }),
      },
    },
    async function (
      context: RequestHandlerContext,
      req: KibanaRequest<any, any, any, any>,
      res: KibanaResponseFactory
    ) {
      const { taskIds, schedule } = req.body;
      try {
        const taskManager = await taskManagerStart;
        return res.ok({ body: await taskManager.bulkUpdateSchedules(taskIds, schedule) });
      } catch (err) {
        return res.ok({ body: { taskIds, error: `${err}` } });
      }
    }
  );

  router.post(
    {
      path: `/api/sample_tasks/ensure_scheduled`,
      security: {
        authz: {
          enabled: false,
          reason: 'This route is opted out from authorization',
        },
      },
      validate: {
        body: schema.object({
          task: schema.object({
            taskType: schema.string(),
            params: schema.object({}),
            state: schema.maybe(schema.object({})),
            id: schema.maybe(schema.string()),
          }),
        }),
      },
    },
    async function (
      context: RequestHandlerContext,
      req: KibanaRequest<any, any, any, any>,
      res: KibanaResponseFactory
    ): Promise<IKibanaResponse<any>> {
      try {
        const { task: taskFields } = req.body;
        const task = {
          ...taskFields,
          scope: [scope],
        };

        const taskManager = await taskManagerStart;
        const taskResult = await taskManager.ensureScheduled(task, { req });

        return res.ok({ body: taskResult });
      } catch (err) {
        return res.ok({ body: err });
      }
    }
  );

  router.post(
    {
      path: `/api/sample_tasks/event`,
      security: {
        authz: {
          enabled: false,
          reason: 'This route is opted out from authorization',
        },
      },
      validate: {
        body: schema.object({
          event: schema.string(),
          data: schema.recordOf(schema.string(), schema.any(), { defaultValue: {} }),
        }),
      },
    },
    async function (
      context: RequestHandlerContext,
      req: KibanaRequest<any, any, any, any>,
      res: KibanaResponseFactory
    ): Promise<IKibanaResponse<any>> {
      try {
        const { event, data } = req.body;
        taskTestingEvents.emit(event, data);
        return res.ok({ body: event });
      } catch (err) {
        return res.ok({ body: err });
      }
    }
  );

  router.get(
    {
      path: `/api/sample_tasks`,
      security: {
        authz: {
          enabled: false,
          reason: 'This route is opted out from authorization',
        },
      },
      validate: {},
    },
    async function (
      context: RequestHandlerContext,
      req: KibanaRequest<any, any, any, any>,
      res: KibanaResponseFactory
    ): Promise<IKibanaResponse<any>> {
      try {
        const taskManager = await taskManagerStart;
        return res.ok({
          body: await taskManager.fetch({
            size: 20,
            query: taskManagerQuery,
          }),
        });
      } catch (err) {
        return res.ok({ body: err });
      }
    }
  );

  router.get(
    {
      path: `/api/sample_tasks/task/{taskId}`,
      security: {
        authz: {
          enabled: false,
          reason: 'This route is opted out from authorization',
        },
      },
      validate: {
        params: schema.object({
          taskId: schema.string(),
        }),
      },
    },
    async function (
      context: RequestHandlerContext,
      req: KibanaRequest<any, any, any, any>,
      res: KibanaResponseFactory
    ): Promise<IKibanaResponse<any>> {
      try {
        await ensureIndexIsRefreshed((await context.core).elasticsearch.client);
        const taskManager = await taskManagerStart;
        return res.ok({ body: await taskManager.get(req.params.taskId) });
      } catch ({ isBoom, output, message }) {
        return res.ok({ body: isBoom ? output.payload : { message } });
      }
    }
  );

  router.get(
    {
      path: `/api/ensure_tasks_index_refreshed`,
      security: {
        authz: {
          enabled: false,
          reason: 'This route is opted out from authorization',
        },
      },
      validate: {},
    },
    async function (
      context: RequestHandlerContext,
      req: KibanaRequest<any, any, any, any>,
      res: KibanaResponseFactory
    ): Promise<IKibanaResponse<any>> {
      await ensureIndexIsRefreshed((await context.core).elasticsearch.client);
      return res.ok({ body: {} });
    }
  );

  router.delete(
    {
      path: `/api/sample_tasks`,
      security: {
        authz: {
          enabled: false,
          reason: 'This route is opted out from authorization',
        },
      },
      validate: {},
    },
    async function (
      context: RequestHandlerContext,
      req: KibanaRequest<any, any, any, any>,
      res: KibanaResponseFactory
    ): Promise<IKibanaResponse<any>> {
      try {
        await ensureIndexIsRefreshed((await context.core).elasticsearch.client);
        let tasksFound = 0;
        const taskManager = await taskManagerStart;
        do {
          const { docs: tasks } = await taskManager.fetch({
            query: taskManagerQuery,
          });
          tasksFound = tasks.length;
          await Promise.all(tasks.map((task) => taskManager.remove(task.id)));
        } while (tasksFound > 0);
        return res.ok({ body: 'OK' });
      } catch ({ isBoom, output, message }) {
        return res.ok({ body: isBoom ? output.payload : { message } });
      }
    }
  );

  router.get(
    {
      path: '/api/registered_tasks',
      security: {
        authz: {
          enabled: false,
          reason: 'This route is opted out from authorization',
        },
      },
      validate: {},
    },
    async (
      context: RequestHandlerContext,
      req: KibanaRequest<any, any, any, any>,
      res: KibanaResponseFactory
    ): Promise<IKibanaResponse<any>> => {
      try {
        const tm = await taskManagerStart;
        return res.ok({
          body: tm.getRegisteredTypes(),
        });
      } catch (err) {
        return res.badRequest({ body: err });
      }
    }
  );

  router.post(
    {
      path: `/api/update_kibana_node`,
      security: {
        authz: {
          enabled: false,
          reason: 'This route is opted out from authorization',
        },
      },
      validate: {
        body: schema.object({
          id: schema.string(),
          lastSeen: schema.string(),
        }),
      },
    },
    async function (
      context: RequestHandlerContext,
      req: KibanaRequest<any, any, any, any>,
      res: KibanaResponseFactory
    ): Promise<IKibanaResponse<any>> {
      const { id, lastSeen } = req.body;

      const client = (await context.core).savedObjects.getClient({
        includedHiddenTypes: [BACKGROUND_TASK_NODE_SO_NAME],
      });
      const node = await client.update(
        BACKGROUND_TASK_NODE_SO_NAME,
        id,
        {
          id,
          last_seen: lastSeen,
        },
        { upsert: { id, last_seen: lastSeen }, refresh: false, retryOnConflict: 3 }
      );

      return res.ok({
        body: node,
      });
    }
  );
}
