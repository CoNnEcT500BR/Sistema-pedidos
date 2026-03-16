export type OrdersRealtimeEventType = 'ORDER_CREATED' | 'ORDER_STATUS_UPDATED';

export interface OrdersRealtimeEvent {
  type: OrdersRealtimeEventType;
  orderId: string;
  orderNumber: number;
  status: string;
  timestamp: string;
}

export interface CatalogRealtimeEvent {
  type: 'CATALOG_CHANGED';
  entity: 'CATEGORY' | 'MENU_ITEM' | 'COMBO' | 'ADDON';
  action: 'CREATED' | 'UPDATED' | 'DELETED' | 'STATUS_CHANGED' | 'AVAILABILITY_CHANGED';
  entityId: string;
  timestamp: string;
}

export interface UsersRealtimeEvent {
  type: 'USER_CHANGED';
  action: 'CREATED' | 'UPDATED' | 'DELETED' | 'STATUS_CHANGED';
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

type OrdersListener = (event: OrdersRealtimeEvent) => void;
type CatalogListener = (event: CatalogRealtimeEvent) => void;
type UsersListener = (event: UsersRealtimeEvent) => void;
export type RealtimeConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
type ConnectionStatusListener = (status: RealtimeConnectionStatus) => void;

function buildWebSocketUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const url = new URL(apiUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = '/ws';
  url.search = '';
  const token = localStorage.getItem('auth_token');
  if (token) {
    url.searchParams.set('token', token);
  }
  return url.toString();
}

class RealtimeService {
  private socket: WebSocket | null = null;
  private ordersListeners = new Set<OrdersListener>();
  private catalogListeners = new Set<CatalogListener>();
  private usersListeners = new Set<UsersListener>();
  private statusListeners = new Set<ConnectionStatusListener>();
  private reconnectTimer: number | null = null;
  private reconnectAttempts = 0;
  private manualClose = false;
  private connectionStatus: RealtimeConnectionStatus = 'disconnected';

  getConnectionStatus(): RealtimeConnectionStatus {
    return this.connectionStatus;
  }

  subscribeConnectionStatus(listener: ConnectionStatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.connectionStatus);
    this.ensureConnected();

    return () => {
      this.statusListeners.delete(listener);
      if (
        this.ordersListeners.size === 0 &&
        this.catalogListeners.size === 0 &&
        this.usersListeners.size === 0 &&
        this.statusListeners.size === 0
      ) {
        this.disconnect();
      }
    };
  }

  private setConnectionStatus(status: RealtimeConnectionStatus): void {
    if (this.connectionStatus === status) {
      return;
    }

    this.connectionStatus = status;
    for (const listener of this.statusListeners) {
      listener(status);
    }
  }

  subscribeToOrders(listener: OrdersListener): () => void {
    this.ordersListeners.add(listener);
    this.ensureConnected();

    return () => {
      this.ordersListeners.delete(listener);
      if (
        this.ordersListeners.size === 0 &&
        this.catalogListeners.size === 0 &&
        this.usersListeners.size === 0 &&
        this.statusListeners.size === 0
      ) {
        this.disconnect();
      }
    };
  }

  subscribeToUsers(listener: UsersListener): () => void {
    this.usersListeners.add(listener);
    this.ensureConnected();

    return () => {
      this.usersListeners.delete(listener);
      if (
        this.ordersListeners.size === 0 &&
        this.catalogListeners.size === 0 &&
        this.usersListeners.size === 0 &&
        this.statusListeners.size === 0
      ) {
        this.disconnect();
      }
    };
  }

  subscribeToCatalog(listener: CatalogListener): () => void {
    this.catalogListeners.add(listener);
    this.ensureConnected();

    return () => {
      this.catalogListeners.delete(listener);
      if (
        this.ordersListeners.size === 0 &&
        this.catalogListeners.size === 0 &&
        this.statusListeners.size === 0
      ) {
        this.disconnect();
      }
    };
  }

  private ensureConnected(): void {
    if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
      return;
    }

    this.manualClose = false;
    this.connect();
  }

  private connect(): void {
    this.setConnectionStatus(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

    const ws = new WebSocket(buildWebSocketUrl());
    this.socket = ws;

    ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.setConnectionStatus('connected');
    };

    ws.onmessage = (event: MessageEvent<string>) => {
      const message = this.parseMessage(event.data);
      if (!message) {
        return;
      }

      if (message.channel === 'orders') {
        for (const listener of this.ordersListeners) {
          listener(message.event);
        }
        return;
      }

      if (message.channel === 'users') {
        for (const listener of this.usersListeners) {
          listener(message.event);
        }
        return;
      }

      for (const listener of this.catalogListeners) {
        listener(message.event);
      }
    };

    ws.onerror = () => {
      ws.close();
    };

    ws.onclose = () => {
      if (this.socket === ws) {
        this.socket = null;
      }

      if (
        !this.manualClose &&
        (this.ordersListeners.size > 0 ||
          this.catalogListeners.size > 0 ||
          this.usersListeners.size > 0 ||
          this.statusListeners.size > 0)
      ) {
        this.setConnectionStatus('reconnecting');
        this.scheduleReconnect();
      } else {
        this.setConnectionStatus('disconnected');
      }
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null) {
      return;
    }

    const delayMs = Math.min(1000 * 2 ** this.reconnectAttempts, 10000);
    this.reconnectAttempts += 1;

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      if (
        this.ordersListeners.size > 0 ||
        this.catalogListeners.size > 0 ||
        this.usersListeners.size > 0 ||
        this.statusListeners.size > 0
      ) {
        this.connect();
      } else {
        this.setConnectionStatus('disconnected');
      }
    }, delayMs);
  }

  private disconnect(): void {
    this.manualClose = true;

    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.setConnectionStatus('disconnected');
  }

  private parseMessage(
    raw: string,
  ): OrdersRealtimeMessage | CatalogRealtimeMessage | UsersRealtimeMessage | null {
    try {
      const parsed = JSON.parse(raw) as Partial<
        OrdersRealtimeMessage | CatalogRealtimeMessage | UsersRealtimeMessage
      >;
      if (
        (parsed.channel !== 'orders' &&
          parsed.channel !== 'catalog' &&
          parsed.channel !== 'users') ||
        !parsed.event
      ) {
        return null;
      }

      if (parsed.channel === 'orders') {
        return parsed as OrdersRealtimeMessage;
      }

      if (parsed.channel === 'users') {
        return parsed as UsersRealtimeMessage;
      }

      return parsed as CatalogRealtimeMessage;
    } catch {
      return null;
    }
  }
}

export const realtimeService = new RealtimeService();
