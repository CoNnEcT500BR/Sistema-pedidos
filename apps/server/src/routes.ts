import { FastifyInstance } from 'fastify';
import { registerAuthRoutes } from '@/modules/auth/auth.routes.js';
import { registerMenuRoutes } from '@/modules/menu/menu.routes.js';
import { registerCombosRoutes } from '@/modules/combos/combos.routes.js';
import { registerOrdersRoutes } from '@/modules/orders/orders.routes.js';
import { registerAddonsRoutes } from '@/modules/addons/addons.routes.js';
import { registerTelemetryRoutes } from '@/modules/telemetry/telemetry.routes.js';
import { registerReportsRoutes } from '@/modules/reports/reports.routes.js';
import { registerUsersRoutes } from '@/modules/users/users.routes.js';
import { registerDeliveryRoutes } from '@/modules/delivery/delivery.routes.js';
import { registerAuditRoutes } from '@/modules/audit/audit.routes.js';
import { registerFeatureFlagsRoutes } from '@/modules/feature-flags/feature-flags.routes.js';
import { registerInventoryRoutes } from '@/modules/inventory/inventory.routes.js';

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
  await fastify.register(registerDeliveryRoutes, { prefix: '/api' });
  await fastify.register(registerAuditRoutes, { prefix: '/api' });
  await fastify.register(registerFeatureFlagsRoutes, { prefix: '/api' });
  await fastify.register(registerInventoryRoutes, { prefix: '/api' });

  fastify.log.info(
    'Rotas das Fases 2 a 5 (Auth/Menu/Combos/Orders/Addons/Telemetry/Reports/Users/Delivery/Audit/FeatureFlags) registradas',
  );
}
