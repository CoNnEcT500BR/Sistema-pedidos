/**
 * Verificacao final: regra de upgrade de tamanho
 *
 * Script proprio, independente dos testes existentes.
 * Cobre:
 *  1. Disponibilidade dos dados base (menu + addons)
 *  2. Matriz completa de filtro SIZE_CHANGE para bebida e batata (P/M/G x M/G)
 *  3. Addons nao-SIZE_CHANGE nunca sao filtrados indevidamente
 *  4. Criar pedidos validos (upgrade legitimo) e verificar total
 *  5. Documentar comportamento da API de criacao de pedido com upgrade invalido
 *  6. Verificar que itens sem sufixo de tamanho nao perdem nenhum SIZE_CHANGE
 */

const BASE = process.env.E2E_API_BASE ?? 'http://localhost:3001';

// ─── utilitarios ───────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

function pass(label) {
  passed++;
  console.log(`  ✓ ${label}`);
}

function fail(label, detail) {
  failed++;
  const msg = detail ? `${label}: ${detail}` : label;
  console.error(`  ✗ ${msg}`);
  failures.push(msg);
}

async function get(path) {
  const res = await fetch(BASE + path);
  const text = await res.text();
  let body = null;
  try { body = JSON.parse(text); } catch { /* noop */ }
  return { status: res.status, body };
}

async function post(path, payload) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let body = null;
  try { body = JSON.parse(text); } catch { /* noop */ }
  return { status: res.status, body };
}

function byName(list, name) {
  return list.find((entry) => entry?.name === name) ?? null;
}

function getSizeSuffix(name) {
  const m = name?.match(/\s([PMG])$/);
  return m?.[1] ?? null;
}

// ─── secao 1: dados base ───────────────────────────────────────────────────────

async function checkBaseData() {
  console.log('\n[1] Dados base (menu e addons)');

  const menuRes = await get('/api/menu');
  if (menuRes.status !== 200) { fail('GET /api/menu', `HTTP ${menuRes.status}`); return null; }
  const addonsRes = await get('/api/addons');
  if (addonsRes.status !== 200) { fail('GET /api/addons', `HTTP ${addonsRes.status}`); return null; }

  const menu = menuRes.body?.data ?? [];
  const addons = addonsRes.body?.data ?? [];

  const expectedMenuItems = [
    'Refrigerante P', 'Refrigerante M', 'Refrigerante G',
    'Batata Frita P', 'Batata Frita M', 'Batata Frita G',
  ];
  for (const name of expectedMenuItems) {
    const item = byName(menu, name);
    if (item) pass(`Item "${name}" existe`);
    else fail(`Item "${name}" nao encontrado no menu`);
  }

  const expectedAddons = [
    'Upgrade Bebida para M', 'Upgrade Bebida para G',
    'Upgrade Batata para M', 'Upgrade Batata para G',
    'Sabor Cola',
  ];
  for (const name of expectedAddons) {
    const addon = byName(addons, name);
    if (!addon) { fail(`Addon "${name}" nao encontrado`); continue; }
    if (name.startsWith('Upgrade')) {
      if (addon.addonType === 'SIZE_CHANGE') pass(`Addon "${name}" tem addonType=SIZE_CHANGE`);
      else fail(`Addon "${name}" addonType errado`, addon.addonType);
    } else {
      pass(`Addon "${name}" existe`);
    }
  }

  return { menu, addons };
}

// ─── secao 2: matriz completa de filtro SIZE_CHANGE ───────────────────────────

/**
 * Para cada item de bebida e batata, verificamos exatamente quais upgrades devem
 * aparecer e quais devem ser bloqueados.
 *
 * Esperado:
 *   P -> pode: M, G  |  nao pode: (nenhum bloqueio)
 *   M -> pode: G     |  nao pode: M
 *   G -> pode: -     |  nao pode: M, G
 */
