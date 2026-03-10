const base = 'http://localhost:3001';

const results = [];
const add = (test, status, ok, detail) => results.push({ test, status, ok, detail });

async function req(path, opt = {}) {
  const response = await fetch(base + path, opt);
  const bodyText = await response.text();
  let body = null;

  try {
    body = JSON.parse(bodyText);
  } catch {
    body = null;
  }

  return { status: response.status, body };
}

function calcExpectedTotal(payload, menuItem, combo, addon) {
  const menuBase = menuItem.price + addon.price * payload.items[0].addons[0].quantity;
  const menuLine = menuBase * payload.items[0].quantity;
  const comboLine = combo.price * payload.items[1].quantity;
  return Math.round((menuLine + comboLine) * 100) / 100;
}

async function main() {
  let staffToken = '';
  let orderId = '';

  const login = await req('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'staff@sistema.local', password: 'staff123' }),
  });

  staffToken = login.body?.token || '';
  add('Orders login staff', login.status, login.status === 200 && Boolean(staffToken), 'token ok');

  const menuResponse = await req('/api/menu');
  const comboResponse = await req('/api/combos');
  const menuItem = (menuResponse.body?.data || []).find((item) => item.name === 'Classic Burger');
  const combo = (comboResponse.body?.data || []).find((item) => item.name === 'Combo Classico');

  add('Orders carregar menu e combos', 200, Boolean(menuItem && combo), 'dados base encontrados');

  const itemDetail = await req('/api/menu/' + menuItem.id);
  const addon = itemDetail.body?.data?.addons?.[0]?.addon;
  add('Orders obter addon permitido', itemDetail.status, itemDetail.status === 200 && Boolean(addon), 'addon disponivel');

  const createPayload = {
    customerName: 'Cliente Teste',
    customerPhone: '11999990000',
    notes: 'pedido teste fase2',
    items: [
      {
        menuItemId: menuItem.id,
        quantity: 2,
        addons: [{ addonId: addon.id, quantity: 1 }],
      },
      {
        comboId: combo.id,
        quantity: 1,
        addons: [],
      },
    ],
  };

  const expectedTotal = calcExpectedTotal(createPayload, menuItem, combo, addon);

  const createdOrder = await req('/api/orders', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(createPayload),
  });

  orderId = createdOrder.body?.data?.id || '';
  const createdFinalPrice = createdOrder.body?.data?.finalPrice;
  add('Orders criar pedido com adicionais', createdOrder.status, createdOrder.status === 201 && Boolean(orderId), 'pedido criado');
  add('Orders total calculado', createdOrder.status, createdFinalPrice === expectedTotal, `esperado=${expectedTotal} recebido=${createdFinalPrice}`);

  const headers = { authorization: 'Bearer ' + staffToken };

  const listOrders = await req('/api/orders', { headers });
  const orderInList = (listOrders.body?.data || []).find((order) => order.id === orderId);
  add('Orders listar inclui novo', listOrders.status, listOrders.status === 200 && Boolean(orderInList), 'pedido encontrado na listagem');

  const updateToConfirmed = await req('/api/orders/' + orderId + '/status', {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer ' + staffToken,
    },
    body: JSON.stringify({ status: 'CONFIRMED', reason: 'pedido confirmado no balcao' }),
  });

  const confirmedHistory = updateToConfirmed.body?.data?.statusHistory || [];
  const hasConfirmedHistory = confirmedHistory.some((h) => h.toStatus === 'CONFIRMED');

  add('Orders atualizar status', updateToConfirmed.status, updateToConfirmed.status === 200 && updateToConfirmed.body?.data?.status === 'CONFIRMED', 'status atualizado');
  add('Orders registrar historico', updateToConfirmed.status, hasConfirmedHistory, 'historico com CONFIRMED');

  const details = await req('/api/orders/' + orderId, { headers });
  const detailItemsCount = details.body?.data?.items?.length || 0;
  add('Orders buscar detalhes', details.status, details.status === 200 && detailItemsCount === 2, `items=${detailItemsCount}`);

  const failed = results.filter((r) => !r.ok);
  console.log(JSON.stringify({ total: results.length, passed: results.length - failed.length, failed: failed.length, results }, null, 2));

  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
