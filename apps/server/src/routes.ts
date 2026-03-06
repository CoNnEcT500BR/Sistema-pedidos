import { FastifyInstance } from 'fastify'

/**
 * Registro de rotas básicas do sistema
 * Mais rotas serão adicionadas na Fase 2
 */
export async function registerRoutes(fastify: FastifyInstance) {
  // Status route
  fastify.get('/status', async () => ({
    message: 'System operational',
    timestamp: new Date().toISOString(),
  }))

  // Health check
  fastify.get('/ping', async () => ({
    pong: true,
  }))

  console.log('✅ Rotas básicas registradas')
}