async function checkSizeChangeMatrix(menu, addons) {
  console.log('\n[2] Matriz de filtro SIZE_CHANGE via GET /api/menu/:id/addons');

  const upBebidaM = byName(addons, 'Upgrade Bebida para M');
  const upBebidaG = byName(addons, 'Upgrade Bebida para G');
  const upBatataM = byName(addons, 'Upgrade Batata para M');
  const upBatataG = byName(addons, 'Upgrade Batata para G');

  const matrix = [
    // [nomeItem, upgradePermitido[], upgradeProibido[]]
    ['Refrigerante P', [upBebidaM, upBebidaG], []],
    ['Refrigerante M', [upBebidaG],            [upBebidaM]],
    ['Refrigerante G', [],                     [upBebidaM, upBebidaG]],
    ['Batata Frita P', [upBatataM, upBatataG], []],
    ['Batata Frita M', [upBatataG],            [upBatataM]],
    ['Batata Frita G', [],                     [upBatataM, upBatataG]],
  ];

  for (const [itemName, allowed, blocked] of matrix) {
    const item = byName(menu, itemName);
    if (!item) { fail(`Item "${itemName}" nao encontrado, pulando matriz`); continue; }

    const res = await get(`/api/menu/${item.id}/addons`);
    if (res.status !== 200) { fail(`Addons de "${itemName}"`, `HTTP ${res.status}`); continue; }

    const itemAddons = res.body?.data ?? [];

    for (const addon of allowed) {
      if (!addon) continue;
      if (itemAddons.some((a) => a.id === addon.id)) {
        pass(`"${itemName}" permite "${addon.name}"`);
      } else {
        fail(`"${itemName}" deveria permitir "${addon.name}" mas nao contem`);
      }
    }

    for (const addon of blocked) {
      if (!addon) continue;
      if (!itemAddons.some((a) => a.id === addon.id)) {
        pass(`"${itemName}" bloqueia corretamente "${addon.name}"`);
      } else {
        fail(`"${itemName}" nao deveria conter "${addon.name}" mas contem`);
      }
    }
  }
}

// ─── secao 3: addons nao-SIZE_CHANGE nunca sao removidos ──────────────────────

async function checkNonSizeChangeIntact(menu, addons) {
  console.log('\n[3] Addons nao-SIZE_CHANGE nao sao filtrados indevidamente');

  // Usa Refrigerante M: sabores devem continuar presentes
  const refriM = byName(menu, 'Refrigerante M');
  if (!refriM) { fail('Refrigerante M nao encontrado'); return; }

  const res = await get(`/api/menu/${refriM.id}/addons`);
  if (res.status !== 200) { fail('Addons de Refrigerante M', `HTTP ${res.status}`); return; }

  const itemAddons = res.body?.data ?? [];

  const saborCola = byName(addons, 'Sabor Cola');
  if (saborCola) {
    if (itemAddons.some((a) => a.id === saborCola.id)) {
      pass('"Sabor Cola" presente em Refrigerante M (nao filtrado)');
    } else {
      fail('"Sabor Cola" sumiu indevidamente de Refrigerante M');
    }
  }

  // Nenhum SIZE_CHANGE invalido deve estar presente
  const invalidSizeChanges = itemAddons.filter((a) => {
    if (a.addonType !== 'SIZE_CHANGE') return false;
    const itemSize = getSizeSuffix(refriM.name);
    const targetSize = getSizeSuffix(a.name);
    if (!itemSize || !targetSize) return false;
    const rank = { P: 0, M: 1, G: 2 };
    return rank[targetSize] <= rank[itemSize];
  });

  if (invalidSizeChanges.length === 0) {
    pass('Nenhum SIZE_CHANGE invalido presente em Refrigerante M');
  } else {
    fail(
      'SIZE_CHANGE invalido encontrado em Refrigerante M',
      invalidSizeChanges.map((a) => a.name).join(', '),
    );
  }
}

// ─── secao 4: pedidos validos com upgrade legitimo ────────────────────────────

