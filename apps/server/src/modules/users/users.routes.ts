import type { FastifyInstance } from 'fastify';

import { authenticate, checkRole } from '@/modules/auth/auth.middleware';
import {
  bearerAuthSecurity,
  dataResponse,
  notFoundErrorSchema,
  pathIdSchema,
  unauthorizedErrorSchema,
  validationErrorSchema,
  arrayDataResponse,
} from '@/shared/http/openapi';
import { isUsersServiceError, usersService } from './users.service';
import { createUserSchema, updateUserSchema, updateUserStatusSchema } from './users.types';

const userSchema = {
  type: 'object',
  required: ['id', 'email', 'role', 'name', 'isActive', 'lastLogin', 'createdAt', 'updatedAt'],
  properties: {
    id: { type: 'string' },
    email: { type: 'string', format: 'email' },
    role: { type: 'string', enum: ['ADMIN', 'STAFF'] },
    name: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    isActive: { type: 'boolean' },
    lastLogin: { anyOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }] },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
} as const;

const createUserBodySchema = {
  type: 'object',
  required: ['email', 'password', 'role'],
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 6 },
    role: { type: 'string', enum: ['ADMIN', 'STAFF'] },
    name: { type: 'string' },
    isActive: { type: 'boolean' },
  },
} as const;

const updateUserBodySchema = {
  type: 'object',
  minProperties: 1,
  properties: createUserBodySchema.properties,
} as const;

const updateUserStatusBodySchema = {
  type: 'object',
  required: ['isActive'],
  properties: {
    isActive: { type: 'boolean' },
  },
} as const;

export async function registerUsersRoutes(app: FastifyInstance): Promise<void> {
  const emitUserChanged = (
    action: 'CREATED' | 'UPDATED' | 'DELETED' | 'STATUS_CHANGED',
    userId: string,
  ) => {
    app.realtime.broadcastUserChanged({
      type: 'USER_CHANGED',
      action,
      userId,
      timestamp: new Date().toISOString(),
    });
  };

  app.get(
    '/users',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['users', 'admin'],
        summary: 'Listar usuarios internos',
        description: 'Retorna usuarios internos ativos e inativos para gestao administrativa.',
        security: bearerAuthSecurity,
        response: {
          200: arrayDataResponse(userSchema),
          401: unauthorizedErrorSchema,
        },
      },
    },
    async () => ({ data: await usersService.listUsers() }),
  );

  app.post(
    '/users',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['users', 'admin'],
        summary: 'Criar usuario interno',
        description: 'Cria um usuario interno com perfil ADMIN ou STAFF.',
        security: bearerAuthSecurity,
        body: createUserBodySchema,
        response: {
          201: dataResponse(userSchema),
          400: validationErrorSchema,
          401: unauthorizedErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const parsed = createUserSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ message: parsed.error.issues[0]?.message ?? 'Payload invalido' });
      }

      try {
        const data = await usersService.createUser(parsed.data);
        emitUserChanged('CREATED', data.id);
        return reply.code(201).send({ data });
      } catch (error) {
        if (isUsersServiceError(error)) {
          return reply.code(error.statusCode).send({ message: error.message });
        }

        throw error;
      }
    },
  );

  app.put(
    '/users/:id',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['users', 'admin'],
        summary: 'Atualizar usuario interno',
        description: 'Atualiza campos do usuario interno identificado pelo id.',
        security: bearerAuthSecurity,
        params: pathIdSchema,
        body: updateUserBodySchema,
        response: {
          200: dataResponse(userSchema),
          400: validationErrorSchema,
          401: unauthorizedErrorSchema,
          404: notFoundErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { id: string };
      const parsed = updateUserSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ message: parsed.error.issues[0]?.message ?? 'Payload invalido' });
      }

      try {
        const data = await usersService.updateUser(params.id, parsed.data);
        emitUserChanged('UPDATED', data.id);
        return { data };
      } catch (error) {
        if (isUsersServiceError(error)) {
          return reply.code(error.statusCode).send({ message: error.message });
        }

        throw error;
      }
    },
  );

  app.patch(
    '/users/:id/status',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['users', 'admin'],
        summary: 'Ativar ou desativar usuario interno',
        description: 'Atualiza o status de ativacao do usuario interno.',
        security: bearerAuthSecurity,
        params: pathIdSchema,
        body: updateUserStatusBodySchema,
        response: {
          200: dataResponse(userSchema),
          400: validationErrorSchema,
          401: unauthorizedErrorSchema,
          404: notFoundErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { id: string };
      const parsed = updateUserStatusSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ message: parsed.error.issues[0]?.message ?? 'Payload invalido' });
      }

      try {
        const data = await usersService.updateStatus(params.id, parsed.data.isActive);
        emitUserChanged('STATUS_CHANGED', data.id);
        return { data };
      } catch (error) {
        if (isUsersServiceError(error)) {
          return reply.code(error.statusCode).send({ message: error.message });
        }

        throw error;
      }
    },
  );

  app.delete(
    '/users/:id',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['users', 'admin'],
        summary: 'Remover usuario interno',
        description: 'Remove um usuario interno pelo id, exceto a propria conta autenticada.',
        security: bearerAuthSecurity,
        params: pathIdSchema,
        response: {
          200: dataResponse(userSchema),
          400: validationErrorSchema,
          401: unauthorizedErrorSchema,
          404: notFoundErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { id: string };

      try {
        const data = await usersService.deleteUser(params.id, request.user.sub);
        emitUserChanged('DELETED', data.id);
        return { data };
      } catch (error) {
        if (isUsersServiceError(error)) {
          return reply.code(error.statusCode).send({ message: error.message });
        }

        if (error instanceof Error) {
          return reply.code(400).send({ message: error.message });
        }

        throw error;
      }
    },
  );
}
