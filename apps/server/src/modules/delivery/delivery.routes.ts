import type { FastifyInstance } from 'fastify';

import { authenticate, checkRole } from '@/modules/auth/auth.middleware';
import {
  bearerAuthSecurity,
  dataResponse,
  pathIdSchema,
  unauthorizedErrorSchema,
  validationErrorSchema,
  arrayDataResponse,
} from '@/shared/http/openapi';
import { deliveryService } from './delivery.service';
import {
  assignDeliverySchema,
  createCourierSchema,
  createRouteSchema,
  listDeliveriesQuerySchema,
  updateDeliveryStatusSchema,
} from './delivery.types';

const deliveryHistorySchema = {
  type: 'object',
  required: ['id', 'fromStatus', 'toStatus', 'changedAt'],
  properties: {
    id: { type: 'string' },
    fromStatus: { type: 'string' },
    toStatus: { type: 'string' },
    reason: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    changedAt: { type: 'string', format: 'date-time' },
  },
} as const;

const deliverySchema = {
  type: 'object',
  required: [
    'id',
    'orderId',
    'orderNumber',
    'status',
    'priority',
    'createdAt',
    'updatedAt',
    'history',
  ],
  properties: {
    id: { type: 'string' },
    orderId: { type: 'string' },
    orderNumber: { type: 'integer' },
    customerName: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    customerPhone: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    notes: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    status: { type: 'string' },
    priority: { type: 'integer' },
    promisedAt: { anyOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }] },
    courierId: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    routeId: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    history: {
      type: 'array',
      items: deliveryHistorySchema,
    },
  },
} as const;

const courierSchema = {
  type: 'object',
  required: ['id', 'name', 'isActive', 'createdAt', 'updatedAt'],
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    phone: { type: 'string' },
    zone: { type: 'string' },
    isActive: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
} as const;

const routeSchema = {
  type: 'object',
  required: ['id', 'name', 'zone', 'isActive', 'createdAt', 'updatedAt'],
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    zone: { type: 'string' },
    isActive: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
} as const;

export async function registerDeliveryRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/delivery/queue',
    {
      preHandler: [authenticate, checkRole(['ADMIN', 'STAFF'])],
      schema: {
        tags: ['delivery', 'admin'],
        summary: 'Listar fila de entregas',
        security: bearerAuthSecurity,
        response: {
          200: arrayDataResponse(deliverySchema),
          401: unauthorizedErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const parsed = listDeliveriesQuerySchema.safeParse(request.query ?? {});
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ message: parsed.error.issues[0]?.message ?? 'Query invalida' });
      }

      return { data: await deliveryService.listDeliveries(parsed.data) };
    },
  );

  app.post(
    '/delivery/queue/from-ready',
    {
      preHandler: [authenticate, checkRole(['ADMIN', 'STAFF'])],
      schema: {
        tags: ['delivery', 'admin'],
        summary: 'Sincronizar fila de entregas com pedidos prontos',
        security: bearerAuthSecurity,
        response: {
          200: arrayDataResponse(deliverySchema),
          401: unauthorizedErrorSchema,
        },
      },
    },
    async () => ({ data: await deliveryService.syncReadyOrdersToQueue() }),
  );

  app.get(
    '/delivery/couriers',
    {
      preHandler: [authenticate, checkRole(['ADMIN', 'STAFF'])],
      schema: {
        tags: ['delivery', 'admin'],
        summary: 'Listar entregadores',
        security: bearerAuthSecurity,
        response: {
          200: arrayDataResponse(courierSchema),
          401: unauthorizedErrorSchema,
        },
      },
    },
    async () => ({ data: await deliveryService.listCouriers() }),
  );

  app.post(
    '/delivery/couriers',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['delivery', 'admin'],
        summary: 'Criar entregador',
        security: bearerAuthSecurity,
        response: {
          201: dataResponse(courierSchema),
          400: validationErrorSchema,
          401: unauthorizedErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const parsed = createCourierSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ message: parsed.error.issues[0]?.message ?? 'Payload invalido' });
      }

      return reply.code(201).send({ data: await deliveryService.createCourier(parsed.data) });
    },
  );

  app.get(
    '/delivery/routes',
    {
      preHandler: [authenticate, checkRole(['ADMIN', 'STAFF'])],
      schema: {
        tags: ['delivery', 'admin'],
        summary: 'Listar rotas de entrega',
        security: bearerAuthSecurity,
        response: {
          200: arrayDataResponse(routeSchema),
          401: unauthorizedErrorSchema,
        },
      },
    },
    async () => ({ data: await deliveryService.listRoutes() }),
  );

  app.post(
    '/delivery/routes',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['delivery', 'admin'],
        summary: 'Criar rota de entrega',
        security: bearerAuthSecurity,
        response: {
          201: dataResponse(routeSchema),
          400: validationErrorSchema,
          401: unauthorizedErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const parsed = createRouteSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ message: parsed.error.issues[0]?.message ?? 'Payload invalido' });
      }

      return reply.code(201).send({ data: await deliveryService.createRoute(parsed.data) });
    },
  );

  app.patch(
    '/delivery/:id/assign',
    {
      preHandler: [authenticate, checkRole(['ADMIN', 'STAFF'])],
      schema: {
        tags: ['delivery', 'admin'],
        summary: 'Atribuir entrega para entregador e rota',
        security: bearerAuthSecurity,
        params: pathIdSchema,
        response: {
          200: dataResponse(deliverySchema),
          400: validationErrorSchema,
          401: unauthorizedErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { id: string };
      const parsed = assignDeliverySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ message: parsed.error.issues[0]?.message ?? 'Payload invalido' });
      }

      try {
        return { data: await deliveryService.assignDelivery(params.id, parsed.data) };
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ message: error.message });
        }

        throw error;
      }
    },
  );

  app.patch(
    '/delivery/:id/status',
    {
      preHandler: [authenticate, checkRole(['ADMIN', 'STAFF'])],
      schema: {
        tags: ['delivery', 'admin'],
        summary: 'Atualizar status de entrega',
        security: bearerAuthSecurity,
        params: pathIdSchema,
        response: {
          200: dataResponse(deliverySchema),
          400: validationErrorSchema,
          401: unauthorizedErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { id: string };
      const parsed = updateDeliveryStatusSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ message: parsed.error.issues[0]?.message ?? 'Payload invalido' });
      }

      try {
        return {
          data: await deliveryService.updateDeliveryStatus(
            params.id,
            parsed.data.status,
            parsed.data.reason,
          ),
        };
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ message: error.message });
        }

        throw error;
      }
    },
  );
}
