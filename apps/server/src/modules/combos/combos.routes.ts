import type { FastifyInstance } from 'fastify';

import { authenticate, checkRole } from '@/modules/auth/auth.middleware';
import {
  arrayDataResponse,
  availabilityBodySchema,
  bearerAuthSecurity,
  comboDetailSchema,
  comboSchema,
  createComboBodySchema,
  dataResponse,
  notFoundErrorSchema,
  pathIdSchema,
  unauthorizedErrorSchema,
  updateComboBodySchema,
  validationErrorSchema,
} from '@/shared/http/openapi';
import { combosService } from './combos.service';
import {
  createComboSchema,
  updateComboAvailabilitySchema,
  updateComboSchema,
} from './combos.types';

export async function registerCombosRoutes(app: FastifyInstance): Promise<void> {
  const emitCatalogChanged = (
    action: 'CREATED' | 'UPDATED' | 'DELETED' | 'STATUS_CHANGED' | 'AVAILABILITY_CHANGED',
    entityId: string,
  ) => {
    app.realtime.broadcastCatalogChanged({
      type: 'CATALOG_CHANGED',
      entity: 'COMBO',
      action,
      entityId,
      timestamp: new Date().toISOString(),
    });
  };

  app.get(
    '/admin/combos',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['combos', 'admin'],
        summary: 'Listar combos para a area administrativa',
        description: 'Retorna combos ativos e inativos com seus itens para gestao.',
        security: bearerAuthSecurity,
        response: {
          200: arrayDataResponse(comboDetailSchema),
          401: unauthorizedErrorSchema,
        },
      },
    },
    async () => {
      const combos = await combosService.listAdminCombos();
      return { data: combos };
    },
  );

  app.get(
    '/combos',
    {
      schema: {
        tags: ['combos'],
        summary: 'Listar combos ativos',
        description: 'Retorna somente combos ativos para exibicao no cardapio.',
        response: {
          200: arrayDataResponse(comboDetailSchema),
        },
      },
    },
    async () => {
      const combos = await combosService.listCombos();
      return { data: combos };
    },
  );

  app.get(
    '/combos/:id',
    {
      schema: {
        tags: ['combos'],
        summary: 'Obter detalhe de combo',
        description: 'Retorna combo com a lista de itens inclusos.',
        params: pathIdSchema,
        response: {
          200: dataResponse(comboDetailSchema),
          404: notFoundErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { id: string };
      const combo = await combosService.getComboById(params.id);

      if (!combo) {
        return reply.code(404).send({ message: 'Combo nao encontrado' });
      }

      return { data: combo };
    },
  );

  app.post(
    '/combos',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['combos'],
        summary: 'Criar combo',
        description: 'Operacao restrita ao perfil ADMIN.',
        security: bearerAuthSecurity,
        body: createComboBodySchema,
        response: {
          201: dataResponse(comboDetailSchema),
          400: validationErrorSchema,
          401: unauthorizedErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const parsed = createComboSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply
          .code(400)
          .send({ message: parsed.error.issues[0]?.message ?? 'Payload invalido' });
      }

      const combo = await combosService.createCombo(parsed.data);
      emitCatalogChanged('CREATED', combo.id);
      return reply.code(201).send({ data: combo });
    },
  );

  app.put(
    '/combos/:id',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['combos'],
        summary: 'Atualizar combo',
        description: 'Atualiza dados do combo. Operacao restrita ao perfil ADMIN.',
        security: bearerAuthSecurity,
        params: pathIdSchema,
        body: updateComboBodySchema,
        response: {
          200: dataResponse(comboDetailSchema),
          400: validationErrorSchema,
          401: unauthorizedErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { id: string };
      const parsed = updateComboSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply
          .code(400)
          .send({ message: parsed.error.issues[0]?.message ?? 'Payload invalido' });
      }

      const combo = await combosService.updateCombo(params.id, parsed.data);
      emitCatalogChanged('UPDATED', combo.id);
      return reply.code(200).send({ data: combo });
    },
  );

  app.patch(
    '/combos/:id/availability',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['combos'],
        summary: 'Atualizar disponibilidade de combo',
        description: 'Ativa ou desativa combo para venda mantendo o cadastro.',
        security: bearerAuthSecurity,
        params: pathIdSchema,
        body: availabilityBodySchema,
        response: {
          200: dataResponse(comboSchema),
          400: validationErrorSchema,
          401: unauthorizedErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { id: string };
      const parsed = updateComboAvailabilitySchema.safeParse(request.body);

      if (!parsed.success) {
        return reply
          .code(400)
          .send({ message: parsed.error.issues[0]?.message ?? 'Payload invalido' });
      }

      const combo = await combosService.updateAvailability(params.id, parsed.data.isAvailable);
      emitCatalogChanged('AVAILABILITY_CHANGED', combo.id);
      return reply.code(200).send({ data: combo });
    },
  );

  app.delete(
    '/combos/:id',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['combos'],
        summary: 'Remover combo',
        description: 'Remove combo e itens vinculados. Operacao restrita ao perfil ADMIN.',
        security: bearerAuthSecurity,
        params: pathIdSchema,
        response: {
          200: dataResponse(comboDetailSchema),
          401: unauthorizedErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { id: string };
      const combo = await combosService.deleteCombo(params.id);
      emitCatalogChanged('DELETED', combo.id);
      return reply.code(200).send({ data: combo });
    },
  );
}
