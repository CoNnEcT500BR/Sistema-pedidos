/**
 * E2E Critico do Kiosk (API-level)
 *
 * Cobre o fluxo principal:
 * - carregar categorias
 * - carregar itens da categoria
 * - carregar addons do item
 * - carregar combos
 * - criar pedido com item + combo
 * - validar total retornado
 * - enviar evento de telemetria
 * - validar ingestao de telemetria
 */

const BASE = process.env.E2E_API_BASE || 'http://localhost:3001';

function fail(message) {
  throw new Error(message);
}

async function req(path, options = {}) {
  const response = await fetch(BASE + path, options);
  const text = await response.text();
  let body = null;

  try {
    body = JSON.parse(text);
  } catch {
    body = null;
  }

  return { status: response.status, body };
}

function assertStatus(actual, expected, label) {
  if (actual !== expected) {
    fail(`${label}: esperado HTTP ${expected}, recebido ${actual}`);
  }
}

function parseTotal(order) {
  if (typeof order?.totalPrice === 'number') return order.totalPrice;
  if (typeof order?.finalPrice === 'number') return order.finalPrice;
  return NaN;
}

async function main() {
  console.log('\n[E2E] Inicio do fluxo critico do kiosk');

  const categoriesRes = await req('/api/categories');
  assertStatus(categoriesRes.status, 200, 'Categorias');
  const categories = categoriesRes.body?.data ?? [];
  if (!Array.isArray(categories) || categories.length === 0) {
    fail('Categorias: lista vazia');
  }

  const nonComboCategory = categories.find(
    (c) => !String(c?.name ?? '').toLowerCase().includes('combo'),
  );
  if (!nonComboCategory) {
    fail('Nenhuma categoria nao-combo encontrada');
  }
  console.log(`[E2E] Categoria: ${nonComboCategory.name}`);

  const menuRes = await req(`/api/menu?category=${nonComboCategory.id}`);
  assertStatus(menuRes.status, 200, 'Itens por categoria');
  const availableItems = (menuRes.body?.data ?? []).filter((item) => item.isAvailable);
  if (availableItems.length === 0) {
    fail('Nenhum item disponivel na categoria selecionada');
  }

  const item = availableItems[0];
  console.log(`[E2E] Item: ${item.name}`);

  const addonsRes = await req(`/api/menu/${item.id}/addons`);
  assertStatus(addonsRes.status, 200, 'Addons do item');
  const addons = addonsRes.body?.data ?? [];

  const combosRes = await req('/api/combos');
  assertStatus(combosRes.status, 200, 'Combos');
  const combos = (combosRes.body?.data ?? []).filter((combo) => combo.isActive);

  const payload = {
    customerName: 'E2E Kiosk Critical Flow',
    notes: 'Pedido automatizado de validacao E2E',
    items: [
      {
        menuItemId: item.id,
        quantity: 1,
        addons: addons.length > 0 ? [{ addonId: addons[0].id, quantity: 1 }] : [],
      },
    ],
  };

  if (combos.length > 0) {
    payload.items.push({
      comboId: combos[0].id,
      quantity: 1,
      addons: [],
    });
    console.log(`[E2E] Combo: ${combos[0].name}`);
  }

  const createOrderRes = await req('/api/orders', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  assertStatus(createOrderRes.status, 201, 'Criacao de pedido');

  const createdOrder = createOrderRes.body?.data;
  if (!createdOrder?.id || !createdOrder?.orderNumber) {
    fail('Pedido criado sem id/orderNumber');
  }

  const total = parseTotal(createdOrder);
  if (Number.isNaN(total) || total <= 0) {
    fail('Pedido criado com total invalido');
  }

  console.log(`[E2E] Pedido criado: #${createdOrder.orderNumber} | Total: ${total.toFixed(2)}`);

  const telemetryEvent = {
    event: 'screen_view',
    timestamp: new Date().toISOString(),
    sessionId: `e2e-${Date.now()}`,
    path: '/kiosk/menu',
    metadata: {
      source: 'e2e-kiosk-critical-flow',
      orderNumber: createdOrder.orderNumber,
    },
  };

  const telemetryPostRes = await req('/api/telemetry/events', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(telemetryEvent),
  });
  assertStatus(telemetryPostRes.status, 202, 'Ingestao de telemetria');

  const telemetryListRes = await req('/api/telemetry/events');
  assertStatus(telemetryListRes.status, 200, 'Listagem de telemetria');

  const telemetryEvents = telemetryListRes.body?.data?.events ?? [];
  const found = telemetryEvents.some((event) => event.sessionId === telemetryEvent.sessionId);
  if (!found) {
    fail('Evento de telemetria nao encontrado apos ingestao');
  }

  console.log('[E2E] Telemetria validada com sucesso');
  console.log('[E2E] Fluxo critico validado com sucesso\n');
}

main().catch((error) => {
  console.error(`\n[E2E] Falha: ${error.message}`);
  process.exit(1);
});
