import type { FastifyInstance } from 'fastify';

import { authenticate, checkRole } from '@/modules/auth/authMiddleware.js';
import {
  bearerAuthSecurity,
  dataResponse,
  pathIdSchema,
  unauthorizedErrorSchema,
  validationErrorSchema,
  arrayDataResponse,
} from '@/shared/http/openapi.js';
import { deliveryService } from './delivery.service.js';
import {
  assignDeliverySchema,
  createCourierSchema,
  createDeliveryZoneSchema,
  createRouteSchema,
  listDeliveriesQuerySchema,
  updateDeliveryZoneSchema,
  updateDeliveryStatusSchema,
} from './deliveryTypes.js';

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
    'orderStatus',
    'status',
    'priority',
    'fulfillmentType',
    'deliveryFee',
    'paymentMethod',
    'finalPrice',
    'createdAt',
    'updatedAt',
    'history',
  ],
  properties: {
    id: { type: 'string' },
    orderId: { type: 'string' },
    orderNumber: { type: 'integer' },
    orderStatus: { type: 'string' },
    customerName: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    customerPhone: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    notes: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    fulfillmentType: { type: 'string', enum: ['PICKUP', 'DELIVERY'] },
    deliveryAddress: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    deliveryComplement: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    deliveryReference: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    deliveryZoneName: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    deliveryFee: { type: 'number' },
    paymentMethod: { type: 'string' },
    cashChangeFor: { anyOf: [{ type: 'number' }, { type: 'null' }] },
    finalPrice: { type: 'number' },
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

const deliveryZoneSchema = {
  type: 'object',
  required: ['id', 'name', 'fee', 'estimatedMinutes', 'isActive', 'createdAt', 'updatedAt'],
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    fee: { type: 'number', minimum: 0 },
    estimatedMinutes: { type: 'integer', minimum: 5, maximum: 300 },
    isActive: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
} as const;

const createDeliveryZoneBodySchema = {
  type: 'object',
  required: ['name', 'fee', 'estimatedMinutes'],
  properties: {
    name: { type: 'string', minLength: 2, maxLength: 80 },
    fee: { type: 'number', minimum: 0, maximum: 9999.99 },
    estimatedMinutes: { type: 'integer', minimum: 5, maximum: 300 },
    isActive: { type: 'boolean', default: true },
  },
} as const;

const updateDeliveryZoneBodySchema = {
  type: 'object',
  minProperties: 1,
  properties: {
    name: { type: 'string', minLength: 2, maxLength: 80 },
    fee: { type: 'number', minimum: 0, maximum: 9999.99 },
    estimatedMinutes: { type: 'integer', minimum: 5, maximum: 300 },
    isActive: { type: 'boolean' },
  },
} as const;

const listDeliveriesQueryOpenApiSchema = {
  type: 'object',
  properties: {
    status: {
      type: 'string',
      enum: ['QUEUED', 'ASSIGNED', 'DISPATCHED', 'IN_ROUTE', 'DELIVERED', 'FAILED', 'CANCELLED'],
    },
    courierId: { type: 'string' },
    zone: { type: 'string' },
  },
} as const;

const createCourierBodySchema = {
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string', minLength: 2 },
    phone: { type: 'string' },
    zone: { type: 'string' },
    isActive: { type: 'boolean', default: true },
  },
} as const;

const createRouteBodySchema = {
  type: 'object',
  required: ['name', 'zone'],
  properties: {
    name: { type: 'string', minLength: 2 },
    zone: { type: 'string', minLength: 1 },
    isActive: { type: 'boolean', default: true },
  },
} as const;

const assignDeliveryBodySchema = {
  type: 'object',
  required: ['courierId'],
  properties: {
    courierId: { type: 'string', minLength: 1 },
    routeId: { type: 'string' },
    priority: { type: 'integer', minimum: 1, maximum: 5 },
    promisedAt: { type: 'string', format: 'date-time' },
  },
} as const;

const updateDeliveryStatusBodySchema = {
  type: 'object',
  required: ['status'],
  properties: {
    status: {
      type: 'string',
      enum: ['QUEUED', 'ASSIGNED', 'DISPATCHED', 'IN_ROUTE', 'DELIVERED', 'FAILED', 'CANCELLED'],
    },
    reason: { type: 'string' },
  },
} as const;

