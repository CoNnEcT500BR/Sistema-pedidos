/**
 * manual-test-admin-phase5.js
 * Validacao manual assistida da Fase 5 (Admin)
 *
 * Execucao: node scripts/manual-test-admin-phase5.js
 * Pre-requisito: servidor rodando em http://localhost:3001
 */

const BASE = 'http://localhost:3001';
const results = [];

const add = (test, status, ok, detail) => {
  results.push({ test, status: String(status), ok, detail });
};

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

function authHeader(token) {
  return { authorization: `Bearer ${token}` };
}

async function main() {
  const runId = Date.now().toString(36);
  const runOrder = Number.parseInt(String(Date.now()).slice(-5), 10);
  const today = new Date().toISOString().slice(0, 10);

  let adminToken = '';
  let createdMenuItemId = '';
  let createdCategoryId = '';
  let createdComboId = '';
  let createdUserId = '';
  let createdOrderId = '';
  let categoryId = '';
  let addonId = '';
  let baseMenuItemId = '';

  try {
    const login = await req('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'admin@sistema.local', password: 'admin123' }),
    });
    adminToken = login.body?.token ?? '';
    add(
      '1.1 Login Admin com credenciais validas',
      login.status,
      login.status === 200 && Boolean(adminToken) && login.body?.user?.role === 'ADMIN',
      `role=${login.body?.user?.role ?? '?'}`,
    );
  } catch (error) {
    add('1.1 Login Admin com credenciais validas', 0, false, String(error));
  }

  try {
    const me = await req('/api/auth/me', { headers: authHeader(adminToken) });
    add(
      '1.2 Auth /me com token Admin',
      me.status,
      me.status === 200 && me.body?.user?.role === 'ADMIN',
      `role=${me.body?.user?.role ?? '?'}`,
    );
  } catch (error) {
    add('1.2 Auth /me com token Admin', 0, false, String(error));
  }

  try {
    const dashboardUnauthorized = await req('/api/reports/dashboard');
    add(
      '2.1 Dashboard sem token retorna 401',
      dashboardUnauthorized.status,
      dashboardUnauthorized.status === 401,
      '401 esperado',
    );
  } catch (error) {
    add('2.1 Dashboard sem token retorna 401', 0, false, String(error));
  }

  try {
    const categories = await req('/api/admin/categories', { headers: authHeader(adminToken) });
    categoryId = categories.body?.data?.[0]?.id ?? '';
    add(
      '2.2 GET /api/admin/categories lista categorias',
      categories.status,
      categories.status === 200 && Boolean(categoryId),
      `categoryId=${categoryId || '?'}`,
    );
  } catch (error) {
    add('2.2 GET /api/admin/categories lista categorias', 0, false, String(error));
  }

  try {
    const createCategory = await req('/api/admin/categories', {
      method: 'POST',
      headers: { ...authHeader(adminToken), 'content-type': 'application/json' },
      body: JSON.stringify({
        name: `Categoria Admin ${runId}`,
        description: 'Categoria de validacao da fase 5',
        icon: 'cat',
        displayOrder: 990,
        isActive: true,
      }),
    });
    createdCategoryId = createCategory.body?.data?.id ?? '';
    add(
      '2.3 POST /api/admin/categories cria categoria administrativa',
      createCategory.status,
      createCategory.status === 201 && Boolean(createdCategoryId),
      `categoryId=${createdCategoryId || '?'}`,
    );
  } catch (error) {
    add('2.3 POST /api/admin/categories cria categoria administrativa', 0, false, String(error));
  }

  if (createdCategoryId) {
    try {
      const updateCategory = await req(`/api/admin/categories/${createdCategoryId}`, {
        method: 'PUT',
        headers: { ...authHeader(adminToken), 'content-type': 'application/json' },
        body: JSON.stringify({
          description: `Categoria atualizada ${runId}`,
          displayOrder: 991,
        }),
      });
      add(
        '2.4 PUT /api/admin/categories/:id atualiza categoria',
        updateCategory.status,
        updateCategory.status === 200 && String(updateCategory.body?.data?.description || '').includes('atualizada'),
        `description=${updateCategory.body?.data?.description ?? '?'}`,
      );
    } catch (error) {
      add('2.4 PUT /api/admin/categories/:id atualiza categoria', 0, false, String(error));
    }

    try {
      const disableCategory = await req(`/api/admin/categories/${createdCategoryId}/status`, {
        method: 'PATCH',
        headers: { ...authHeader(adminToken), 'content-type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      });
      add(
        '2.5 PATCH /api/admin/categories/:id/status desativa categoria',
        disableCategory.status,
        disableCategory.status === 200 && disableCategory.body?.data?.isActive === false,
        `isActive=${disableCategory.body?.data?.isActive}`,
      );
    } catch (error) {
      add('2.5 PATCH /api/admin/categories/:id/status desativa categoria', 0, false, String(error));
    }

    try {
      const enableCategory = await req(`/api/admin/categories/${createdCategoryId}/status`, {
        method: 'PATCH',
        headers: { ...authHeader(adminToken), 'content-type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      });
      add(
        '2.6 PATCH /api/admin/categories/:id/status reativa categoria',
        enableCategory.status,
        enableCategory.status === 200 && enableCategory.body?.data?.isActive === true,
        `isActive=${enableCategory.body?.data?.isActive}`,
      );
    } catch (error) {
      add('2.6 PATCH /api/admin/categories/:id/status reativa categoria', 0, false, String(error));
    }
  }

  try {
    const addons = await req('/api/addons');
    addonId = addons.body?.data?.find((addon) => addon.isActive !== false)?.id ?? '';
    add(
      '2.7 GET /api/addons retorna adicionais ativos',
      addons.status,
      addons.status === 200 && Boolean(addonId),
      `addonId=${addonId || '?'}`,
    );
  } catch (error) {
    add('2.7 GET /api/addons retorna adicionais ativos', 0, false, String(error));
  }

  try {
    const menu = await req('/api/menu');
    baseMenuItemId = menu.body?.data?.find((item) => item.isAvailable)?.id ?? '';
    add(
      '2.8 GET /api/menu retorna item base para os testes',
      menu.status,
      menu.status === 200 && Boolean(baseMenuItemId),
      `menuItemId=${baseMenuItemId || '?'}`,
    );
  } catch (error) {
    add('2.8 GET /api/menu retorna item base para os testes', 0, false, String(error));
  }

  if (categoryId) {
    try {
      const createMenuItem = await req('/api/menu', {
        method: 'POST',
        headers: { ...authHeader(adminToken), 'content-type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          name: `Burger Admin ${runId}`,
          description: 'Item de validacao da fase 5',
          price: 27.9,
          icon: 'test',
          displayOrder: runOrder,
          isAvailable: true,
          addonIds: addonId ? [addonId] : [],
        }),
      });
      createdMenuItemId = createMenuItem.body?.data?.id ?? '';
      add(
        '3.1 POST /api/menu cria item via Admin',
        createMenuItem.status,
        createMenuItem.status === 201 && Boolean(createdMenuItemId),
        `itemId=${createdMenuItemId || '?'}`,
      );
    } catch (error) {
      add('3.1 POST /api/menu cria item via Admin', 0, false, String(error));
    }
  }

  if (createdMenuItemId) {
    try {
      const detail = await req(`/api/menu/${createdMenuItemId}`);
      const hasAddon = Array.isArray(detail.body?.data?.addons)
        ? detail.body.data.addons.some((entry) => entry.addonId === addonId)
        : false;
      add(
        '3.2 GET /api/menu/:id retorna item com addons vinculados',
        detail.status,
        detail.status === 200 && hasAddon,
        `addonVinculado=${hasAddon}`,
      );
    } catch (error) {
      add('3.2 GET /api/menu/:id retorna item com addons vinculados', 0, false, String(error));
    }

    try {
      const adminMenu = await req('/api/admin/menu', { headers: authHeader(adminToken) });
      const found = Array.isArray(adminMenu.body?.data)
        ? adminMenu.body.data.some((item) => item.id === createdMenuItemId)
        : false;
      add(
        '3.3 GET /api/admin/menu exibe item criado',
        adminMenu.status,
        adminMenu.status === 200 && found,
        `encontrado=${found}`,
      );
    } catch (error) {
      add('3.3 GET /api/admin/menu exibe item criado', 0, false, String(error));
    }

    try {
      const publicMenu = await req('/api/menu');
      const found = Array.isArray(publicMenu.body?.data)
        ? publicMenu.body.data.some((item) => item.id === createdMenuItemId)
        : false;
      add(
        '3.4 GET /api/menu publica o item para o Kiosk',
        publicMenu.status,
        publicMenu.status === 200 && found,
        `visivelNoKiosk=${found}`,
      );
    } catch (error) {
      add('3.4 GET /api/menu publica o item para o Kiosk', 0, false, String(error));
    }

    try {
      const order = await req('/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          customerName: `Admin Flow ${runId}`,
          notes: 'Pedido de validacao fase 5',
          items: [{ menuItemId: createdMenuItemId, quantity: 1, addons: [] }],
        }),
      });
      createdOrderId = order.body?.data?.id ?? '';
      add(
        '3.5 POST /api/orders cria pedido com item do Admin',
        order.status,
        order.status === 201 && Boolean(createdOrderId),
        `orderId=${createdOrderId || '?'}`,
      );
    } catch (error) {
      add('3.5 POST /api/orders cria pedido com item do Admin', 0, false, String(error));
    }

    try {
      const updateItem = await req(`/api/menu/${createdMenuItemId}`, {
        method: 'PUT',
        headers: { ...authHeader(adminToken), 'content-type': 'application/json' },
        body: JSON.stringify({
          price: 31.5,
          displayOrder: runOrder + 1,
          addonIds: addonId ? [addonId] : [],
        }),
      });
      add(
        '3.6 PUT /api/menu/:id atualiza preco e ordem',
        updateItem.status,
        updateItem.status === 200 && updateItem.body?.data?.price === 31.5,
        `price=${updateItem.body?.data?.price ?? '?'}`,
      );
    } catch (error) {
      add('3.6 PUT /api/menu/:id atualiza preco e ordem', 0, false, String(error));
    }

    if (createdOrderId) {
      try {
        const confirmed = await req(`/api/orders/${createdOrderId}/status`, {
          method: 'PATCH',
          headers: { ...authHeader(adminToken), 'content-type': 'application/json' },
          body: JSON.stringify({ status: 'CONFIRMED' }),
        });
        add(
          '3.7 PATCH /api/orders/:id/status move pedido para CONFIRMED',
          confirmed.status,
          confirmed.status === 200 && confirmed.body?.data?.status === 'CONFIRMED',
          `status=${confirmed.body?.data?.status ?? '?'}`,
        );
      } catch (error) {
        add('3.7 PATCH /api/orders/:id/status move pedido para CONFIRMED', 0, false, String(error));
      }

      try {
        const preparing = await req(`/api/orders/${createdOrderId}/status`, {
          method: 'PATCH',
          headers: { ...authHeader(adminToken), 'content-type': 'application/json' },
          body: JSON.stringify({ status: 'PREPARING' }),
        });
        add(
          '3.8 PATCH /api/orders/:id/status move pedido para PREPARING',
          preparing.status,
          preparing.status === 200 && preparing.body?.data?.status === 'PREPARING',
          `status=${preparing.body?.data?.status ?? '?'}`,
        );
      } catch (error) {
        add('3.8 PATCH /api/orders/:id/status move pedido para PREPARING', 0, false, String(error));
      }

      try {
        const preparingList = await req('/api/orders?status=PREPARING', {
          headers: authHeader(adminToken),
        });
        const foundPreparing = Array.isArray(preparingList.body?.data)
          ? preparingList.body.data.some((order) => order.id === createdOrderId)
          : false;
        add(
          '3.9 GET /api/orders?status=PREPARING lista pedido na coluna de preparo',
          preparingList.status,
          preparingList.status === 200 && foundPreparing,
          `encontrado=${foundPreparing}`,
        );
      } catch (error) {
        add('3.9 GET /api/orders?status=PREPARING lista pedido na coluna de preparo', 0, false, String(error));
      }

      try {
        const ready = await req(`/api/orders/${createdOrderId}/status`, {
          method: 'PATCH',
          headers: { ...authHeader(adminToken), 'content-type': 'application/json' },
          body: JSON.stringify({ status: 'READY' }),
        });
        add(
          '3.10 PATCH /api/orders/:id/status move pedido para READY',
          ready.status,
          ready.status === 200 && ready.body?.data?.status === 'READY',
          `status=${ready.body?.data?.status ?? '?'}`,
        );
      } catch (error) {
        add('3.10 PATCH /api/orders/:id/status move pedido para READY', 0, false, String(error));
      }

      try {
        const readyList = await req('/api/orders?status=READY', {
          headers: authHeader(adminToken),
        });
        const foundReady = Array.isArray(readyList.body?.data)
          ? readyList.body.data.some((order) => order.id === createdOrderId)
          : false;
        add(
          '3.11 GET /api/orders?status=READY lista pedido na coluna de pronto',
          readyList.status,
          readyList.status === 200 && foundReady,
          `encontrado=${foundReady}`,
        );
      } catch (error) {
        add('3.11 GET /api/orders?status=READY lista pedido na coluna de pronto', 0, false, String(error));
      }
    }

    try {
      const disableItem = await req(`/api/menu/${createdMenuItemId}/availability`, {
        method: 'PATCH',
        headers: { ...authHeader(adminToken), 'content-type': 'application/json' },
        body: JSON.stringify({ isAvailable: false }),
      });
      const publicMenu = await req('/api/menu');
      const hidden = Array.isArray(publicMenu.body?.data)
        ? !publicMenu.body.data.some((item) => item.id === createdMenuItemId)
        : false;
      add(
        '3.12 PATCH /api/menu/:id/availability remove item do Kiosk',
        disableItem.status,
        disableItem.status === 200 && hidden,
        `escondido=${hidden}`,
      );
    } catch (error) {
      add('3.12 PATCH /api/menu/:id/availability remove item do Kiosk', 0, false, String(error));
    }

    try {
      const enableItem = await req(`/api/menu/${createdMenuItemId}/availability`, {
        method: 'PATCH',
        headers: { ...authHeader(adminToken), 'content-type': 'application/json' },
        body: JSON.stringify({ isAvailable: true }),
      });
      add(
        '3.13 PATCH /api/menu/:id/availability reativa item para demais testes',
        enableItem.status,
        enableItem.status === 200 && enableItem.body?.data?.isAvailable === true,
        `isAvailable=${enableItem.body?.data?.isAvailable}`,
      );
    } catch (error) {
      add('3.13 PATCH /api/menu/:id/availability reativa item para demais testes', 0, false, String(error));
    }
  }

  if (createdMenuItemId && baseMenuItemId) {
    try {
      const createCombo = await req('/api/combos', {
        method: 'POST',
        headers: { ...authHeader(adminToken), 'content-type': 'application/json' },
        body: JSON.stringify({
          name: `Combo Admin ${runId}`,
          description: 'Combo de validacao da fase 5',
          price: 42.9,
          icon: 'test',
          displayOrder: 930,
          comboItems: [
            { menuItemId: createdMenuItemId, quantity: 1 },
            { menuItemId: baseMenuItemId, quantity: 1 },
          ],
        }),
      });
      createdComboId = createCombo.body?.data?.id ?? '';
      add(
        '4.1 POST /api/combos cria combo via Admin',
        createCombo.status,
        createCombo.status === 201 && Boolean(createdComboId),
        `comboId=${createdComboId || '?'}`,
      );
    } catch (error) {
      add('4.1 POST /api/combos cria combo via Admin', 0, false, String(error));
    }
  }

  if (createdComboId) {
    try {
      const adminCombos = await req('/api/admin/combos', { headers: authHeader(adminToken) });
      const found = Array.isArray(adminCombos.body?.data)
        ? adminCombos.body.data.some((combo) => combo.id === createdComboId)
        : false;
      add(
        '4.2 GET /api/admin/combos exibe combo criado',
        adminCombos.status,
        adminCombos.status === 200 && found,
        `encontrado=${found}`,
      );
    } catch (error) {
      add('4.2 GET /api/admin/combos exibe combo criado', 0, false, String(error));
    }

    try {
      const publicCombos = await req('/api/combos');
      const found = Array.isArray(publicCombos.body?.data)
        ? publicCombos.body.data.some((combo) => combo.id === createdComboId)
        : false;
      add(
        '4.3 GET /api/combos publica combo para o Kiosk',
        publicCombos.status,
        publicCombos.status === 200 && found,
        `visivelNoKiosk=${found}`,
      );
    } catch (error) {
      add('4.3 GET /api/combos publica combo para o Kiosk', 0, false, String(error));
    }

    try {
      const updateCombo = await req(`/api/combos/${createdComboId}`, {
        method: 'PUT',
        headers: { ...authHeader(adminToken), 'content-type': 'application/json' },
        body: JSON.stringify({ price: 45.5 }),
      });
      add(
        '4.4 PUT /api/combos/:id atualiza preco do combo',
        updateCombo.status,
        updateCombo.status === 200 && updateCombo.body?.data?.price === 45.5,
        `price=${updateCombo.body?.data?.price ?? '?'}`,
      );
    } catch (error) {
      add('4.4 PUT /api/combos/:id atualiza preco do combo', 0, false, String(error));
    }

    try {
      const disableCombo = await req(`/api/combos/${createdComboId}/availability`, {
        method: 'PATCH',
        headers: { ...authHeader(adminToken), 'content-type': 'application/json' },
        body: JSON.stringify({ isAvailable: false }),
      });
      const publicCombos = await req('/api/combos');
      const hidden = Array.isArray(publicCombos.body?.data)
        ? !publicCombos.body.data.some((combo) => combo.id === createdComboId)
        : false;
      add(
        '4.5 PATCH /api/combos/:id/availability remove combo do Kiosk',
        disableCombo.status,
        disableCombo.status === 200 && hidden,
        `escondido=${hidden}`,
      );
    } catch (error) {
      add('4.5 PATCH /api/combos/:id/availability remove combo do Kiosk', 0, false, String(error));
    }
  }

  try {
    const createUser = await req('/api/users', {
      method: 'POST',
      headers: { ...authHeader(adminToken), 'content-type': 'application/json' },
      body: JSON.stringify({
        email: `staff.phase5.${runId}@sistema.local`,
        password: 'phase5123',
        role: 'STAFF',
        name: `Staff Phase5 ${runId}`,
        isActive: true,
      }),
    });
    createdUserId = createUser.body?.data?.id ?? '';
    add(
      '5.1 POST /api/users cria usuario interno',
      createUser.status,
      createUser.status === 201 && Boolean(createdUserId),
      `userId=${createdUserId || '?'}`,
    );
  } catch (error) {
    add('5.1 POST /api/users cria usuario interno', 0, false, String(error));
  }

  if (createdUserId) {
    try {
      const listUsers = await req('/api/users', { headers: authHeader(adminToken) });
      const found = Array.isArray(listUsers.body?.data)
        ? listUsers.body.data.some((user) => user.id === createdUserId)
        : false;
      add(
        '5.2 GET /api/users lista usuario criado',
        listUsers.status,
        listUsers.status === 200 && found,
        `encontrado=${found}`,
      );
    } catch (error) {
      add('5.2 GET /api/users lista usuario criado', 0, false, String(error));
    }

    try {
      const updateUser = await req(`/api/users/${createdUserId}`, {
        method: 'PUT',
        headers: { ...authHeader(adminToken), 'content-type': 'application/json' },
        body: JSON.stringify({
          name: `Staff Phase5 Atualizado ${runId}`,
          role: 'STAFF',
          isActive: true,
        }),
      });
      add(
        '5.3 PUT /api/users/:id atualiza nome do usuario',
        updateUser.status,
        updateUser.status === 200 && String(updateUser.body?.data?.name || '').includes('Atualizado'),
        `name=${updateUser.body?.data?.name ?? '?'}`,
      );
    } catch (error) {
      add('5.3 PUT /api/users/:id atualiza nome do usuario', 0, false, String(error));
    }

    try {
      const loginUser = await req('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: `staff.phase5.${runId}@sistema.local`, password: 'phase5123' }),
      });
      add(
        '5.4 Usuario criado consegue autenticar',
        loginUser.status,
        loginUser.status === 200 && loginUser.body?.user?.role === 'STAFF',
        `role=${loginUser.body?.user?.role ?? '?'}`,
      );
    } catch (error) {
      add('5.4 Usuario criado consegue autenticar', 0, false, String(error));
    }

    try {
      const deactivateUser = await req(`/api/users/${createdUserId}/status`, {
        method: 'PATCH',
        headers: { ...authHeader(adminToken), 'content-type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      });
      const loginInactive = await req('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: `staff.phase5.${runId}@sistema.local`, password: 'phase5123' }),
      });
      add(
        '5.5 PATCH /api/users/:id/status desativa usuario e bloqueia login',
        deactivateUser.status,
        deactivateUser.status === 200 && loginInactive.status === 401,
        `loginAposDesativacao=${loginInactive.status}`,
      );
    } catch (error) {
      add('5.5 PATCH /api/users/:id/status desativa usuario e bloqueia login', 0, false, String(error));
    }
  }

  try {
    const dashboard = await req(`/api/reports/dashboard?startDate=${today}&endDate=${today}`, {
      headers: authHeader(adminToken),
    });
    const totals = dashboard.body?.data?.totals;
    add(
      '6.1 GET /api/reports/dashboard retorna resumo do dia',
      dashboard.status,
      dashboard.status === 200 && typeof totals?.grossSales === 'number',
      `grossSales=${totals?.grossSales ?? '?'}`,
    );
  } catch (error) {
    add('6.1 GET /api/reports/dashboard retorna resumo do dia', 0, false, String(error));
  }

  try {
    const sales = await req(`/api/reports/sales?startDate=${today}&endDate=${today}`, {
      headers: authHeader(adminToken),
    });
    const hasDailyTotals = Array.isArray(sales.body?.data?.dailyTotals);
    add(
      '6.2 GET /api/reports/sales retorna agregado e serie diaria',
      sales.status,
      sales.status === 200 && hasDailyTotals,
      `dailyTotals=${sales.body?.data?.dailyTotals?.length ?? 0}`,
    );
  } catch (error) {
    add('6.2 GET /api/reports/sales retorna agregado e serie diaria', 0, false, String(error));
  }

  if (createdMenuItemId) {
    try {
      const deactivateItem = await req(`/api/menu/${createdMenuItemId}`, {
        method: 'DELETE',
        headers: authHeader(adminToken),
      });
      add(
        '7.1 DELETE /api/menu/:id faz soft delete do item de teste',
        deactivateItem.status,
        deactivateItem.status === 200 && deactivateItem.body?.data?.isAvailable === false,
        `isAvailable=${deactivateItem.body?.data?.isAvailable}`,
      );
    } catch (error) {
      add('7.1 DELETE /api/menu/:id faz soft delete do item de teste', 0, false, String(error));
    }
  }

  const passed = results.filter((result) => result.ok).length;
  const failed = results.length - passed;

  console.log('\n=== FASE 5 - ADMIN MANUAL FLOW ===');
  console.table(results);
  console.log(`\nResumo: ${passed}/${results.length} testes OK, ${failed} falharam.`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('Falha ao executar validacao manual da fase 5:', error);
  process.exit(1);
});
