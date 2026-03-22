const {
  req,
  assertStatus,
  assertStatusIn,
  assertShape,
  authHeader,
  loginAs,
  parseDataArray,
} = require('./e2e-utils');

async function createOrderWithItem(menuItemId, customerName) {
  const created = await req('/api/orders', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      customerName,
      notes: 'Contrato Orders',
      items: [
        {
          menuItemId,
          quantity: 1,
          addons: [],
        },
      ],
    }),
  });

  assertStatus(created.status, 201, 'Criacao de pedido para contrato');
  assertShape(created.body?.data, ['id', 'orderNumber', 'status', 'createdAt'], 'Contrato create order');
  return created.body.data;
}

async function main() {
  console.log('\n[E2E Contract Orders] Inicio');

  const adminToken = await loginAs('admin@sistema.local', 'admin123');

  const listWithoutToken = await req('/api/orders');
  assertStatus(listWithoutToken.status, 401, 'Orders list sem token');

  const badStatusQuery = await req('/api/orders?status=INVALID', {
    headers: authHeader(adminToken),
  });
  assertStatus(badStatusQuery.status, 400, 'Orders list query invalida');

  const menu = await req('/api/menu');
  assertStatus(menu.status, 200, 'Menu publico para contrato orders');
  const firstItem = parseDataArray(menu.body).find((item) => item.isAvailable);
  if (!firstItem) {
    throw new Error('Nao encontrou item disponivel para criar pedido de contrato');
  }

  const order = await createOrderWithItem(firstItem.id, 'E2E Contract Orders');

  const listWithToken = await req('/api/orders?limit=5&offset=0', {
    headers: authHeader(adminToken),
  });
  assertStatus(listWithToken.status, 200, 'Orders list com token');
  const listData = parseDataArray(listWithToken.body);
  const createdInList = listData.some((entry) => entry.id === order.id);
  if (!createdInList) {
    throw new Error('Pedido criado nao apareceu na listagem de pedidos');
  }

  const detail = await req(`/api/orders/${order.id}`, {
    headers: authHeader(adminToken),
  });
  assertStatus(detail.status, 200, 'Order detail');
  assertShape(detail.body?.data, ['id', 'status', 'items', 'statusHistory'], 'Contrato order detail');

  const notFound = await req('/api/orders/order-inexistente', {
    headers: authHeader(adminToken),
  });
  assertStatus(notFound.status, 404, 'Order detail inexistente');

  const invalidTransition = await req(`/api/orders/${order.id}/status`, {
    method: 'PATCH',
    headers: {
      ...authHeader(adminToken),
      'content-type': 'application/json',
    },
    body: JSON.stringify({ status: 'READY' }),
  });
  assertStatus(invalidTransition.status, 400, 'Order transition invalida');

  const moveConfirmed = await req(`/api/orders/${order.id}/status`, {
    method: 'PATCH',
    headers: {
      ...authHeader(adminToken),
      'content-type': 'application/json',
    },
    body: JSON.stringify({ status: 'CONFIRMED' }),
  });
  assertStatus(moveConfirmed.status, 200, 'Order transition para CONFIRMED');

  const movePreparing = await req(`/api/orders/${order.id}/status`, {
    method: 'PATCH',
    headers: {
      ...authHeader(adminToken),
      'content-type': 'application/json',
    },
    body: JSON.stringify({ status: 'PREPARING' }),
  });
  assertStatus(movePreparing.status, 200, 'Order transition para PREPARING');

  const moveReady = await req(`/api/orders/${order.id}/status`, {
    method: 'PATCH',
    headers: {
      ...authHeader(adminToken),
      'content-type': 'application/json',
    },
    body: JSON.stringify({ status: 'READY' }),
  });
  assertStatus(moveReady.status, 200, 'Order transition para READY');

  const invalidBackward = await req(`/api/orders/${order.id}/status`, {
    method: 'PATCH',
    headers: {
      ...authHeader(adminToken),
      'content-type': 'application/json',
    },
    body: JSON.stringify({ status: 'PENDING' }),
  });
  assertStatusIn(invalidBackward.status, [400, 422], 'Order transicao regressiva invalida');

  console.log('[E2E Contract Orders] Validado com sucesso\n');
}

main().catch((error) => {
  console.error(`\n[E2E Contract Orders] Falha: ${error.message}`);
  process.exit(1);
});
