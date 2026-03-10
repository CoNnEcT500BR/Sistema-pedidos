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
import { createMenuItemSchema, updateAvailabilitySchema, updateMenuItemSchema } from './menu.types';
import { menuService } from './menu.service';

export async function registerMenuRoutes(app: FastifyInstance): Promise<void> {
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

      const item = await menuService.createMenuItem(parsed.data);
      return reply.code(201).send({ data: item });
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

      const item = await menuService.updateMenuItem(params.id, parsed.data);
      return reply.code(200).send({ data: item });
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
      return reply.code(200).send({ data: item });
    },
  );
}
