import type { FastifyInstance } from 'fastify';

import {
  authMeResponseSchema,
  bearerAuthSecurity,
  loginBodySchema,
  loginResponseSchema,
  unlockRequestBodySchema,
  unlockRequestResponseSchema,
  unauthorizedErrorSchema,
  validationErrorSchema,
} from '@/shared/http/openapi.js';
import { loginSchema, unlockRequestSchema } from './authTypes.js';
import { isAuthError, login } from './auth.service.js';
import { authenticate } from './authMiddleware.js';
import { authLockout } from './auth.lockout.js';

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/auth/login',
    {
      config: {
        rateLimit: {
          max: 20,
          timeWindow: '15 minutes',
        },
      },
      schema: {
        tags: ['auth'],
        summary: 'Autenticar usuario',
        description: 'Valida credenciais e retorna token JWT para acesso a rotas protegidas.',
        body: loginBodySchema,
        response: {
          200: loginResponseSchema,
          400: validationErrorSchema,
          401: unauthorizedErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const parsed = loginSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ message: parsed.error.issues[0]?.message ?? 'Payload invalido' });
      }

      const lock = await authLockout.isBlocked(parsed.data.email, request.ip);
      if (lock.blocked) {
        reply.header('retry-after', String(lock.retryAfterSec));
        return reply.code(429).send({
          message: `Conta temporariamente bloqueada. Tente novamente em ${lock.retryAfterSec}s ou use o botão “Desbloquear” para resetar o acesso.`,
        });
      }

      try {
        const result = await login(app, parsed.data);
        await authLockout.registerSuccess(parsed.data.email, request.ip);
        return reply.code(200).send(result);
      } catch (error) {
        if (isAuthError(error)) {
          if (error.statusCode === 401) {
            await authLockout.registerFailure(parsed.data.email, request.ip);
          }
          return reply.code(error.statusCode).send({ message: error.message });
        }

        throw error;
      }
    },
  );

  app.post(
    '/auth/unlock-request',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '15 minutes',
        },
      },
      schema: {
        tags: ['auth'],
        summary: 'Solicitar desbloqueio de conta',
        description:
          'Valida o e-mail informado e, se a conta estiver bloqueada, reinicia o bloqueio para permitir nova tentativa segura.',
        body: unlockRequestBodySchema,
        response: {
          200: unlockRequestResponseSchema,
          400: validationErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const parsed = unlockRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ message: parsed.error.issues[0]?.message ?? 'Payload invalido' });
      }

      await authLockout.reset(parsed.data.email, request.ip);

      return reply.code(200).send({
        message:
          'Se a conta estiver associada a um usuário ativo, o bloqueio será liberado para nova tentativa.',
      });
    },
  );

  app.get(
    '/auth/me',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['auth'],
        summary: 'Obter sessao autenticada',
        description: 'Retorna os dados basicos do usuario autenticado a partir do token JWT.',
        security: bearerAuthSecurity,
        response: {
          200: authMeResponseSchema,
          401: unauthorizedErrorSchema,
        },
      },
    },
    async (request) => {
      return {
        user: {
          id: request.user.sub,
          email: request.user.email,
          role: request.user.role,
        },
      };
    },
  );
}
