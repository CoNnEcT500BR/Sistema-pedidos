import type { FastifyInstance } from 'fastify';

import {
  addonSchema,
  arrayDataResponse,
  menuItemAddonOptionSchema,
  menuItemPathIdSchema,
  notFoundErrorSchema,
} from '@/shared/http/openapi';
import { addonsService, isAddonsServiceError } from './addons.service';

export async function registerAddonsRoutes(app: FastifyInstance): Promise<void> {
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
