/**
 * E2E Delivery Persisted Flow (API-level)
 *
 * Valida o fluxo persistido de delivery:
 * - cria pedido
 * - READY -> sync para fila delivery
 * - atribui entregador/rota
 * - DISPATCHED -> IN_ROUTE -> DELIVERED
 * - valida historico e fechamento do pedido
 */

const {
  req,
  fail,
  assertStatus,
  assertShape,
  authHeader,
  loginAs,
  parseDataArray,
} = require('./e2e-utils');

async function main() {
  console.log('\n[E2E Delivery Persisted] Inicio');

  const token = await loginAs('admin@sistema.local', 'admin123');

  const categoriesRes = await req('/api/admin/categories', {
    headers: authHeader(token),
  });
  assertStatus(categoriesRes.status, 200, 'Categorias admin');

  const categoryId = categoriesRes.body?.data?.[0]?.id;
  if (!categoryId) {
    fail('Nao encontrou categoria para criar item de teste');
  }

  const runId = Date.now().toString(36);
  const runOrder = Number.parseInt(String(Date.now()).slice(-5), 10);

  const createItemRes = await req('/api/menu', {
    method: 'POST',
    headers: { ...authHeader(token), 'content-type': 'application/json' },
    body: JSON.stringify({
      categoryId,
      name: `E2E Delivery Item ${runId}`,
      description: 'Item auxiliar para fluxo persistido de delivery',
      price: 17.9,
      displayOrder: runOrder,
      isAvailable: true,
      addonIds: [],
    }),
  });
  assertStatus(createItemRes.status, 201, 'Criacao de item para teste');

  const menuItemId = createItemRes.body?.data?.id;
  if (!menuItemId) {
    fail('Item de teste nao foi criado');
  }

  const createOrderRes = await req('/api/orders', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      customerName: `E2E Delivery ${runId}`,
      notes: 'Pedido para validar fluxo persistido de delivery',
      items: [{ menuItemId, quantity: 1, addons: [] }],
    }),
  });
  assertStatus(createOrderRes.status, 201, 'Criacao de pedido');
  assertShape(createOrderRes.body?.data, ['id', 'orderNumber', 'status'], 'Pedido criado');

  const orderId = createOrderRes.body.data.id;

  const moveOrderStatus = async (status) => {
    const res = await req(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { ...authHeader(token), 'content-type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    assertStatus(res.status, 200, `Atualizar pedido para ${status}`);
  };

  await moveOrderStatus('CONFIRMED');
  await moveOrderStatus('PREPARING');
  await moveOrderStatus('READY');

  const syncRes = await req('/api/delivery/queue/from-ready', {
    method: 'POST',
    headers: authHeader(token),
  });
  assertStatus(syncRes.status, 200, 'Sincronizar fila delivery');

  const queue = parseDataArray(syncRes.body);
  const createdDelivery = queue.find((entry) => entry.orderId === orderId);
  if (!createdDelivery) {
    fail('Entrega nao foi criada para pedido READY');
  }

  const courierRes = await req('/api/delivery/couriers', {
    method: 'POST',
    headers: { ...authHeader(token), 'content-type': 'application/json' },
    body: JSON.stringify({
      name: `E2E Courier ${runId}`,
      zone: 'CENTRO',
      phone: '11999990000',
      isActive: true,
    }),
  });
  assertStatus(courierRes.status, 201, 'Criar entregador');
  const courierId = courierRes.body?.data?.id;
  if (!courierId) {
    fail('Entregador nao foi criado');
  }

  const routeRes = await req('/api/delivery/routes', {
    method: 'POST',
    headers: { ...authHeader(token), 'content-type': 'application/json' },
    body: JSON.stringify({
      name: `E2E Route ${runId}`,
      zone: 'CENTRO',
      isActive: true,
    }),
  });
  assertStatus(routeRes.status, 201, 'Criar rota');
  const routeId = routeRes.body?.data?.id;
  if (!routeId) {
    fail('Rota nao foi criada');
  }

  const assignRes = await req(`/api/delivery/${createdDelivery.id}/assign`, {
    method: 'PATCH',
    headers: { ...authHeader(token), 'content-type': 'application/json' },
    body: JSON.stringify({
      courierId,
      routeId,
      priority: 4,
    }),
  });
  assertStatus(assignRes.status, 200, 'Atribuir entrega');

  const transitionStatus = async (status) => {
    const res = await req(`/api/delivery/${createdDelivery.id}/status`, {
      method: 'PATCH',
      headers: { ...authHeader(token), 'content-type': 'application/json' },
      body: JSON.stringify({ status, reason: `E2E transition ${status}` }),
    });
    assertStatus(res.status, 200, `Atualizar delivery para ${status}`);
    if (res.body?.data?.status !== status) {
      fail(`Status de delivery esperado ${status}, recebido ${res.body?.data?.status}`);
    }
    return res.body?.data;
  };

  await transitionStatus('DISPATCHED');
  await transitionStatus('IN_ROUTE');
  const delivered = await transitionStatus('DELIVERED');

  const historyStatuses = (delivered?.history ?? []).map((entry) => entry.toStatus);
  const expectedHistoryStatuses = ['QUEUED', 'ASSIGNED', 'DISPATCHED', 'IN_ROUTE', 'DELIVERED'];
  for (const status of expectedHistoryStatuses) {
    if (!historyStatuses.includes(status)) {
      fail(`Historico de delivery sem status ${status}`);
    }
  }

  const deliveredListRes = await req(`/api/delivery/queue?status=DELIVERED&courierId=${courierId}`, {
    headers: authHeader(token),
  });
  assertStatus(deliveredListRes.status, 200, 'Listar entregas entregues por entregador');
  const deliveredList = parseDataArray(deliveredListRes.body);
  const deliveredInList = deliveredList.some((entry) => entry.id === createdDelivery.id);
  if (!deliveredInList) {
    fail('Entrega entregue nao encontrada em filtro por status/courier');
  }

  const orderDetailsRes = await req(`/api/orders/${orderId}`, {
    headers: authHeader(token),
  });
  assertStatus(orderDetailsRes.status, 200, 'Buscar pedido apos entrega');
  if (orderDetailsRes.body?.data?.status !== 'COMPLETED') {
    fail(
      `Pedido deveria finalizar como COMPLETED apos DELIVERED, recebido ${orderDetailsRes.body?.data?.status}`,
    );
  }

  const cleanupRes = await req(`/api/admin/menu/${menuItemId}`, {
    method: 'DELETE',
    headers: authHeader(token),
  });
  assertStatus(cleanupRes.status, 200, 'Limpeza do item de teste');

  console.log('[E2E Delivery Persisted] Fluxo validado com sucesso\n');
}

main().catch((error) => {
  console.error(`\n[E2E Delivery Persisted] Falha: ${error.message}`);
  process.exit(1);
});
