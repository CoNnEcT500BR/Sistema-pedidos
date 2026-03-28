import { buildApp } from '../src/app';
import { prisma } from '../src/shared/database/prisma.client';

const requiredTags = [
  'auth',
  'menu',
  'combos',
  'orders',
  'addons',
  'telemetry',
  'reports',
  'users',
  'delivery',
  'audit',
  'feature-flags',
];

const requiredPaths = [
  '/api/feature-flags',
  '/api/feature-flags/{key}',
  '/api/feature-flags/evaluate',
  '/api/delivery/queue',
  '/api/delivery/queue/from-ready',
  '/api/admin/menu/reorder',
];

async function main() {
  const app = await buildApp();

  try {
    await app.listen({ port: 0, host: '127.0.0.1' });

    const address = app.server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Nao foi possivel obter endereco do servidor para validar OpenAPI');
    }

    const specUrl = `http://127.0.0.1:${address.port}/docs/json`;
    const response = await fetch(specUrl);

    if (!response.ok) {
      throw new Error(`Falha ao carregar OpenAPI em ${specUrl} (status ${response.status})`);
    }

    const spec = (await response.json()) as {
      openapi?: string;
      tags?: Array<{ name?: string }>;
      paths?: Record<string, unknown>;
    };

    if (!spec.openapi?.startsWith('3.')) {
      throw new Error(`Versao OpenAPI invalida: ${spec.openapi ?? 'indefinida'}`);
    }

    const existingTags = new Set((spec.tags ?? []).map((tag) => tag.name).filter(Boolean));
    const missingTags = requiredTags.filter((tag) => !existingTags.has(tag));
    if (missingTags.length > 0) {
      throw new Error(`Tags obrigatorias ausentes: ${missingTags.join(', ')}`);
    }

    const existingPaths = new Set(Object.keys(spec.paths ?? {}));
    const missingPaths = requiredPaths.filter((path) => !existingPaths.has(path));
    if (missingPaths.length > 0) {
      throw new Error(`Endpoints obrigatorios ausentes na spec: ${missingPaths.join(', ')}`);
    }

    console.log('OpenAPI validado com sucesso.');
    console.log(`Tags verificadas: ${requiredTags.length}`);
    console.log(`Endpoints verificados: ${requiredPaths.length}`);
  } finally {
    await app.close();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Validacao OpenAPI falhou: ${message}`);
  process.exit(1);
});
