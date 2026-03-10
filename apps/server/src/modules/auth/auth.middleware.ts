import type { FastifyReply, FastifyRequest } from 'fastify';

interface JwtUser {
  sub: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
}

declare module 'fastify' {
  interface FastifyRequest {
    user: JwtUser;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtUser;
    user: JwtUser;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await request.jwtVerify<JwtUser>();
  } catch {
    await reply.code(401).send({ message: 'Token invalido ou ausente' });
    return;
  }
}

export function checkRole(roles: Array<'ADMIN' | 'STAFF'>) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user?.role || !roles.includes(request.user.role)) {
      await reply.code(403).send({ message: 'Acesso negado para este perfil' });
      return;
    }
  };
}
