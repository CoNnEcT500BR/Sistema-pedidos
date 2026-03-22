const {
  req,
  assertStatus,
  assertStatusIn,
  authHeader,
  loginAs,
  parseDataArray,
} = require('./e2e-utils');

async function pickOrderContext() {
  const menuRes = await req('/api/menu');
  assertStatus(menuRes.status, 200, 'Menu para negativos');
  const menu = parseDataArray(menuRes.body).filter((item) => item.isAvailable);
  if (menu.length === 0) {
    throw new Error('Nao encontrou item disponivel para cenarios negativos');
  }

  for (const candidate of menu) {
    const addonsRes = await req(`/api/menu/${candidate.id}/addons`);
    assertStatus(addonsRes.status, 200, 'Addons por item para negativos');
    const allowedAddons = parseDataArray(addonsRes.body);
    if (allowedAddons.length > 0) {
      const addonsResAll = await req('/api/addons');
      assertStatus(addonsResAll.status, 200, 'Catalogo addons para negativos');
      const allAddons = parseDataArray(addonsResAll.body);
      const notAllowedAddon = allAddons.find(
        (addon) => !allowedAddons.some((allowed) => allowed.id === addon.id),
      );

      if (notAllowedAddon) {
        return {
          item: candidate,
          allowedAddon: allowedAddons[0],
          notAllowedAddon,
        };
      }
    }
  }

  throw new Error('Nao encontrou contexto com addon permitido e nao permitido');
}

async function main() {
  console.log('\n[E2E Negative Orders] Inicio');

  const adminToken = await loginAs('admin@sistema.local', 'admin123');
  const context = await pickOrderContext();

  const duplicatedAddon = await req('/api/orders', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      customerName: 'E2E Duplicate Addon',
      items: [
        {
          menuItemId: context.item.id,
          quantity: 1,
          addons: [
            { addonId: context.allowedAddon.id, quantity: 1 },
            { addonId: context.allowedAddon.id, quantity: 1 },
          ],
        },
      ],
    }),
  });
  assertStatus(duplicatedAddon.status, 400, 'Orders com addon duplicado');

  const disallowedAddon = await req('/api/orders', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      customerName: 'E2E Disallowed Addon',
      items: [
        {
          menuItemId: context.item.id,
          quantity: 1,
          addons: [{ addonId: context.notAllowedAddon.id, quantity: 1 }],
        },
      ],
    }),
  });
  assertStatus(disallowedAddon.status, 400, 'Orders com addon nao permitido');

  const missingItem = await req('/api/orders', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      customerName: 'E2E Missing Item',
      items: [
        {
          menuItemId: 'item-inexistente',
          quantity: 1,
          addons: [],
        },
      ],
    }),
  });
  assertStatusIn(missingItem.status, [400, 404], 'Orders com item inexistente');

  const createValidOrder = await req('/api/orders', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      customerName: 'E2E Invalid Transition',
      items: [
        {
          menuItemId: context.item.id,
          quantity: 1,
          addons: [],
        },
      ],
    }),
  });
  assertStatus(createValidOrder.status, 201, 'Criacao pedido base para transicao invalida');

  const orderId = createValidOrder.body?.data?.id;
  if (!orderId) {
    throw new Error('Pedido base sem id');
  }

  const invalidTransition = await req(`/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      ...authHeader(adminToken),
      'content-type': 'application/json',
    },
    body: JSON.stringify({ status: 'READY' }),
  });
  assertStatus(invalidTransition.status, 400, 'Transicao invalida PENDING -> READY');

  console.log('[E2E Negative Orders] Validado com sucesso\n');
}

main().catch((error) => {
  console.error(`\n[E2E Negative Orders] Falha: ${error.message}`);
  process.exit(1);
});
