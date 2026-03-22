/**
 * E2E Menu Assembly vs Extra (API-level)
 *
 * Valida que existe item com separacao de montagem e extras,
 * e que ambos podem ser enviados no mesmo item do pedido.
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

function normalizeName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function isBurgerLikeName(name) {
  const value = normalizeName(name);
  return /(hamburg|burger|lanche|sanduiche)/.test(value);
}

async function main() {
  console.log('\n[E2E Menu Assembly/Extra] Inicio');

  const adminToken = await loginAs('admin@sistema.local', 'admin123');
  const runId = Date.now().toString(36);

  const categoriesRes = await req('/api/admin/categories', {
    headers: authHeader(adminToken),
  });
  assertStatus(categoriesRes.status, 200, 'Categorias admin');
  const categoryId = categoriesRes.body?.data?.[0]?.id;
  if (!categoryId) {
    fail('Nao encontrou categoria para montar item E2E de assembly/extra');
  }

  let createdItemId;
  let createdAssemblyAddonId;
  let createdExtraAddonId;
  let createdItemPrice = 0;
  let createdExtraAddonPrice = 0;

  try {
    const assemblyAddonName = `E2E Assembly ${runId}`;
    const extraAddonName = `E2E Extra ${runId}`;

    const createAssemblyAddonRes = await req('/api/admin/addons', {
      method: 'POST',
      headers: { ...authHeader(adminToken), 'content-type': 'application/json' },
      body: JSON.stringify({
        name: assemblyAddonName,
        addonType: 'SUBSTITUTION',
        price: 0,
        isActive: true,
      }),
    });
    assertStatus(createAssemblyAddonRes.status, 201, 'Criar addon ASSEMBLY base');
    createdAssemblyAddonId = createAssemblyAddonRes.body?.data?.id;

    const createExtraAddonRes = await req('/api/admin/addons', {
      method: 'POST',
      headers: { ...authHeader(adminToken), 'content-type': 'application/json' },
      body: JSON.stringify({
        name: extraAddonName,
        addonType: 'EXTRA',
        price: 2.5,
        isActive: true,
      }),
    });
    assertStatus(createExtraAddonRes.status, 201, 'Criar addon EXTRA');
    createdExtraAddonId = createExtraAddonRes.body?.data?.id;
    createdExtraAddonPrice = Number(createExtraAddonRes.body?.data?.price ?? 0);

    if (!createdAssemblyAddonId || !createdExtraAddonId) {
      fail('Falha ao criar addons temporarios de teste');
    }

    const createItemRes = await req('/api/menu', {
      method: 'POST',
      headers: { ...authHeader(adminToken), 'content-type': 'application/json' },
      body: JSON.stringify({
        categoryId,
        name: `E2E Burger Split ${runId}`,
        description: 'Item de teste para separacao de montagem e extras',
        price: 20,
        isAvailable: true,
        displayOrder: Number.parseInt(String(Date.now()).slice(-5), 10),
        assemblyAddonIds: [createdAssemblyAddonId],
        extraAddonIds: [createdExtraAddonId],
      }),
    });
    assertStatus(createItemRes.status, 201, 'Criar item com assembly + extra');
    createdItemId = createItemRes.body?.data?.id;
    createdItemPrice = Number(createItemRes.body?.data?.price ?? 0);

    if (!createdItemId) {
      fail('Falha ao criar item temporario para teste assembly/extra');
    }

    const itemAddonsRes = await req(`/api/menu/${createdItemId}/addons`);
    assertStatus(itemAddonsRes.status, 200, 'Listar addons do item temporario');

    const itemAddons = parseDataArray(itemAddonsRes.body);
    const assembly = itemAddons.filter((addon) => addon.assignmentType === 'ASSEMBLY');
    const extras = itemAddons.filter((addon) => addon.assignmentType === 'EXTRA');

    if (assembly.length === 0 || extras.length === 0) {
      fail('Item temporario nao retornou separacao correta ASSEMBLY/EXTRA no endpoint');
    }

    const createOrderRes = await req('/api/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        customerName: 'E2E Assembly Extra Split',
        notes: 'Validacao automatizada de separacao montagem vs extras',
        items: [
          {
            menuItemId: createdItemId,
            quantity: 1,
            addons: [
              { addonId: createdAssemblyAddonId, quantity: 1 },
              { addonId: createdExtraAddonId, quantity: 1 },
            ],
          },
        ],
      }),
    });

    assertStatus(createOrderRes.status, 201, 'Criacao de pedido com montagem + extra');
    assertShape(createOrderRes.body?.data, ['id', 'finalPrice', 'items'], 'Contrato pedido criado');

    const createdOrder = createOrderRes.body.data;
    const firstItem = createdOrder.items?.[0];
    if (!firstItem) {
      fail('Pedido criado sem item na resposta');
    }

    const createdAddonIds = (firstItem.addons ?? []).map((addon) => addon.addonId);
    if (!createdAddonIds.includes(createdAssemblyAddonId)) {
      fail('Addon de montagem nao foi aplicado no item do pedido');
    }

    if (!createdAddonIds.includes(createdExtraAddonId)) {
      fail('Addon extra nao foi aplicado no item do pedido');
    }

    const expectedMinimum = createdItemPrice + createdExtraAddonPrice;
    if (Number(createdOrder.finalPrice) + 0.001 < expectedMinimum) {
      fail(
        `Total final menor que o esperado para incluir extra: esperado minimo ${expectedMinimum.toFixed(
          2,
        )}, recebido ${Number(createdOrder.finalPrice).toFixed(2)}`,
      );
    }
  } finally {
    if (createdItemId) {
      await req(`/api/admin/menu/${createdItemId}`, {
        method: 'DELETE',
        headers: authHeader(adminToken),
      });
    }

    if (createdAssemblyAddonId) {
      await req(`/api/admin/addons/${createdAssemblyAddonId}`, {
        method: 'DELETE',
        headers: authHeader(adminToken),
      });
    }

    if (createdExtraAddonId) {
      await req(`/api/admin/addons/${createdExtraAddonId}`, {
        method: 'DELETE',
        headers: authHeader(adminToken),
      });
    }
  }

  console.log('[E2E Menu Assembly/Extra] Validado com sucesso\n');
}

main().catch((error) => {
  console.error(`\n[E2E Menu Assembly/Extra] Falha: ${error.message}`);
  process.exit(1);
});
