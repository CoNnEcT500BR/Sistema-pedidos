import type { FastifyInstance } from 'fastify';

import { authenticate, checkRole } from '@/modules/auth/auth.middleware';
import {
  arrayDataResponse,
  availabilityBodySchema,
  bearerAuthSecurity,
  categorySchema,
  createMenuItemBodySchema,
  dataResponse,
  menuItemDetailSchema,
  menuItemSchema,
  menuItemWithCategorySchema,
  menuListQuerySchema,
  notFoundErrorSchema,
  pathIdSchema,
  unauthorizedErrorSchema,
  updateMenuItemBodySchema,
  validationErrorSchema,
} from '@/shared/http/openapi';
import {
  createCategorySchema,
  createMenuItemSchema,
  reorderMenuItemsSchema,
  updateAvailabilitySchema,
  updateCategorySchema,
  updateCategoryStatusSchema,
  updateMenuItemSchema,
} from './menu.types';
import { isMenuServiceError, menuService } from './menu.service';

export async function registerMenuRoutes(app: FastifyInstance): Promise<void> {
  const emitCatalogChanged = (
    entity: 'CATEGORY' | 'MENU_ITEM',
    action: 'CREATED' | 'UPDATED' | 'DELETED' | 'STATUS_CHANGED' | 'AVAILABILITY_CHANGED',
    entityId: string,
  ) => {
    app.realtime.broadcastCatalogChanged({
      type: 'CATALOG_CHANGED',
      entity,
      action,
      entityId,
      timestamp: new Date().toISOString(),
    });
  };

  app.get(
    '/admin/categories',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['menu', 'admin'],
        summary: 'Listar categorias para a area administrativa',
        description: 'Retorna categorias ativas e inativas para gestao interna.',
        security: bearerAuthSecurity,
        response: {
          200: arrayDataResponse(categorySchema),
          401: unauthorizedErrorSchema,
        },
      },
    },
    async () => {
      const categories = await menuService.listAllCategories();
      return { data: categories };
    },
  );

  app.post(
    '/admin/categories',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['menu', 'admin'],
        summary: 'Criar categoria para a area administrativa',
        description: 'Cria nova categoria para organizacao do cardapio interno.',
        security: bearerAuthSecurity,
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 2 },
            description: { type: 'string' },
            icon: { type: 'string' },
            displayOrder: { type: 'integer', minimum: 0 },
            isActive: { type: 'boolean' },
          },
        },
        response: {
          201: dataResponse(categorySchema),
          400: validationErrorSchema,
          401: unauthorizedErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const parsed = createCategorySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ message: parsed.error.issues[0]?.message ?? 'Payload invalido' });
      }

      const category = await menuService.createCategory(parsed.data);
      emitCatalogChanged('CATEGORY', 'CREATED', category.id);
      return reply.code(201).send({ data: category });
    },
  );

  app.put(
    '/admin/categories/:id',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['menu', 'admin'],
        summary: 'Atualizar categoria para a area administrativa',
        description: 'Atualiza dados cadastrais de categoria existente.',
        security: bearerAuthSecurity,
        params: pathIdSchema,
        body: {
          type: 'object',
          minProperties: 1,
          properties: {
            name: { type: 'string', minLength: 2 },
            description: { type: 'string' },
            icon: { type: 'string' },
            displayOrder: { type: 'integer', minimum: 0 },
            isActive: { type: 'boolean' },
          },
        },
        response: {
          200: dataResponse(categorySchema),
          400: validationErrorSchema,
          401: unauthorizedErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { id: string };
      const parsed = updateCategorySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ message: parsed.error.issues[0]?.message ?? 'Payload invalido' });
      }

      try {
        const category = await menuService.updateCategory(params.id, parsed.data);
        emitCatalogChanged('CATEGORY', 'UPDATED', category.id);
        return reply.code(200).send({ data: category });
      } catch (error) {
        if (isMenuServiceError(error)) {
          return reply.code(error.statusCode).send({ message: error.message });
        }

        throw error;
      }
    },
  );

  app.patch(
    '/admin/categories/:id/status',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['menu', 'admin'],
        summary: 'Atualizar status de categoria para a area administrativa',
        description: 'Ativa ou desativa categoria para organizacao de catalogo.',
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
          200: dataResponse(categorySchema),
          400: validationErrorSchema,
          401: unauthorizedErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { id: string };
      const parsed = updateCategoryStatusSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ message: parsed.error.issues[0]?.message ?? 'Payload invalido' });
      }

      const category = await menuService.updateCategoryStatus(params.id, parsed.data.isActive);
      emitCatalogChanged('CATEGORY', 'STATUS_CHANGED', category.id);
      return reply.code(200).send({ data: category });
    },
  );

  app.delete(
    '/admin/categories/:id',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['menu', 'admin'],
        summary: 'Remover categoria da area administrativa',
        description: 'Remove categoria e itens relacionados conforme regras de banco.',
        security: bearerAuthSecurity,
        params: pathIdSchema,
        response: {
          200: dataResponse(categorySchema),
          401: unauthorizedErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { id: string };
      const category = await menuService.deleteCategory(params.id);
      emitCatalogChanged('CATEGORY', 'DELETED', category.id);
      return reply.code(200).send({ data: category });
    },
  );

  app.get(
    '/admin/menu',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['menu', 'admin'],
        summary: 'Listar itens do cardapio para a area administrativa',
        description: 'Retorna todos os itens, inclusive indisponiveis, com categoria associada.',
        security: bearerAuthSecurity,
        querystring: menuListQuerySchema,
        response: {
          200: arrayDataResponse(menuItemWithCategorySchema),
          401: unauthorizedErrorSchema,
        },
      },
    },
    async (request) => {
      const query = request.query as { category?: string };
      const items = await menuService.listAdminMenuItems(query.category);
      return { data: items };
    },
  );

  app.post(
    '/admin/menu/reorder',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['menu', 'admin'],
        summary: 'Reordenar itens do cardapio na area administrativa',
        security: bearerAuthSecurity,
        body: {
          type: 'object',
          required: ['categoryId', 'orderedItemIds'],
          properties: {
            categoryId: { type: 'string', minLength: 1 },
            orderedItemIds: {
              type: 'array',
              minItems: 1,
              items: { type: 'string', minLength: 1 },
            },
          },
        },
        response: {
          200: dataResponse({ type: 'object', properties: { success: { type: 'boolean' } } }),
          400: validationErrorSchema,
          401: unauthorizedErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const parsed = reorderMenuItemsSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ message: parsed.error.issues[0]?.message ?? 'Payload invalido' });
      }

      try {
        await menuService.reorderMenuItems(parsed.data);
        emitCatalogChanged('MENU_ITEM', 'UPDATED', parsed.data.categoryId);
        return reply.code(200).send({ data: { success: true } });
      } catch (error) {
        if (isMenuServiceError(error)) {
          return reply.code(error.statusCode).send({ message: error.message });
        }

        throw error;
      }
    },
  );

  app.get(
    '/categories',
    {
      schema: {
        tags: ['menu'],
        summary: 'Listar categorias ativas',
        description: 'Retorna somente categorias marcadas como ativas.',
        response: {
          200: arrayDataResponse(categorySchema),
        },
      },
    },
    async () => {
      const categories = await menuService.listCategories();
      return { data: categories };
    },
  );

  app.get(
    '/menu',
    {
      schema: {
        tags: ['menu'],
        summary: 'Listar itens disponiveis do cardapio',
        description:
          'Permite filtro opcional por categoria e retorna apenas itens com isAvailable=true.',
        querystring: menuListQuerySchema,
        response: {
          200: arrayDataResponse(menuItemWithCategorySchema),
        },
      },
    },
    async (request) => {
      const query = request.query as { category?: string };
      const items = await menuService.listMenuItems(query.category);
      return { data: items };
    },
  );

  app.get(
    '/menu/:id',
    {
      schema: {
        tags: ['menu'],
        summary: 'Obter detalhe de item do cardapio',
        description: 'Retorna item completo com categoria e addons permitidos.',
        params: pathIdSchema,
        response: {
          200: dataResponse(menuItemDetailSchema),
          404: notFoundErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { id: string };
      const item = await menuService.getMenuItemById(params.id);

      if (!item) {
        return reply.code(404).send({ message: 'Item nao encontrado' });
      }

      return { data: item };
    },
  );

  app.post(
    '/menu',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['menu'],
        summary: 'Criar item de cardapio',
        description: 'Operacao restrita ao perfil ADMIN.',
        security: bearerAuthSecurity,
        body: createMenuItemBodySchema,
        response: {
          201: dataResponse(menuItemSchema),
          400: validationErrorSchema,
          401: unauthorizedErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const parsed = createMenuItemSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ message: parsed.error.issues[0]?.message ?? 'Payload invalido' });
      }

      try {
        const item = await menuService.createMenuItem(parsed.data);
        emitCatalogChanged('MENU_ITEM', 'CREATED', item.id);
        return reply.code(201).send({ data: item });
      } catch (error) {
        if (isMenuServiceError(error)) {
          return reply.code(error.statusCode).send({ message: error.message });
        }

        throw error;
      }
    },
  );

  app.put(
    '/menu/:id',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['menu'],
        summary: 'Atualizar item de cardapio',
        description: 'Atualiza campos parciais do item. Operacao restrita ao perfil ADMIN.',
        security: bearerAuthSecurity,
        params: pathIdSchema,
        body: updateMenuItemBodySchema,
        response: {
          200: dataResponse(menuItemSchema),
          400: validationErrorSchema,
          401: unauthorizedErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { id: string };
      const parsed = updateMenuItemSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ message: parsed.error.issues[0]?.message ?? 'Payload invalido' });
      }

      try {
        const item = await menuService.updateMenuItem(params.id, parsed.data);
        emitCatalogChanged('MENU_ITEM', 'UPDATED', item.id);
        return reply.code(200).send({ data: item });
      } catch (error) {
        if (isMenuServiceError(error)) {
          return reply.code(error.statusCode).send({ message: error.message });
        }

        throw error;
      }
    },
  );

  app.patch(
    '/menu/:id/availability',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['menu'],
        summary: 'Atualizar disponibilidade de item',
        description: 'Ativa ou desativa item para venda sem remover o cadastro.',
        security: bearerAuthSecurity,
        params: pathIdSchema,
        body: availabilityBodySchema,
        response: {
          200: dataResponse(menuItemSchema),
          400: validationErrorSchema,
          401: unauthorizedErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { id: string };
      const parsed = updateAvailabilitySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ message: parsed.error.issues[0]?.message ?? 'Payload invalido' });
      }

      const item = await menuService.updateAvailability(params.id, parsed.data.isAvailable);
      emitCatalogChanged('MENU_ITEM', 'AVAILABILITY_CHANGED', item.id);
      return reply.code(200).send({ data: item });
    },
  );

  app.delete(
    '/admin/menu/:id',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['menu', 'admin'],
        summary: 'Remover item de cardapio da area administrativa',
        description: 'Remove item e relacoes dependentes conforme regras de banco.',
        security: bearerAuthSecurity,
        params: pathIdSchema,
        response: {
          200: dataResponse(menuItemSchema),
          401: unauthorizedErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { id: string };
      const item = await menuService.deleteMenuItem(params.id);
      emitCatalogChanged('MENU_ITEM', 'DELETED', item.id);
      return reply.code(200).send({ data: item });
    },
  );

  app.delete(
    '/menu/:id',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['menu'],
        summary: 'Desativar item de cardapio',
        description: 'Soft delete: marca o item como indisponivel (isAvailable=false).',
        security: bearerAuthSecurity,
        params: pathIdSchema,
        response: {
          200: dataResponse(menuItemSchema),
          401: unauthorizedErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { id: string };
      const item = await menuService.deactivateMenuItem(params.id);
      emitCatalogChanged('MENU_ITEM', 'AVAILABILITY_CHANGED', item.id);
      return reply.code(200).send({ data: item });
    },
  );
}