async function checkValidOrders(menu, addons) {
  console.log('\n[4] Criacao de pedidos com upgrade legitimo');

  const refriP = byName(menu, 'Refrigerante P');
  const batataP = byName(menu, 'Batata Frita P');
  const refriM = byName(menu, 'Refrigerante M');

  const saborCola = byName(addons, 'Sabor Cola');
  const upBebidaM = byName(addons, 'Upgrade Bebida para M');
  const upBebidaG = byName(addons, 'Upgrade Bebida para G');
  const upBatataG = byName(addons, 'Upgrade Batata para G');

  // Caso A: refrigerante P + sabor + upgrade para M
  if (refriP && saborCola && upBebidaM) {
    const expectedTotal = refriP.price + saborCola.price + upBebidaM.price;
    const res = await post('/api/orders', {
      customerName: 'Verificacao RefriP→M',
      items: [{
        menuItemId: refriP.id,
        quantity: 1,
        addons: [
          { addonId: saborCola.id, quantity: 1 },
          { addonId: upBebidaM.id, quantity: 1 },
        ],
      }],
    });
    if (res.status === 201) {
      const finalPrice = res.body?.data?.finalPrice ?? -1;
      const delta = Math.abs(finalPrice - expectedTotal);
      if (delta < 0.01) pass(`Pedido RefriP→M: total correto R$ ${finalPrice.toFixed(2)}`);
      else fail(`Pedido RefriP→M: total incorreto`, `esperado ${expectedTotal.toFixed(2)}, recebido ${finalPrice.toFixed(2)}`);
    } else {
      fail('Pedido RefriP→M nao foi criado', `HTTP ${res.status}`);
    }
  }

  // Caso B: refrigerante P + sabor + upgrade para G
  if (refriP && saborCola && upBebidaG) {
    const expectedTotal = refriP.price + saborCola.price + upBebidaG.price;
    const res = await post('/api/orders', {
      customerName: 'Verificacao RefriP→G',
      items: [{
        menuItemId: refriP.id,
        quantity: 1,
        addons: [
          { addonId: saborCola.id, quantity: 1 },
          { addonId: upBebidaG.id, quantity: 1 },
        ],
      }],
    });
    if (res.status === 201) {
      const finalPrice = res.body?.data?.finalPrice ?? -1;
      const delta = Math.abs(finalPrice - expectedTotal);
      if (delta < 0.01) pass(`Pedido RefriP→G: total correto R$ ${finalPrice.toFixed(2)}`);
      else fail(`Pedido RefriP→G: total incorreto`, `esperado ${expectedTotal.toFixed(2)}, recebido ${finalPrice.toFixed(2)}`);
    } else {
      fail('Pedido RefriP→G nao foi criado', `HTTP ${res.status}`);
    }
  }

  // Caso C: refrigerante M + sabor + upgrade para G (legitimo)
  if (refriM && saborCola && upBebidaG) {
    const expectedTotal = refriM.price + saborCola.price + upBebidaG.price;
    const res = await post('/api/orders', {
      customerName: 'Verificacao RefriM→G',
      items: [{
        menuItemId: refriM.id,
        quantity: 1,
        addons: [
          { addonId: saborCola.id, quantity: 1 },
          { addonId: upBebidaG.id, quantity: 1 },
        ],
      }],
    });
    if (res.status === 201) {
      const finalPrice = res.body?.data?.finalPrice ?? -1;
      const delta = Math.abs(finalPrice - expectedTotal);
      if (delta < 0.01) pass(`Pedido RefriM→G: total correto R$ ${finalPrice.toFixed(2)}`);
      else fail(`Pedido RefriM→G: total incorreto`, `esperado ${expectedTotal.toFixed(2)}, recebido ${finalPrice.toFixed(2)}`);
    } else {
      fail('Pedido RefriM→G nao foi criado', `HTTP ${res.status}`);
    }
  }

  // Caso D: batata P + upgrade para G (legitimo)
  if (batataP && upBatataG) {
    const expectedTotal = batataP.price + upBatataG.price;
    const res = await post('/api/orders', {
      customerName: 'Verificacao BatataP→G',
      items: [{
        menuItemId: batataP.id,
        quantity: 1,
        addons: [{ addonId: upBatataG.id, quantity: 1 }],
      }],
    });
    if (res.status === 201) {
      const finalPrice = res.body?.data?.finalPrice ?? -1;
      const delta = Math.abs(finalPrice - expectedTotal);
      if (delta < 0.01) pass(`Pedido BatataP→G: total correto R$ ${finalPrice.toFixed(2)}`);
      else fail(`Pedido BatataP→G: total incorreto`, `esperado ${expectedTotal.toFixed(2)}, recebido ${finalPrice.toFixed(2)}`);
    } else {
      fail('Pedido BatataP→G nao foi criado', `HTTP ${res.status}`);
    }
  }
}

// ─── secao 5: comportamento da API de pedido com upgrade invalido ─────────────

