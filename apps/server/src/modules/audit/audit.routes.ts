import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { authenticate, checkRole } from '@/modules/auth/auth.middleware';
import { bearerAuthSecurity, dataResponse, unauthorizedErrorSchema } from '@/shared/http/openapi';
import { auditService } from '@/shared/audit/audit.service';

const auditLogSchema = {
  type: 'object',
  required: ['timestamp', 'method', 'path', 'statusCode', 'entity', 'action'],
  properties: {
    timestamp: { type: 'string', format: 'date-time' },
    actorId: { type: 'string' },
    actorEmail: { type: 'string' },
    actorRole: { type: 'string' },
    method: { type: 'string' },
    path: { type: 'string' },
    statusCode: { type: 'integer' },
    ip: { type: 'string' },
    entity: { type: 'string' },
    action: { type: 'string' },
    payload: { type: 'object', additionalProperties: true },
  },
} as const;

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(100),
  sort: z.enum(['newest', 'oldest']).default('newest'),
  entity: z.string().min(1).optional(),
  action: z.string().min(1).optional(),
  actorEmail: z.string().min(1).optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
});

const auditListResponseSchema = {
  type: 'object',
  required: ['items', 'page', 'pageSize', 'total', 'hasNextPage'],
  properties: {
    items: {
      type: 'array',
      items: auditLogSchema,
    },
    page: { type: 'integer' },
    pageSize: { type: 'integer' },
    total: { type: 'integer' },
    hasNextPage: { type: 'boolean' },
  },
} as const;

export async function registerAuditRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/audit/logs',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['audit', 'admin'],
        summary: 'Consultar trilha de auditoria administrativa',
        security: bearerAuthSecurity,
        response: {
          200: dataResponse(auditListResponseSchema),
          401: unauthorizedErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const parsed = querySchema.safeParse(request.query ?? {});
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ message: parsed.error.issues[0]?.message ?? 'Query invalida' });
      }

      return {
        data: await auditService.list({
          page: parsed.data.page,
          pageSize: parsed.data.pageSize,
          sort: parsed.data.sort,
          entity: parsed.data.entity,
          action: parsed.data.action,
          actorEmail: parsed.data.actorEmail,
          startAt: parsed.data.startAt,
          endAt: parsed.data.endAt,
        }),
      };
    },
  );
}
