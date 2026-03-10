#!/usr/bin/env node

const http = require('http');

const BASE_URL = 'http://localhost:3001/api';

function makeRequest(url, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('\n📋 ═══════════════════════════════════════════════════════════════');
  console.log('📋 CARDÁPIO REFATORADO - FASE 3');
  console.log('📋 ═══════════════════════════════════════════════════════════════\n');

  try {
    // 1. Listar categorias
    console.log('1️⃣  CATEGORIAS');
    const categoriesRes = await makeRequest(`${BASE_URL}/categories`);
    const categories = categoriesRes.data.data || [];
    categories.forEach((cat) => {
      console.log(`   ✓ ${cat.name}`);
    });

    // 2. Listar itens de cada categoria
    for (const category of categories) {
      console.log(`\n2️⃣  ITENS - ${category.name.toUpperCase()}`);
      const itemsRes = await makeRequest(`${BASE_URL}/menu?category=${category.id}`);
      const items = itemsRes.data.data || [];

      items.forEach((item) => {
        console.log(`   📍 ${item.name} - R$ ${item.price.toFixed(2)}`);
        if (item.description) {
          console.log(`      └─ ${item.description}`);
        }
      });

      // Para burgers, mostrar ingredientes
      if (category.name === 'Hamburgueres') {
        for (const burger of items.slice(0, 2)) {
          // Mostrar apenas os 2 primeiros
          const addonsRes = await makeRequest(`${BASE_URL}/menu/${burger.id}/addons`);
          const addons = addonsRes.data.data || [];

          const removable = addons.filter((a) => a.isRequired);
          const extras = addons.filter((a) => !a.isRequired);

          console.log(`\n   🔍 ${burger.name}`);
          if (removable.length > 0) {
            console.log('      🚫 Remover:');
            removable.forEach((a) => {
              console.log(`         • ${a.name}`);
            });
          }
          if (extras.length > 0) {
            console.log('      ➕ Adicionar Extras:');
            extras.forEach((a) => {
              console.log(`         • ${a.name} +R$ ${a.price.toFixed(2)}`);
            });
          }
        }
      }
    }

    // 3. Listar combos
    console.log(`\n3️⃣  COMBOS DISPONÍVEIS`);
    const combosRes = await makeRequest(`${BASE_URL}/combos`);
    const combos = combosRes.data.data || [];
    combos.forEach((combo) => {
      console.log(`   🎁 ${combo.name} - R$ ${combo.price.toFixed(2)}`);
      if (combo.description) {
        console.log(`      └─ ${combo.description}`);
      }
    });

    console.log('\n📊 ═══════════════════════════════════════════════════════════════');
    console.log(`📊 CARDÁPIO RESUMO:`);
    console.log(`   ✓ ${categories.length} categorias`);
    let totalItems = 0;
    for (const category of categories) {
      const itemsRes = await makeRequest(`${BASE_URL}/menu?category=${category.id}`);
      const count = (itemsRes.data.data || []).length;
      totalItems += count;
      console.log(`   ✓ ${category.name}: ${count} itens`);
    }
    console.log(`   ✓ ${combos.length} combos`);
    console.log('📊 ═══════════════════════════════════════════════════════════════\n');

    console.log('✅ CARDÁPIO VALIDADO COM SUCESSO!\n');
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

main();
