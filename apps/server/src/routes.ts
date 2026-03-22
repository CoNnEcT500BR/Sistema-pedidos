import { FastifyInstance } from 'fastify';
import { registerAuthRoutes } from '@/modules/auth/auth.routes';
import { registerMenuRoutes } from '@/modules/menu/menu.routes';
import { registerCombosRoutes } from '@/modules/combos/combos.routes';
import { registerOrdersRoutes } from '@/modules/orders/orders.routes';
import { registerAddonsRoutes } from '@/modules/addons/addons.routes';
import { registerTelemetryRoutes } from '@/modules/telemetry/telemetry.routes';
import { registerReportsRoutes } from '@/modules/reports/reports.routes';
import { registerUsersRoutes } from '@/modules/users/users.routes';

export async function registerRoutes(fastify: FastifyInstance) {
  fastify.get('/status', async () => ({
    message: 'System operational',
    timestamp: new Date().toISOString(),
  }));

  fastify.get('/ping', async () => ({
    pong: true,
  }));

  await fastify.register(registerAuthRoutes, { prefix: '/api' });
  await fastify.register(registerMenuRoutes, { prefix: '/api' });
  await fastify.register(registerCombosRoutes, { prefix: '/api' });
  await fastify.register(registerOrdersRoutes, { prefix: '/api' });
  await fastify.register(registerAddonsRoutes, { prefix: '/api' });
  await fastify.register(registerTelemetryRoutes, { prefix: '/api' });
  await fastify.register(registerReportsRoutes, { prefix: '/api' });
  await fastify.register(registerUsersRoutes, { prefix: '/api' });

  fastify.log.info(
    'Rotas das Fases 2 a 5 (Auth/Menu/Combos/Orders/Addons/Telemetry/Reports/Users) registradas',
  );
}
