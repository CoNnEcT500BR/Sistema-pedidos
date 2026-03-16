/**
 * E2E Admin Orders Board (API-level)
 *
 * Valida o fluxo de status que alimenta o drag-and-drop do quadro de pedidos:
 * - login admin
 * - cria pedido
 * - PENDING -> CONFIRMED -> PREPARING -> READY -> COMPLETED
 * - valida listagens por status durante o fluxo
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

function authHeader(token) {
  return {
    authorization: `Bearer ${token}`,
  };
}

async function main() {
  console.log('\n[E2E Admin Orders] Inicio');

  const loginRes = await req('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@sistema.local',
      password: 'admin123',
    }),
  });
  assertStatus(loginRes.status, 200, 'Login admin');

  const token = loginRes.body?.token;
  if (!token) fail('Token admin ausente');

  const categoriesRes = await req('/api/admin/categories', {
    headers: authHeader(token),
  });
  assertStatus(categoriesRes.status, 200, 'Categorias admin');

  const categoryId = categoriesRes.body?.data?.[0]?.id;
  if (!categoryId) fail('Nao encontrou categoria para criar item de teste');

  const runId = Date.now().toString(36);
  const runOrder = Number.parseInt(String(Date.now()).slice(-5), 10);

  const createItemRes = await req('/api/menu', {
    method: 'POST',
    headers: { ...authHeader(token), 'content-type': 'application/json' },
    body: JSON.stringify({
      categoryId,
      name: `E2E Board Item ${runId}`,
      description: 'Item auxiliar para teste do quadro de pedidos',
      price: 19.9,
      displayOrder: runOrder,
      isAvailable: true,
      addonIds: [],
    }),
  });
  assertStatus(createItemRes.status, 201, 'Criacao de item para teste');

  const menuItemId = createItemRes.body?.data?.id;
  if (!menuItemId) fail('Item de teste nao foi criado');

  const createOrderRes = await req('/api/orders', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      customerName: `E2E Admin Board ${runId}`,
      notes: 'Pedido para validar board admin',
      items: [
        {
          menuItemId,
          quantity: 1,
          addons: [],
        },
      ],
    }),
  });
  assertStatus(createOrderRes.status, 201, 'Criacao de pedido');

  const orderId = createOrderRes.body?.data?.id;
  if (!orderId) fail('Pedido de teste nao foi criado');

  const updateStatus = async (status, label) => {
    const res = await req(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { ...authHeader(token), 'content-type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    assertStatus(res.status, 200, label);
    if (res.body?.data?.status !== status) {
      fail(`${label}: status esperado ${status}, recebido ${res.body?.data?.status}`);
    }
  };

  const assertOrderInList = async (status, label) => {
    const res = await req(`/api/orders?status=${status}`, {
      headers: authHeader(token),
    });
    assertStatus(res.status, 200, label);

    const found = (res.body?.data ?? []).some((order) => order.id === orderId);
    if (!found) {
      fail(`${label}: pedido nao encontrado em ${status}`);
    }
  };

  await updateStatus('CONFIRMED', 'Mover para CONFIRMED');
  await updateStatus('PREPARING', 'Mover para PREPARING');
  await assertOrderInList('PREPARING', 'Validar lista PREPARING');

  await updateStatus('READY', 'Mover para READY');
  await assertOrderInList('READY', 'Validar lista READY');

  await updateStatus('COMPLETED', 'Mover para COMPLETED');
  await assertOrderInList('COMPLETED', 'Validar lista COMPLETED');

  const cleanupRes = await req(`/api/admin/menu/${menuItemId}`, {
    method: 'DELETE',
    headers: authHeader(token),
  });
  assertStatus(cleanupRes.status, 200, 'Limpeza do item de teste');

  console.log('[E2E Admin Orders] Fluxo de board validado com sucesso\n');
}

main().catch((error) => {
  console.error(`\n[E2E Admin Orders] Falha: ${error.message}`);
  process.exit(1);
});
