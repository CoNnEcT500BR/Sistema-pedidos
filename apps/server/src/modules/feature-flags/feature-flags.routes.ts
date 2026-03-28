import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { authenticate, checkRole } from '@/modules/auth/auth.middleware';
import {
  arrayDataResponse,
  bearerAuthSecurity,
  dataResponse,
  unauthorizedErrorSchema,
  validationErrorSchema,
} from '@/shared/http/openapi';
import { featureFlagsService } from './feature-flags.service';

const featureFlagSchema = {
  type: 'object',
  required: ['key', 'enabled'],
  properties: {
    key: { type: 'string' },
    enabled: { type: 'boolean' },
    description: { type: 'string' },
    rules: {
      type: 'object',
      properties: {
        roles: {
          type: 'array',
          items: { type: 'string', enum: ['ADMIN', 'STAFF', 'PUBLIC'] },
        },
        channels: {
          type: 'array',
          items: { type: 'string', enum: ['ADMIN', 'STAFF', 'KIOSK', 'API'] },
        },
        rolloutPercentage: { type: 'integer', minimum: 0, maximum: 100 },
      },
    },
  },
} as const;

const evaluateQuerySchema = z.object({
  key: z.string().optional(),
  role: z.enum(['ADMIN', 'STAFF', 'PUBLIC']).default('PUBLIC'),
  channel: z.enum(['ADMIN', 'STAFF', 'KIOSK', 'API']).default('API'),
  userKey: z.string().min(1, 'userKey obrigatorio'),
});

const evaluateQuerystringOpenApiSchema = {
  type: 'object',
  required: ['userKey'],
  properties: {
    key: { type: 'string' },
    role: { type: 'string', enum: ['ADMIN', 'STAFF', 'PUBLIC'], default: 'PUBLIC' },
    channel: { type: 'string', enum: ['ADMIN', 'STAFF', 'KIOSK', 'API'], default: 'API' },
    userKey: { type: 'string', minLength: 1 },
  },
} as const;

const evaluateResponseSchema = {
  type: 'object',
  additionalProperties: { type: 'boolean' },
} as const;

const upsertSchema = z.object({
  key: z.string().min(1, 'key obrigatoria'),
  enabled: z.boolean(),
  description: z.string().optional(),
  rules: z
    .object({
      roles: z.array(z.enum(['ADMIN', 'STAFF', 'PUBLIC'])).optional(),
      channels: z.array(z.enum(['ADMIN', 'STAFF', 'KIOSK', 'API'])).optional(),
      rolloutPercentage: z.number().int().min(0).max(100).optional(),
    })
    .optional(),
});

export async function registerFeatureFlagsRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/feature-flags',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['feature-flags', 'admin'],
        summary: 'Listar feature flags',
        security: bearerAuthSecurity,
        response: {
          200: arrayDataResponse(featureFlagSchema),
          401: unauthorizedErrorSchema,
        },
      },
    },
    async () => ({ data: await featureFlagsService.listFlags() }),
  );

  app.put(
    '/feature-flags/:key',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['feature-flags', 'admin'],
        summary: 'Atualizar feature flag',
        security: bearerAuthSecurity,
        response: {
          200: dataResponse(featureFlagSchema),
          400: validationErrorSchema,
          401: unauthorizedErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { key: string };
      const parsed = upsertSchema.safeParse({ ...(request.body as object), key: params.key });
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ message: parsed.error.issues[0]?.message ?? 'Payload invalido' });
      }

      const data = await featureFlagsService.upsertFlag(parsed.data);
      return { data };
    },
  );

  app.get(
    '/feature-flags/evaluate',
    {
      schema: {
        tags: ['feature-flags'],
        summary: 'Avaliar feature flags para role/canal',
        description:
          'Avalia as flags considerando role, channel e rollout percentual para um userKey consistente.',
        querystring: evaluateQuerystringOpenApiSchema,
        response: {
          200: dataResponse(evaluateResponseSchema),
          400: validationErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const parsed = evaluateQuerySchema.safeParse(request.query ?? {});
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ message: parsed.error.issues[0]?.message ?? 'Query invalida' });
      }

      const data = await featureFlagsService.evaluate(parsed.data);
      return { data };
    },
  );
}
