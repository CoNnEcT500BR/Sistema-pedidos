import type { FastifyInstance } from 'fastify';

import { addonsService, isAddonsServiceError } from './addons.service';

export async function registerAddonsRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/addons',
    {
      schema: {
        tags: ['addons'],
        summary: 'Listar addons ativos',
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    addonType: { type: 'string' },
                    price: { type: 'number' },
                    description: { type: ['string', 'null'] },
                  },
                },
              },
            },
          },
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
        params: {
          type: 'object',
          required: ['menuItemId'],
          properties: {
            menuItemId: { type: 'string' },
          },
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
