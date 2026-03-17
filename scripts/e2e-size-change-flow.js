/**
 * E2E SIZE_CHANGE (API-level)
 *
 * Valida a regra de alteracao de tamanho para bebida e batata:
 * - confere addons SIZE_CHANGE existentes
 * - confere se estao permitidos no item alvo
 * - cria pedido de bebida com sabor + SIZE_CHANGE
 * - cria pedido de batata com SIZE_CHANGE
 * - valida total calculado
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

function assertClose(actual, expected, label) {
  const delta = Math.abs(actual - expected);
  if (delta > 0.001) {
    fail(`${label}: esperado ${expected.toFixed(2)}, recebido ${actual.toFixed(2)}`);
  }
}

function findByName(list, name, label) {
  const found = list.find((entry) => entry?.name === name);
  if (!found) fail(`${label}: nao encontrado (${name})`);
  return found;
}

async function main() {
  console.log('\n[E2E SIZE_CHANGE] Inicio');

  const menuRes = await req('/api/menu');
  assertStatus(menuRes.status, 200, 'Listagem de menu');

  const addonsRes = await req('/api/addons');
  assertStatus(addonsRes.status, 200, 'Listagem de addons');

  const menu = menuRes.body?.data ?? [];
  const addons = addonsRes.body?.data ?? [];

  const refriP = findByName(menu, 'Refrigerante P', 'Item bebida');
  const refriM = findByName(menu, 'Refrigerante M', 'Item bebida medio');
  const refriG = findByName(menu, 'Refrigerante G', 'Item bebida grande');
  const batataP = findByName(menu, 'Batata Frita P', 'Item batata');
  const batataM = findByName(menu, 'Batata Frita M', 'Item batata media');
  const batataG = findByName(menu, 'Batata Frita G', 'Item batata grande');

  const saborCola = findByName(addons, 'Sabor Cola', 'Addon sabor');
  const upBebidaM = findByName(addons, 'Upgrade Bebida para M', 'Addon size bebida');
  const upBebidaG = findByName(addons, 'Upgrade Bebida para G', 'Addon size bebida G');
  const upBatataM = findByName(addons, 'Upgrade Batata para M', 'Addon size batata');
  const upBatataG = findByName(addons, 'Upgrade Batata para G', 'Addon size batata G');

  if (upBebidaM.addonType !== 'SIZE_CHANGE') {
    fail(`Upgrade Bebida para M com addonType invalido: ${upBebidaM.addonType}`);
  }
  if (upBatataM.addonType !== 'SIZE_CHANGE') {
    fail(`Upgrade Batata para M com addonType invalido: ${upBatataM.addonType}`);
  }

  const refriAddonsRes = await req(`/api/menu/${refriP.id}/addons`);
  assertStatus(refriAddonsRes.status, 200, 'Addons da bebida');
  const refriAllowedAddons = refriAddonsRes.body?.data ?? [];
  const hasRefriSizeChange = refriAllowedAddons.some((addon) => addon.id === upBebidaM.id);
  if (!hasRefriSizeChange) {
    fail('Upgrade Bebida para M nao esta permitido em Refrigerante P');
  }

  const batataAddonsRes = await req(`/api/menu/${batataP.id}/addons`);
  assertStatus(batataAddonsRes.status, 200, 'Addons da batata');
  const batataAllowedAddons = batataAddonsRes.body?.data ?? [];
  const hasBatataSizeChange = batataAllowedAddons.some((addon) => addon.id === upBatataM.id);
  if (!hasBatataSizeChange) {
    fail('Upgrade Batata para M nao esta permitido em Batata Frita P');
  }

  const refriMAddonsRes = await req(`/api/menu/${refriM.id}/addons`);
  assertStatus(refriMAddonsRes.status, 200, 'Addons da bebida M');
  const refriMAllowedAddons = refriMAddonsRes.body?.data ?? [];
  if (refriMAllowedAddons.some((addon) => addon.id === upBebidaM.id)) {
    fail('Refrigerante M nao deveria permitir Upgrade Bebida para M');
  }
  if (!refriMAllowedAddons.some((addon) => addon.id === upBebidaG.id)) {
    fail('Refrigerante M deveria permitir Upgrade Bebida para G');
  }

  const refriGAddonsRes = await req(`/api/menu/${refriG.id}/addons`);
  assertStatus(refriGAddonsRes.status, 200, 'Addons da bebida G');
  const refriGAllowedAddons = refriGAddonsRes.body?.data ?? [];
  if (refriGAllowedAddons.some((addon) => addon.id === upBebidaM.id || addon.id === upBebidaG.id)) {
    fail('Refrigerante G nao deveria permitir upgrades de bebida');
  }

  const batataMAddonsRes = await req(`/api/menu/${batataM.id}/addons`);
  assertStatus(batataMAddonsRes.status, 200, 'Addons da batata M');
  const batataMAllowedAddons = batataMAddonsRes.body?.data ?? [];
  if (batataMAllowedAddons.some((addon) => addon.id === upBatataM.id)) {
    fail('Batata Frita M nao deveria permitir Upgrade Batata para M');
  }
  if (!batataMAllowedAddons.some((addon) => addon.id === upBatataG.id)) {
    fail('Batata Frita M deveria permitir Upgrade Batata para G');
  }

  const batataGAddonsRes = await req(`/api/menu/${batataG.id}/addons`);
  assertStatus(batataGAddonsRes.status, 200, 'Addons da batata G');
  const batataGAllowedAddons = batataGAddonsRes.body?.data ?? [];
  if (batataGAllowedAddons.some((addon) => addon.id === upBatataM.id || addon.id === upBatataG.id)) {
    fail('Batata Frita G nao deveria permitir upgrades de batata');
  }

  const drinkExpectedTotal = refriP.price + saborCola.price + upBebidaM.price;
  const drinkOrderRes = await req('/api/orders', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      customerName: 'E2E SIZE_CHANGE Bebida',
      notes: 'Teste automatizado SIZE_CHANGE bebida',
      items: [
        {
          menuItemId: refriP.id,
          quantity: 1,
          addons: [
            { addonId: saborCola.id, quantity: 1 },
            { addonId: upBebidaM.id, quantity: 1 },
          ],
        },
      ],
    }),
  });
  assertStatus(drinkOrderRes.status, 201, 'Criacao pedido bebida com SIZE_CHANGE');

  const drinkOrder = drinkOrderRes.body?.data;
  if (!drinkOrder?.id) {
    fail('Pedido bebida sem id');
  }
  assertClose(drinkOrder.finalPrice, drinkExpectedTotal, 'Total pedido bebida');

  const sideExpectedTotal = batataP.price + upBatataM.price;
  const sideOrderRes = await req('/api/orders', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      customerName: 'E2E SIZE_CHANGE Batata',
      notes: 'Teste automatizado SIZE_CHANGE batata',
      items: [
        {
          menuItemId: batataP.id,
          quantity: 1,
          addons: [{ addonId: upBatataM.id, quantity: 1 }],
        },
      ],
    }),
  });
  assertStatus(sideOrderRes.status, 201, 'Criacao pedido batata com SIZE_CHANGE');

  const sideOrder = sideOrderRes.body?.data;
  if (!sideOrder?.id) {
    fail('Pedido batata sem id');
  }
  assertClose(sideOrder.finalPrice, sideExpectedTotal, 'Total pedido batata');

  console.log('[E2E SIZE_CHANGE] Validado com sucesso');
  console.log(
    `[E2E SIZE_CHANGE] Totais: bebida=${drinkOrder.finalPrice.toFixed(2)} batata=${sideOrder.finalPrice.toFixed(2)}\n`,
  );
}

main().catch((error) => {
  console.error(`\n[E2E SIZE_CHANGE] Falha: ${error.message}`);
  process.exit(1);
});
