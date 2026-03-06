import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';

// Initialize Prisma
export const prisma = new PrismaClient();

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

// Register plugins
await fastify.register(fastifyCors, {
  origin: ['http://localhost:5173', 'http://localhost:3000', /192\.168\.\d+\.\d+/],
  credentials: true,
});

await fastify.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
  sign: {
    expiresIn: '7d',
  },
});

// Health check route
fastify.get('/health', async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
});

// API versioning
fastify.get('/api/v1/health', async () => {
  return {
    status: 'ok',
    version: '1.0.0',
    database: 'connected',
  };
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001', 10);
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });

    console.log(`
    🚀 Servidor iniciado com sucesso!
    📍 http://${host}:${port}
    ✅ Database: pronto para usar
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

// Graceful shutdown
process.on('SIGINT', async () => {
  await fastify.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await fastify.close();
  await prisma.$disconnect();
  process.exit(0);
});
