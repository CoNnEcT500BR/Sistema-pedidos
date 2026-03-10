import { buildApp } from './app';
import { prisma } from '@/shared/database/prisma.client';

const app = await buildApp();

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001', 10);
    const host = process.env.HOST || '0.0.0.0';

    await app.listen({ port, host });

    console.log(`
    🚀 Servidor iniciado com sucesso!
    📍 http://${host}:${port}
    ✅ Database: pronto para usar
    `);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();

// Graceful shutdown
process.on('SIGINT', async () => {
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
});
