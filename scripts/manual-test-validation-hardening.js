#!/usr/bin/env node

/**
 * Manual Test: Backend Validation Hardening (Onda 4)
 * Testa validação de sabor obrigatório e removíveis permitidos
 */

const BASE_URL = 'http://localhost:3001/api';

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(`   ${error.message}`);
    process.exitCode = 1;
  }
}

async function fetchJson(method, path, body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);
  return { status: res.status, data: await res.json() };
}

async function runTests() {
  console.log('🧪 Testando validação de sabor obrigatório e removíveis\n');

  // Buscar dados necessários
  console.log('📡 Carregando cardápio...');
  const categoriesRes = await fetchJson('GET', '/categories');
  const categories = categoriesRes.data.data || categoriesRes.data;
  const bebidasCat = categories.find((c) => c.name === 'Bebidas');
  if (!bebidasCat) throw new Error('Categoria Bebidas não encontrada');

  const itemsRes = await fetchJson('GET', `/menu?category=${bebidasCat.id}`);
  const items = (itemsRes.data?.data || itemsRes.data);
  const refrig = items.find((i) => i.name === 'Refrigerante P');
  if (!refrig) throw new Error('Item Refrigerante P não encontrado');

  const addonsRes = await fetchJson('GET', `/menu/${refrig.id}`);
  const menuItemDetail = (addonsRes.data.data || addonsRes.data);
  const addons = (menuItemDetail.addons || []).map((mia) => mia.addon);
  const flavorAddons = addons.filter((a) => a.name.startsWith('Sabor'));
  if (flavorAddons.length === 0) throw new Error('Addons de sabor não encontrados');

  const colaAddon = flavorAddons.find((a) => a.name === 'Sabor Cola');
  if (!colaAddon) throw new Error('Sabor Cola não encontrado');

  console.log(`✓ Refrigerante P: ${refrig.id}`);
  console.log(`✓ Sabor Cola: ${colaAddon.id}\n`);

  // Teste 1: Tentar submeter sem sabor (deve falhar)
  await test('Pedido SEM sabor deve retornar erro', async () => {
    const res = await fetchJson('POST', '/orders', {
      items: [
        {
          menuItemId: refrig.id,
          quantity: 1,
          addons: [], // SEM SABOR - DEVE FALHAR
        },
      ],
    });

    if (res.status !== 400) {
      throw new Error(`Esperava 400, mas recebeu ${res.status}`);
    }
    if (!res.data.itemErrors || res.data.itemErrors.length === 0) {
      throw new Error('Esperava itemErrors na resposta');
    }

    const error = res.data.itemErrors[0];
    if (!error.message.includes('Sabor obrigatório')) {
      throw new Error(`Mensagem inesperada: ${error.message}`);
    }
    console.log(`   Erro recebido: "${error.message}"`);
  });

  // Teste 2: Tentar submeter com múltiplos sabores (deve falhar)
  const flavorAddon2 = flavorAddons.find((a) => a.name === 'Sabor Guarana');
  if (flavorAddon2) {
    await test('Pedido com MÚLTIPLOS sabores deve retornar erro', async () => {
      const res = await fetchJson('POST', '/orders', {
        items: [
          {
            menuItemId: refrig.id,
            quantity: 1,
            addons: [
              { addonId: colaAddon.id, quantity: 1 },
              { addonId: flavorAddon2.id, quantity: 1 }, // 2 SABORES - DEVE FALHAR
            ],
          },
        ],
      });

      if (res.status !== 400) {
        throw new Error(`Esperava 400, mas recebeu ${res.status}`);
      }
      if (!res.data.itemErrors || res.data.itemErrors.length === 0) {
        throw new Error('Esperava itemErrors na resposta');
      }

      const error = res.data.itemErrors[0];
      if (!error.message.includes('Apenas 1 sabor')) {
        throw new Error(`Mensagem inesperada: ${error.message}`);
      }
      console.log(`   Erro recebido: "${error.message}"`);
    });
  }

  // Teste 3: Submeter com sabor correto (deve funcionar)
  await test('✅ Pedido COM sabor deve ser criado', async () => {
    const res = await fetchJson('POST', '/orders', {
      items: [
        {
          menuItemId: refrig.id,
          quantity: 1,
          addons: [{ addonId: colaAddon.id, quantity: 1 }], // COM SABOR - DEVE FUNCIONAR
        },
      ],
    });

    if (res.status !== 201) {
      throw new Error(`Esperava 201, mas recebeu ${res.status}`);
    }
    if (!res.data.data.orderNumber) {
      throw new Error('Pedido não foi criado corretamente');
    }
    console.log(`   Pedido ${res.data.data.orderNumber} criado com sucesso`);
  });

  console.log('\n✨ Todos os testes de validação foram executados!');
}

runTests().catch((err) => {
  console.error('\n❌ Erro ao executar testes:', err.message);
  process.exit(1);
});
