import type { FastifyInstance } from 'fastify';

import { authenticate, checkRole } from '@/modules/auth/auth.middleware';
import {
  addonSchema,
  arrayDataResponse,
  bearerAuthSecurity,
  dataResponse,
  menuItemAddonOptionSchema,
  menuItemPathIdSchema,
  notFoundErrorSchema,
  pathIdSchema,
  unauthorizedErrorSchema,
  validationErrorSchema,
} from '@/shared/http/openapi';
import {
  addonsService,
  createAddonSchema,
  isAddonsServiceError,
  updateAddonSchema,
  updateAddonStatusSchema,
} from './addons.service';

export async function registerAddonsRoutes(app: FastifyInstance): Promise<void> {
  const emitCatalogChanged = (
    action: 'CREATED' | 'UPDATED' | 'DELETED' | 'STATUS_CHANGED' | 'AVAILABILITY_CHANGED',
    entityId: string,
  ) => {
    app.realtime.broadcastCatalogChanged({
      type: 'CATALOG_CHANGED',
      entity: 'ADDON',
      action,
      entityId,
      timestamp: new Date().toISOString(),
    });
  };

  app.get(
    '/admin/addons',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['addons', 'admin'],
        summary: 'Listar ingredientes para area administrativa',
        security: bearerAuthSecurity,
        response: {
          200: arrayDataResponse(addonSchema),
          401: unauthorizedErrorSchema,
        },
      },
    },
    async (_request, reply) => {
      const addons = await addonsService.listAllAddons();
      return reply.code(200).send({ data: addons });
    },
  );

  app.post(
    '/admin/addons',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['addons', 'admin'],
        summary: 'Criar ingrediente na area administrativa',
        security: bearerAuthSecurity,
        body: {
          type: 'object',
          required: ['name', 'addonType', 'price'],
          properties: {
            name: { type: 'string', minLength: 2 },
            addonType: {
              type: 'string',
              enum: ['EXTRA', 'SUBSTITUTION', 'REMOVAL', 'SIZE_CHANGE'],
            },
            price: { type: 'number', minimum: 0 },
            scope: {
              type: 'string',
              enum: ['BURGER', 'BURGER_BUILD', 'DRINK', 'SIDE', 'COMBO', 'GENERAL'],
            },
            station: {
              type: 'string',
              enum: [
                'PROTEINS',
                'CHEESES',
                'VEGETABLES',
                'SAUCES',
                'DRINKS',
                'SIDES',
                'FINISHING',
                'GENERAL',
              ],
            },
            priority: { type: 'string', enum: ['FAST', 'MEDIUM', 'CRITICAL'] },
            description: { type: 'string' },
            isActive: { type: 'boolean' },
          },
        },
        response: {
          201: dataResponse(addonSchema),
          400: validationErrorSchema,
          401: unauthorizedErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const parsed = createAddonSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ message: parsed.error.issues[0]?.message ?? 'Payload invalido' });
      }

      try {
        const addon = await addonsService.createAddon(parsed.data);
        emitCatalogChanged('CREATED', addon.id);
        return reply.code(201).send({ data: addon });
      } catch (error) {
        if (isAddonsServiceError(error)) {
          return reply.code(error.statusCode).send({ message: error.message });
        }

        throw error;
      }
    },
  );

  app.put(
    '/admin/addons/:id',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['addons', 'admin'],
        summary: 'Atualizar ingrediente na area administrativa',
        security: bearerAuthSecurity,
        params: pathIdSchema,
        body: {
          type: 'object',
          minProperties: 1,
          properties: {
            name: { type: 'string', minLength: 2 },
            addonType: {
              type: 'string',
              enum: ['EXTRA', 'SUBSTITUTION', 'REMOVAL', 'SIZE_CHANGE'],
            },
            price: { type: 'number', minimum: 0 },
            scope: {
              type: 'string',
              enum: ['BURGER', 'BURGER_BUILD', 'DRINK', 'SIDE', 'COMBO', 'GENERAL'],
            },
            station: {
              type: 'string',
              enum: [
                'PROTEINS',
                'CHEESES',
                'VEGETABLES',
                'SAUCES',
                'DRINKS',
                'SIDES',
                'FINISHING',
                'GENERAL',
              ],
            },
            priority: { type: 'string', enum: ['FAST', 'MEDIUM', 'CRITICAL'] },
            description: { type: 'string' },
            isActive: { type: 'boolean' },
          },
        },
        response: {
          200: dataResponse(addonSchema),
          400: validationErrorSchema,
          401: unauthorizedErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { id: string };
      const parsed = updateAddonSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ message: parsed.error.issues[0]?.message ?? 'Payload invalido' });
      }

      try {
        const addon = await addonsService.updateAddon(params.id, parsed.data);
        emitCatalogChanged('UPDATED', addon.id);
        return reply.code(200).send({ data: addon });
      } catch (error) {
        if (isAddonsServiceError(error)) {
          return reply.code(error.statusCode).send({ message: error.message });
        }

        throw error;
      }
    },
  );

  app.patch(
    '/admin/addons/:id/status',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['addons', 'admin'],
        summary: 'Atualizar status de ingrediente na area administrativa',
        security: bearerAuthSecurity,
        params: pathIdSchema,
        body: {
          type: 'object',
          required: ['isActive'],
          properties: {
            isActive: { type: 'boolean' },
          },
        },
        response: {
          200: dataResponse(addonSchema),
          400: validationErrorSchema,
          401: unauthorizedErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { id: string };
      const parsed = updateAddonStatusSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ message: parsed.error.issues[0]?.message ?? 'Payload invalido' });
      }

      try {
        const addon = await addonsService.updateAddonStatus(params.id, parsed.data.isActive);
        emitCatalogChanged('STATUS_CHANGED', addon.id);
        return reply.code(200).send({ data: addon });
      } catch (error) {
        if (isAddonsServiceError(error)) {
          return reply.code(error.statusCode).send({ message: error.message });
        }

        throw error;
      }
    },
  );

  app.delete(
    '/admin/addons/:id',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['addons', 'admin'],
        summary: 'Remover ingrediente na area administrativa',
        security: bearerAuthSecurity,
        params: pathIdSchema,
        response: {
          200: dataResponse(addonSchema),
          401: unauthorizedErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { id: string };
      try {
        const addon = await addonsService.deleteAddon(params.id);
        emitCatalogChanged('DELETED', addon.id);
        return reply.code(200).send({ data: addon });
      } catch (error) {
        if (isAddonsServiceError(error)) {
          return reply.code(error.statusCode).send({ message: error.message });
        }

        throw error;
      }
    },
  );

  app.get(
    '/addons',
    {
      schema: {
        tags: ['addons'],
        summary: 'Listar addons ativos',
        description: 'Retorna adicionais ativos disponiveis para composicao de itens e combos.',
        response: {
          200: arrayDataResponse(addonSchema),
        },
      },
    },
    async (_request, reply) => {
      const addons = await addonsService.listAddons();
      return reply.code(200).send({ data: addons });
    },
  );

  app.get(
    '/menu/:menuItemId/addons',
    {
      schema: {
        tags: ['addons'],
        summary: 'Listar addons permitidos por item de menu',
        description:
          'Retorna os addons habilitados para o item, incluindo indicador de obrigatoriedade.',
        params: menuItemPathIdSchema,
        response: {
          200: arrayDataResponse(menuItemAddonOptionSchema),
          404: notFoundErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { menuItemId: string };

      try {
        const addons = await addonsService.listMenuItemAddons(params.menuItemId);
        return reply.code(200).send({ data: addons });
      } catch (error) {
        if (isAddonsServiceError(error)) {
          return reply.code(error.statusCode).send({ message: error.message });
        }

        throw error;
      }
    },
  );
}
