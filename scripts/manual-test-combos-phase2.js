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

async function main() {
  const runId = Date.now().toString(36);
  let adminToken = '';
  let comboId = '';

  const loginResponse = await req('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'admin@sistema.local', password: 'admin123' }),
  });

  adminToken = loginResponse.body?.token || '';
  add('Combos login admin', loginResponse.status, loginResponse.status === 200 && Boolean(adminToken), 'token ok');

  const menuResponse = await req('/api/menu');
  const items = menuResponse.body?.data || [];
  const selected = items.slice(0, 3);
  const comboItems = selected.map((item) => ({ menuItemId: item.id, quantity: 1 }));

  add('Combos preparar itens base', menuResponse.status, menuResponse.status === 200 && comboItems.length === 3, '3 itens selecionados');

  const listResponse = await req('/api/combos');
  add('Combos listar ativos', listResponse.status, listResponse.status === 200 && (listResponse.body?.data?.length || 0) >= 1, 'listagem ok');

  const createNoTokenResponse = await req('/api/combos', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      name: 'Combo Sem Token',
      price: 29.9,
      comboItems,
    }),
  });
  add('Combos criar sem token', createNoTokenResponse.status, createNoTokenResponse.status === 401, '401 esperado');

  const createResponse = await req('/api/combos', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer ' + adminToken,
    },
    body: JSON.stringify({
      name: 'Combo Teste Fase2 ' + runId,
      description: 'combo criado no teste manual',
      price: 34.9,
      displayOrder: 99,
      comboItems,
    }),
  });

  comboId = createResponse.body?.data?.id || '';
  add('Combos criar com 3 itens', createResponse.status, createResponse.status === 201 && Boolean(comboId), '201 esperado');

  if (!comboId) {
    add('Combos detalhe por id', 0, false, 'combo nao criado no passo anterior');
  } else {
    const detailsResponse = await req('/api/combos/' + comboId);
    const detailItemsLength = detailsResponse.body?.data?.comboItems?.length || 0;
    add('Combos detalhe por id', detailsResponse.status, detailsResponse.status === 200 && detailItemsLength === 3, 'detalhes ok');
  }

  if (!comboId) {
    add('Combos editar preco', 0, false, 'combo nao criado no passo anterior');
  } else {
    const updateResponse = await req('/api/combos/' + comboId, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer ' + adminToken,
      },
      body: JSON.stringify({
        price: 39.9,
        description: 'preco atualizado no teste',
      }),
    });
    add('Combos editar preco', updateResponse.status, updateResponse.status === 200 && updateResponse.body?.data?.price === 39.9, 'preco atualizado');
  }

  if (!comboId) {
    add('Combos atualizar disponibilidade', 0, false, 'combo nao criado no passo anterior');
    add('Combos ocultar apos indisponivel', 0, false, 'combo nao criado no passo anterior');
  } else {
    const availabilityResponse = await req('/api/combos/' + comboId + '/availability', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer ' + adminToken,
      },
      body: JSON.stringify({ isAvailable: false }),
    });

    add('Combos atualizar disponibilidade', availabilityResponse.status, availabilityResponse.status === 200 && availabilityResponse.body?.data?.isActive === false, 'isActive=false');

    const listAfterDisableResponse = await req('/api/combos');
    const existsAfterDisable = (listAfterDisableResponse.body?.data || []).some((combo) => combo.id === comboId);
    add('Combos ocultar apos indisponivel', listAfterDisableResponse.status, listAfterDisableResponse.status === 200 && !existsAfterDisable, 'combo removido da listagem publica');
  }

  const failed = results.filter((r) => !r.ok);
  console.log(JSON.stringify({ total: results.length, passed: results.length - failed.length, failed: failed.length, results }, null, 2));

  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
