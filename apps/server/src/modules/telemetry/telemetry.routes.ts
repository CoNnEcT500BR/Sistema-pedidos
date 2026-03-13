import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import {
  telemetryEventBodySchema,
  telemetryIngestResponseSchema,
  telemetryRecentEventsResponseSchema,
  validationErrorSchema,
} from '@/shared/http/openapi';

const telemetryEventSchema = z.object({
  event: z.string().min(1),
  timestamp: z.string().datetime().optional(),
  sessionId: z.string().min(1),
  path: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
});

const recentEvents: Array<z.infer<typeof telemetryEventSchema> & { receivedAt: string }> = [];

export async function registerTelemetryRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/telemetry/events',
    {
      schema: {
        tags: ['telemetry'],
        summary: 'Registrar evento de telemetria',
        description: 'Ingere evento do frontend para analise de jornada e funil no kiosk.',
        body: telemetryEventBodySchema,
        response: {
          202: telemetryIngestResponseSchema,
          400: validationErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const parsed = telemetryEventSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({ message: 'Payload invalido para telemetry' });
      }

      const payload = parsed.data;
      recentEvents.push({
        ...payload,
        receivedAt: new Date().toISOString(),
      });

      if (recentEvents.length > 500) {
        recentEvents.splice(0, recentEvents.length - 500);
      }

      app.log.info(
        {
          event: payload.event,
          path: payload.path,
          sessionId: payload.sessionId,
          metadata: payload.metadata,
        },
        'Telemetry event',
      );

      return reply.code(202).send({ ok: true });
    },
  );

  app.get(
    '/telemetry/events',
    {
      schema: {
        tags: ['telemetry'],
        summary: 'Listar eventos recentes de telemetria',
        description:
          'Retorna os ultimos 50 eventos mantidos em memoria para observabilidade local.',
        response: {
          200: telemetryRecentEventsResponseSchema,
        },
      },
    },
    async () => {
      return {
        data: {
          count: recentEvents.length,
          events: recentEvents.slice(-50),
        },
      };
    },
  );
}
