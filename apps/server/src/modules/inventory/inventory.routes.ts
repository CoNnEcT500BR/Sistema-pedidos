import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { authenticate, checkRole } from '@/modules/auth/authMiddleware.js';
import {
  bearerAuthSecurity,
  countInventoryIngredientBodySchema,
  createInventoryIngredientBodySchema,
  inventoryRecipeBodySchema,
  pathIdSchema,
  updateInventoryIngredientBodySchema,
} from '@/shared/http/openapi.js';
import {
  countInventoryIngredientSchema,
  createInventoryIngredientSchema,
  updateInventoryIngredientSchema,
} from './inventoryTypes.js';
import { InventoryServiceError, inventoryService } from './inventory.service.js';

const inventoryIngredientIdSchema = z.object({
  id: z.string().min(1),
});
const inventoryRecipeSchema = z.object({
  inventoryIngredientId: z.string().min(1).nullable(),
  stockQuantity: z.number().finite().positive().nullable(),
});

export async function registerInventoryRoutes(app: FastifyInstance): Promise<void> {
  const emitInventoryChanged = (ingredientId: string) => {
    app.realtime.broadcastCatalogChanged({
      type: 'CATALOG_CHANGED',
      entity: 'INVENTORY_INGREDIENT',
      action: 'STOCK_CHANGED',
      entityId: ingredientId,
      timestamp: new Date().toISOString(),
    });
  };

  app.get(
    '/admin/inventory',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['inventory', 'admin'],
        summary: 'Listar insumos e saldos de estoque',
        security: bearerAuthSecurity,
      },
    },
    async (_request, reply) => reply.code(200).send({ data: await inventoryService.list() }),
  );

  app.get(
    '/admin/inventory/recipes',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['inventory', 'admin'],
        summary: 'Listar vínculos de receita entre produtos e insumos',
        security: bearerAuthSecurity,
      },
    },
    async (_request, reply) => reply.code(200).send({ data: await inventoryService.listRecipes() }),
  );

  app.get(
    '/admin/inventory/movements',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['inventory', 'admin'],
        summary: 'Listar movimentações recentes do estoque',
        security: bearerAuthSecurity,
      },
    },
    async (_request, reply) =>
      reply.code(200).send({ data: await inventoryService.listMovements() }),
  );

  app.patch(
    '/admin/inventory/recipes/:id',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['inventory', 'admin'],
        summary: 'Associar um insumo e consumo a uma opção de produto',
        security: bearerAuthSecurity,
        params: pathIdSchema,
        body: inventoryRecipeBodySchema,
      },
    },
    async (request, reply) => {
      const params = inventoryIngredientIdSchema.safeParse(request.params);
      const parsed = inventoryRecipeSchema.safeParse(request.body);
      if (!params.success || !parsed.success) {
        return reply.code(400).send({ message: 'Informe um vínculo e uma receita válidos.' });
      }

      try {
        const { recipe, affectedIngredientIds } = await inventoryService.updateRecipe(
          params.data.id,
          parsed.data.inventoryIngredientId,
          parsed.data.stockQuantity,
        );
        for (const ingredientId of affectedIngredientIds) {
          emitInventoryChanged(ingredientId);
        }
        return reply.code(200).send({ data: recipe });
      } catch (error) {
        if (error instanceof InventoryServiceError) {
          return reply.code(error.statusCode).send({ message: error.message });
        }
        throw error;
      }
    },
  );

  app.post(
    '/admin/inventory',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['inventory', 'admin'],
        summary: 'Cadastrar insumo para controle de estoque',
        security: bearerAuthSecurity,
        body: createInventoryIngredientBodySchema,
      },
    },
    async (request, reply) => {
      const parsed = createInventoryIngredientSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ message: parsed.error.issues[0]?.message ?? 'Payload inválido' });
      }

      try {
        const ingredient = await inventoryService.create(parsed.data);
        emitInventoryChanged(ingredient.id);
        return reply.code(201).send({ data: ingredient });
      } catch (error) {
        if (error instanceof InventoryServiceError) {
          return reply.code(error.statusCode).send({ message: error.message });
        }
        throw error;
      }
    },
  );

  app.patch(
    '/admin/inventory/:id',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['inventory', 'admin'],
        summary: 'Atualizar cadastro de insumo',
        security: bearerAuthSecurity,
        params: pathIdSchema,
        body: updateInventoryIngredientBodySchema,
      },
    },
    async (request, reply) => {
      const params = inventoryIngredientIdSchema.safeParse(request.params);
      const parsed = updateInventoryIngredientSchema.safeParse(request.body);
      if (!params.success || !parsed.success) {
        return reply.code(400).send({ message: 'Informe um identificador e dados válidos.' });
      }

      try {
        const ingredient = await inventoryService.update(params.data.id, parsed.data);
        emitInventoryChanged(ingredient.id);
        return reply.code(200).send({ data: ingredient });
      } catch (error) {
        if (error instanceof InventoryServiceError) {
          return reply.code(error.statusCode).send({ message: error.message });
        }
        throw error;
      }
    },
  );

  app.put(
    '/admin/inventory/:id/count',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['inventory', 'admin'],
        summary: 'Informar ou ajustar o saldo contado de um insumo',
        security: bearerAuthSecurity,
        params: pathIdSchema,
        body: countInventoryIngredientBodySchema,
      },
    },
    async (request, reply) => {
      const params = inventoryIngredientIdSchema.safeParse(request.params);
      const parsed = countInventoryIngredientSchema.safeParse(request.body);
      if (!params.success || !parsed.success) {
        return reply.code(400).send({ message: 'Informe um identificador e uma contagem válida.' });
      }

      try {
        const ingredient = await inventoryService.count(params.data.id, parsed.data);
        emitInventoryChanged(ingredient.id);
        return reply.code(200).send({ data: ingredient });
      } catch (error) {
        if (error instanceof InventoryServiceError) {
          return reply.code(error.statusCode).send({ message: error.message });
        }
        throw error;
      }
    },
  );
}
