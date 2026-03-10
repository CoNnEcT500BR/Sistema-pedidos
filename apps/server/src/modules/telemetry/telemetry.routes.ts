import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

const telemetryEventSchema = z.object({
  event: z.string().min(1),
  timestamp: z.string().datetime().optional(),
  sessionId: z.string().min(1),
  path: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
});

const recentEvents: Array<z.infer<typeof telemetryEventSchema> & { receivedAt: string }> = [];

export async function registerTelemetryRoutes(app: FastifyInstance): Promise<void> {
  app.post('/telemetry/events', async (request, reply) => {
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
  });

  app.get('/telemetry/events', async () => {
    return {
      data: {
        count: recentEvents.length,
        events: recentEvents.slice(-50),
      },
    };
  });
}
