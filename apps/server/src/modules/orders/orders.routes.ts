import type { FastifyInstance } from 'fastify';

import { authenticate, checkRole } from '@/modules/auth/auth.middleware';
import {
  arrayDataResponse,
  bearerAuthSecurity,
  createOrderBodySchema,
  dataResponse,
  listOrdersQueryOpenApiSchema,
  notFoundErrorSchema,
  orderDetailSchema,
  orderSchema,
  pathIdSchema,
  unauthorizedErrorSchema,
  updateOrderStatusBodySchema,
  validationErrorSchema,
} from '@/shared/http/openapi';
import { OrderValidationError } from './orders.calculator';
import {
  createOrder,
  getOrderById,
  isOrderServiceError,
  listOrders,
  updateOrderStatus,
} from './orders.service';
import { createOrderSchema, listOrdersQuerySchema, updateOrderStatusSchema } from './orders.types';

export async function registerOrdersRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/orders',
    {
      schema: {
        tags: ['orders'],
        summary: 'Criar pedido',
        description:
          'Cria pedido publico com calculo automatico de total e registro inicial de status.',
        body: createOrderBodySchema,
        response: {
          201: dataResponse(orderDetailSchema),
          400: validationErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const parsed = createOrderSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ message: parsed.error.issues[0]?.message ?? 'Payload invalido' });
      }

      try {
        const order = await createOrder(parsed.data);
        app.realtime.broadcastOrderChanged({
          type: 'ORDER_CREATED',
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          timestamp: new Date().toISOString(),
        });
        return reply.code(201).send({ data: order });
      } catch (error) {
        if (error instanceof OrderValidationError) {
          return reply.code(400).send({
            message: error.message,
            itemErrors: error.itemErrors,
          });
        }

        if (isOrderServiceError(error)) {
          return reply.code(error.statusCode).send({ message: error.message });
        }

        throw error;
      }
    },
  );

  app.get(
    '/orders',
    {
      preHandler: [authenticate, checkRole(['ADMIN', 'STAFF'])],
      schema: {
        tags: ['orders'],
        summary: 'Listar pedidos',
        description: 'Operacao restrita a ADMIN e STAFF. Suporta filtros por status e data.',
        security: bearerAuthSecurity,
        querystring: listOrdersQueryOpenApiSchema,
        response: {
          200: arrayDataResponse(orderSchema),
          400: validationErrorSchema,
          401: unauthorizedErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const parsed = listOrdersQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ message: parsed.error.issues[0]?.message ?? 'Query invalida' });
      }

      const orders = await listOrders(parsed.data);
      return reply.code(200).send({ data: orders });
    },
  );

  app.get(
    '/orders/:id',
    {
      preHandler: [authenticate, checkRole(['ADMIN', 'STAFF'])],
      schema: {
        tags: ['orders'],
        summary: 'Obter detalhe de pedido',
        description: 'Operacao restrita a ADMIN e STAFF. Retorna itens e historico de status.',
        security: bearerAuthSecurity,
        params: pathIdSchema,
        response: {
          200: dataResponse(orderDetailSchema),
          401: unauthorizedErrorSchema,
          404: notFoundErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { id: string };

      try {
        const order = await getOrderById(params.id);
        return reply.code(200).send({ data: order });
      } catch (error) {
        if (isOrderServiceError(error)) {
          return reply.code(error.statusCode).send({ message: error.message });
        }

        throw error;
      }
    },
  );

  app.patch(
    '/orders/:id/status',
    {
      preHandler: [authenticate, checkRole(['ADMIN', 'STAFF'])],
      schema: {
        tags: ['orders'],
        summary: 'Atualizar status de pedido',
        description: 'Operacao restrita a ADMIN e STAFF. Valida transicoes permitidas de status.',
        security: bearerAuthSecurity,
        params: pathIdSchema,
        body: updateOrderStatusBodySchema,
        response: {
          200: dataResponse(orderDetailSchema),
          400: validationErrorSchema,
          401: unauthorizedErrorSchema,
          404: notFoundErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { id: string };
      const parsed = updateOrderStatusSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply
          .code(400)
          .send({ message: parsed.error.issues[0]?.message ?? 'Payload invalido' });
      }

      try {
        const order = await updateOrderStatus(params.id, parsed.data);
        app.realtime.broadcastOrderChanged({
          type: 'ORDER_STATUS_UPDATED',
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          timestamp: new Date().toISOString(),
        });
        return reply.code(200).send({ data: order });
      } catch (error) {
        if (isOrderServiceError(error)) {
          return reply.code(error.statusCode).send({ message: error.message });
        }

        throw error;
      }
    },
  );
}
