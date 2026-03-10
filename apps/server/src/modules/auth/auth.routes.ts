import type { FastifyInstance } from 'fastify';

import {
  authMeResponseSchema,
  bearerAuthSecurity,
  loginBodySchema,
  loginResponseSchema,
  unauthorizedErrorSchema,
  validationErrorSchema,
} from '@/shared/http/openapi';
import { loginSchema } from './auth.types';
import { isAuthError, login } from './auth.service';
import { authenticate } from './auth.middleware';

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/auth/login',
    {
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

      try {
        const result = await login(app, parsed.data);
        return reply.code(200).send(result);
      } catch (error) {
        if (isAuthError(error)) {
          return reply.code(error.statusCode).send({ message: error.message });
        }

        throw error;
      }
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
