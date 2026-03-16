import fastifyWebsocket from '@fastify/websocket';
import type { FastifyInstance } from 'fastify';
import type WebSocket from 'ws';

export type OrdersRealtimeEventType = 'ORDER_CREATED' | 'ORDER_STATUS_UPDATED';

export interface OrdersRealtimeEvent {
  type: OrdersRealtimeEventType;
  orderId: string;
  orderNumber: number;
  status: string;
  timestamp: string;
}

export type CatalogEntityType = 'CATEGORY' | 'MENU_ITEM' | 'COMBO' | 'ADDON';

export type CatalogActionType =
  | 'CREATED'
  | 'UPDATED'
  | 'DELETED'
  | 'STATUS_CHANGED'
  | 'AVAILABILITY_CHANGED';

export interface CatalogRealtimeEvent {
  type: 'CATALOG_CHANGED';
  entity: CatalogEntityType;
  action: CatalogActionType;
  entityId: string;
  timestamp: string;
}

export type UserActionType = 'CREATED' | 'UPDATED' | 'DELETED' | 'STATUS_CHANGED';

export interface UsersRealtimeEvent {
  type: 'USER_CHANGED';
  action: UserActionType;
  userId: string;
  timestamp: string;
}

interface OrdersRealtimeMessage {
  channel: 'orders';
  event: OrdersRealtimeEvent;
}

interface CatalogRealtimeMessage {
  channel: 'catalog';
  event: CatalogRealtimeEvent;
}

interface UsersRealtimeMessage {
  channel: 'users';
  event: UsersRealtimeEvent;
}

declare module 'fastify' {
  interface FastifyInstance {
    realtime: {
      broadcastOrderChanged: (event: OrdersRealtimeEvent) => void;
      broadcastCatalogChanged: (event: CatalogRealtimeEvent) => void;
      broadcastUserChanged: (event: UsersRealtimeEvent) => void;
    };
  }
}

function safeSend(socket: WebSocket, payload: string): void {
  if (socket.readyState === socket.OPEN) {
    socket.send(payload);
  }
}

export async function registerRealtime(app: FastifyInstance): Promise<void> {
  await app.register(fastifyWebsocket);

  const clients = new Set<WebSocket>();

  function extractToken(authorization?: string, queryToken?: string): string | null {
    if (queryToken && queryToken.trim()) {
      return queryToken.trim();
    }

    if (!authorization) {
      return null;
    }

    const [scheme, token] = authorization.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      return null;
    }

    return token;
  }

  app.decorate('realtime', {
    broadcastOrderChanged(event: OrdersRealtimeEvent) {
      const message: OrdersRealtimeMessage = {
        channel: 'orders',
        event,
      };

      const payload = JSON.stringify(message);
      for (const client of clients) {
        safeSend(client, payload);
      }
    },
    broadcastCatalogChanged(event: CatalogRealtimeEvent) {
      const message: CatalogRealtimeMessage = {
        channel: 'catalog',
        event,
      };

      const payload = JSON.stringify(message);
      for (const client of clients) {
        safeSend(client, payload);
      }
    },
    broadcastUserChanged(event: UsersRealtimeEvent) {
      const message: UsersRealtimeMessage = {
        channel: 'users',
        event,
      };

      const payload = JSON.stringify(message);
      for (const client of clients) {
        safeSend(client, payload);
      }
    },
  });

  app.get('/ws', { websocket: true }, async (connection, request) => {
    const socket = connection.socket;
    const query = request.query as { token?: string };
    const token = extractToken(request.headers.authorization, query.token);

    if (!token) {
      socket.close(1008, 'Unauthorized');
      return;
    }

    try {
      const payload = await app.jwt.verify<{ role?: string }>(token);
      if (!payload?.role || (payload.role !== 'ADMIN' && payload.role !== 'STAFF')) {
        socket.close(1008, 'Forbidden');
        return;
      }
    } catch {
      socket.close(1008, 'Unauthorized');
      return;
    }

    clients.add(socket);

    socket.on('close', () => {
      clients.delete(socket);
    });

    socket.on('error', () => {
      clients.delete(socket);
    });
  });

  app.addHook('onClose', async () => {
    for (const client of clients) {
      client.close();
    }
    clients.clear();
  });
}