export async function registerDeliveryRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/delivery/zones',
    {
      schema: {
        tags: ['delivery'],
        summary: 'Listar zonas de entrega ativas',
        description: 'Retorna zonas ativas para cotacao no checkout publico.',
        response: { 200: arrayDataResponse(deliveryZoneSchema) },
      },
    },
    async () => ({ data: await deliveryService.listDeliveryZones() }),
  );

  app.get(
    '/delivery/zones/admin',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['delivery', 'admin'],
        summary: 'Listar todas as zonas de entrega',
        security: bearerAuthSecurity,
        response: {
          200: arrayDataResponse(deliveryZoneSchema),
          401: unauthorizedErrorSchema,
        },
      },
    },
    async () => ({ data: await deliveryService.listDeliveryZones(true) }),
  );

  app.post(
    '/delivery/zones',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['delivery', 'admin'],
        summary: 'Criar zona de entrega',
        security: bearerAuthSecurity,
        body: createDeliveryZoneBodySchema,
        response: {
          201: dataResponse(deliveryZoneSchema),
          400: validationErrorSchema,
          401: unauthorizedErrorSchema,
          409: validationErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const parsed = createDeliveryZoneSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ message: parsed.error.issues[0]?.message ?? 'Zona invalida' });
      }

      try {
        return reply.code(201).send({ data: await deliveryService.createDeliveryZone(parsed.data) });
      } catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
          return reply.code(409).send({ message: 'Ja existe uma zona com esse nome' });
        }
        throw error;
      }
    },
  );

  app.patch(
    '/delivery/zones/:id',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['delivery', 'admin'],
        summary: 'Atualizar zona de entrega',
        security: bearerAuthSecurity,
        params: pathIdSchema,
        body: updateDeliveryZoneBodySchema,
        response: {
          200: dataResponse(deliveryZoneSchema),
          400: validationErrorSchema,
          401: unauthorizedErrorSchema,
          404: validationErrorSchema,
          409: validationErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { id: string };
      const parsed = updateDeliveryZoneSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ message: parsed.error.issues[0]?.message ?? 'Zona invalida' });
      }

      try {
        return { data: await deliveryService.updateDeliveryZone(params.id, parsed.data) };
      } catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error) {
          if (error.code === 'P2002') {
            return reply.code(409).send({ message: 'Ja existe uma zona com esse nome' });
          }
          if (error.code === 'P2025') {
            return reply.code(404).send({ message: 'Zona de entrega nao encontrada' });
          }
        }
        throw error;
      }
    },
  );

  app.get(
    '/delivery/queue',
    {
      preHandler: [authenticate, checkRole(['ADMIN', 'STAFF'])],
      schema: {
        tags: ['delivery', 'admin'],
        summary: 'Listar fila de entregas',
        description: 'Lista entregas com filtros opcionais por status, entregador e zona.',
        security: bearerAuthSecurity,
        querystring: listDeliveriesQueryOpenApiSchema,
        response: {
          200: arrayDataResponse(deliverySchema),
          400: validationErrorSchema,
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
        description: 'Cria registros de entrega para pedidos prontos ainda nao enfileirados.',
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
        description: 'Retorna entregadores cadastrados para operacao de delivery.',
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
        description: 'Cadastra novo entregador para atribuicao de entregas.',
        security: bearerAuthSecurity,
        body: createCourierBodySchema,
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
        description: 'Retorna rotas de entrega configuradas no sistema.',
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
        description: 'Cadastra uma nova rota de entrega por zona.',
        security: bearerAuthSecurity,
        body: createRouteBodySchema,
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
        description:
          'Atribui entregador/rota e atualiza prioridade e horario prometido da entrega.',
        security: bearerAuthSecurity,
        params: pathIdSchema,
        body: assignDeliveryBodySchema,
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
        const delivery = await deliveryService.assignDelivery(params.id, parsed.data);
        app.realtime.broadcastOrderChanged({
          type: 'ORDER_STATUS_UPDATED',
          orderId: delivery.orderId,
          orderNumber: delivery.orderNumber,
          status: delivery.orderStatus,
          timestamp: new Date().toISOString(),
        });
        return { data: delivery };
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
        description: 'Atualiza o status da entrega e registra motivo quando informado.',
        security: bearerAuthSecurity,
        params: pathIdSchema,
        body: updateDeliveryStatusBodySchema,
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
        const delivery = await deliveryService.updateDeliveryStatus(
          params.id,
          parsed.data.status,
          parsed.data.reason,
        );
        app.realtime.broadcastOrderChanged({
          type: 'ORDER_STATUS_UPDATED',
          orderId: delivery.orderId,
          orderNumber: delivery.orderNumber,
          status: delivery.orderStatus,
          timestamp: new Date().toISOString(),
        });
        return { data: delivery };
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ message: error.message });
        }

        throw error;
      }
    },
  );
}
