import Fastify, { type FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

import { registerRoutes } from './routes';
import { registerRealtime } from '@/shared/realtime/realtime';

const isProduction = process.env.NODE_ENV === 'production';
const usePrettyLogs = !isProduction && process.env.LOG_PRETTY !== 'false';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      ...(usePrettyLogs
        ? {
            transport: {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
              },
            },
          }
        : {}),
    },
  });

  await app.register(fastifyCors, {
    origin: ['http://localhost:5173', 'http://localhost:3000', /192\.168\.\d+\.\d+/],
    credentials: true,
  });

  await app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
    sign: {
      expiresIn: '7d',
    },
  });

  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Sistema de Pedidos API',
        description: 'Documentacao da API (Auth, Menu, Combos, Orders, Addons e Telemetry)',
        version: '1.1.0',
      },
      servers: [{ url: 'http://localhost:3001' }],
      tags: [
        { name: 'auth', description: 'Autenticacao e sessao' },
        { name: 'menu', description: 'Cardapio e categorias' },
        { name: 'combos', description: 'Combos e promocoes' },
        { name: 'orders', description: 'Pedidos e status' },
        { name: 'addons', description: 'Adicionais e regras por item' },
        { name: 'telemetry', description: 'Eventos de jornada do kiosk' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
    staticCSP: true,
  });

  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));

  app.get('/api/v1/health', async () => ({
    status: 'ok',
    version: '1.0.0',
    database: 'connected',
  }));

  await registerRealtime(app);

  await registerRoutes(app);

  return app;
}
