import Fastify, { type FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { Registry, collectDefaultMetrics, Counter, Histogram } from 'prom-client';

import { registerRoutes } from './routes';
import { registerRealtime } from '@/shared/realtime/realtime';
import { auditService } from '@/shared/audit/audit.service';

const isProduction = process.env.NODE_ENV === 'production';
const usePrettyLogs = !isProduction && process.env.LOG_PRETTY !== 'false';

export async function buildApp(): Promise<FastifyInstance> {
  const metricsRegistry = new Registry();
  collectDefaultMetrics({ register: metricsRegistry });

  const httpRequestCounter = new Counter({
    name: 'sistema_pedidos_http_requests_total',
    help: 'Total de requisicoes HTTP por metodo, rota e status',
    labelNames: ['method', 'route', 'status_code'] as const,
    registers: [metricsRegistry],
  });

  const httpRequestDuration = new Histogram({
    name: 'sistema_pedidos_http_request_duration_seconds',
    help: 'Duracao das requisicoes HTTP em segundos',
    labelNames: ['method', 'route', 'status_code'] as const,
    buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
    registers: [metricsRegistry],
  });

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

  await app.register(fastifyRateLimit, {
    global: false,
    max: 100,
    timeWindow: '1 minute',
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

  app.get('/metrics', async (_request, reply) => {
    reply.header('content-type', metricsRegistry.contentType);
    return metricsRegistry.metrics();
  });

  app.addHook('onRequest', async (request) => {
    request.log.debug({ path: request.url, method: request.method }, 'request.received');
  });

  app.addHook('onResponse', async (request, reply) => {
    const route = request.routeOptions.url || request.url;
    const labels = {
      method: request.method,
      route,
      status_code: String(reply.statusCode),
    };

    httpRequestCounter.inc(labels);
    httpRequestDuration.observe(labels, reply.elapsedTime / 1000);

    const isAdminMutation =
      request.url.startsWith('/api') &&
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) &&
      reply.statusCode < 500;

    if (isAdminMutation) {
      const body =
        request.body && typeof request.body === 'object'
          ? (request.body as Record<string, unknown>)
          : undefined;
      await auditService.append({
        actorId: request.user?.sub,
        actorEmail: request.user?.email,
        actorRole: request.user?.role,
        method: request.method,
        path: request.url,
        statusCode: reply.statusCode,
        ip: request.ip,
        payload: body,
      });
    }
  });

  await registerRealtime(app);

  await registerRoutes(app);

  app.setErrorHandler((error, request, reply) => {
    if (reply.sent) {
      return;
    }

    if ((error as { validation?: unknown }).validation) {
      reply.code(400).send({ message: error.message });
      return;
    }

    const statusCode =
      typeof (error as { statusCode?: unknown }).statusCode === 'number'
        ? (error as { statusCode: number }).statusCode
        : 500;

    if (statusCode >= 500) {
      request.log.error({ err: error }, 'Unhandled server error');
    }

    reply.code(statusCode).send({
      message: statusCode >= 500 ? 'Internal server error' : error.message,
    });
  });

  return app;
}
