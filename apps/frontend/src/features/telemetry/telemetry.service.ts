import { apiClient } from '@/services/api.service';

export type KioskTelemetryEventName =
  | 'screen_view'
  | 'category_selected'
  | 'item_modal_opened'
  | 'combo_modal_opened'
  | 'item_added_to_cart'
  | 'combo_added_to_cart'
  | 'cart_viewed'
  | 'checkout_started'
  | 'order_submit_attempt'
  | 'order_submit_success'
  | 'order_submit_failed'
  | 'new_order_started';

interface TelemetryEvent {
  event: KioskTelemetryEventName;
  timestamp: string;
  sessionId: string;
  path: string;
  metadata?: Record<string, unknown>;
}

const STORAGE_KEY = 'kiosk_telemetry_events_v1';
const SESSION_KEY = 'kiosk_telemetry_session_v1';
const MAX_STORED_EVENTS = 200;

function getSessionId(): string {
  const existing = sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;

  const generated = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  sessionStorage.setItem(SESSION_KEY, generated);
  return generated;
}

function getStoredEvents(): TelemetryEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function storeEvent(event: TelemetryEvent): void {
  const all = getStoredEvents();
  all.push(event);

  if (all.length > MAX_STORED_EVENTS) {
    all.splice(0, all.length - MAX_STORED_EVENTS);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function trackKioskEvent(
  event: KioskTelemetryEventName,
  metadata?: Record<string, unknown>,
): void {
  const payload: TelemetryEvent = {
    event,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    path: window.location.pathname,
    metadata,
  };

  storeEvent(payload);

  void apiClient.post('/api/telemetry/events', payload).catch(() => {
    // Nao interromper a jornada do kiosk por falha de telemetria.
  });
}