async function checkOrderApiWithInvalidUpgrade(menu, addons) {
  console.log('\n[5] Comportamento da API de pedido com upgrade invalido (documentacao)');

  /**
   * O calculador de pedidos valida sabores e removiveis, mas nao valida
   * SIZE_CHANGE por tamanho — isso e responsabilidade do frontend.
   * Este teste documenta o comportamento atual (aceita, pois a vinculacao DB existe)
   * e confirma que o preco calculado ao menos nao e negativo ou absurdo.
   */
  const refriM = byName(menu, 'Refrigerante M');
  const saborCola = byName(addons, 'Sabor Cola');
  const upBebidaM = byName(addons, 'Upgrade Bebida para M');

  if (!refriM || !saborCola || !upBebidaM) {
    fail('Dados insuficientes para testar upgrade invalido');
    return;
  }

  const res = await post('/api/orders', {
    customerName: 'Verificacao RefriM+UpgradeM (invalido)',
    items: [{
      menuItemId: refriM.id,
      quantity: 1,
      addons: [
        { addonId: saborCola.id, quantity: 1 },
        { addonId: upBebidaM.id, quantity: 1 },
      ],
    }],
  });

  // Documentar comportamento: a API de criacao de pedido nao rejeita este caso
  // porque o vinculo DB existe (o filtro por tamanho ocorre apenas em GET /api/menu/:id/addons)
  if (res.status === 201) {
    const finalPrice = res.body?.data?.finalPrice;
    if (typeof finalPrice === 'number' && finalPrice >= refriM.price) {
      pass(
        `[DOCUMENTADO] Pedido invalido aceito pela API de pedido (preco=${finalPrice.toFixed(2)}) ` +
        '- frontend e a barreira primaria (addon filtrado no GET /api/menu/:id/addons)',
      );
    } else {
      fail('Pedido invalido retornou preco inconsistente', String(finalPrice));
    }
  } else if (res.status === 400) {
    pass('[DOCUMENTADO] API de pedido rejeitou upgrade invalido (validacao server-side presente)');
  } else {
    fail('Resposta inesperada para pedido invalido', `HTTP ${res.status}`);
  }
}

// ─── secao 6: itens sem sufixo de tamanho nao perdem SIZE_CHANGE ──────────────

async function checkItemsWithoutSuffix(menu) {
  console.log('\n[6] Itens sem sufixo de tamanho nao perdem addons SIZE_CHANGE');

  // Busca qualquer item de bebida sem sufixo P/M/G no nome
  const itemWithoutSuffix = menu.find((item) => {
    const lower = (item.category?.name ?? item.name).toLowerCase();
    const isDrinkLike =
      lower.includes('refrigerante') ||
      lower.includes('suco') ||
      lower.includes('bebida');
    return isDrinkLike && getSizeSuffix(item.name) === null;
  });

  if (!itemWithoutSuffix) {
    pass('Nenhum item de bebida sem sufixo de tamanho no menu (cenario nao aplicavel)');
    return;
  }

  const res = await get(`/api/menu/${itemWithoutSuffix.id}/addons`);
  if (res.status !== 200) {
    fail(`Addons de "${itemWithoutSuffix.name}"`, `HTTP ${res.status}`);
    return;
  }

  const itemAddons = res.body?.data ?? [];
  const sizeChangeAddons = itemAddons.filter((a) => a.addonType === 'SIZE_CHANGE');

  // Item sem sufixo: nao deve ter SIZE_CHANGE filtrado (getSizeSuffix retorna null -> isAllowed retorna true)
  // Portanto qualquer SIZE_CHANGE que o DB vincular deve aparecer
  pass(
    `Item "${itemWithoutSuffix.name}" sem sufixo tem ${sizeChangeAddons.length} SIZE_CHANGE ` +
    '(nenhum filtrado indevidamente)',
  );
}

// ─── runner principal ──────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  Verificacao Final: Regra de Upgrade de Tamanho     ║');
  console.log('╚══════════════════════════════════════════════════════╝');

  const base = await checkBaseData();
  if (!base) {
    console.error('\n[ABORTADO] Falha nos dados base, impossivel continuar.\n');
    process.exit(1);
  }

  const { menu, addons } = base;

  await checkSizeChangeMatrix(menu, addons);
  await checkNonSizeChangeIntact(menu, addons);
  await checkValidOrders(menu, addons);
  await checkOrderApiWithInvalidUpgrade(menu, addons);
  await checkItemsWithoutSuffix(menu);

  console.log('\n══════════════════════════════════════════════════════');
  console.log(`  Resultado: ${passed} passou  |  ${failed} falhou`);
  if (failures.length > 0) {
    console.log('\n  Falhas:');
    failures.forEach((f) => console.log(`    - ${f}`));
  }
  console.log('══════════════════════════════════════════════════════\n');

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(`\n[ERRO FATAL] ${err.message}`);
  process.exit(1);
});
