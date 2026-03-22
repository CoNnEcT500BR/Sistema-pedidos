/**
 * E2E UI Menu Assembly vs Extra (Playwright)
 *
 * Teste visual frontend com API mockada para validar que:
 * - ingredientes de montagem ficam na secao de remocao
 * - ingredientes extras ficam na secao de adicionar extras
 */

const { chromium } = require('playwright');

const FRONTEND_BASE = process.env.E2E_FRONTEND_BASE || 'http://localhost:5173';

function fail(message) {
  throw new Error(message);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function main() {
  console.log('\n[E2E UI Menu Assembly/Extra] Inicio');

  const category = {
    id: 'cat-ui-assembly-extra',
    name: 'Categoria UI Assembly Extra',
    description: 'Categoria de teste visual',
    displayOrder: 1,
    isActive: true,
  };

  const item = {
    id: 'item-ui-assembly-extra',
    categoryId: category.id,
    name: 'UI Burger Assembly Extra',
    description: 'Item de teste visual',
    price: 22,
    isAvailable: true,
    displayOrder: 1,
  };

  const assemblyAddon = {
    id: 'addon-ui-assembly',
    name: 'UI Ingredient Assembly',
    addonType: 'SUBSTITUTION',
    assignmentType: 'ASSEMBLY',
    price: 0,
    isRequired: true,
    isActive: true,
  };

  const extraAddon = {
    id: 'addon-ui-extra',
    name: 'UI Ingredient Extra',
    addonType: 'EXTRA',
    assignmentType: 'EXTRA',
    price: 3,
    isRequired: false,
    isActive: true,
  };

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });

  try {
    await page.route('**/api/**', async (route) => {
      const requestUrl = new URL(route.request().url());
      const { pathname, searchParams } = requestUrl;

      let response;
      if (pathname === '/api/categories') {
        response = { data: [category] };
      } else if (pathname === '/api/menu') {
        const categoryParam = searchParams.get('category');
        response = {
          data: categoryParam === category.id ? [item] : [],
        };
      } else if (pathname === '/api/combos') {
        response = { data: [] };
      } else if (pathname === `/api/menu/${item.id}/addons`) {
        response = { data: [assemblyAddon, extraAddon] };
      } else {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Endpoint mockado nao encontrado' }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });

    await page.goto(`${FRONTEND_BASE}/kiosk/menu`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    const categoryRegex = new RegExp(escapeRegex(category.name), 'i');
    const categoryButton = page.getByRole('button', { name: categoryRegex }).first();
    await categoryButton.waitFor({ timeout: 10000 });
    await categoryButton.click();

    await page.waitForURL(new RegExp(`/kiosk/menu/${escapeRegex(category.id)}`), {
      timeout: 10000,
    });

    const itemRegex = new RegExp(escapeRegex(item.name), 'i');
    const itemTitle = page.getByRole('heading', { name: itemRegex }).first();
    await itemTitle.waitFor({ timeout: 10000 });

    const addButton = page.getByRole('button', { name: itemRegex }).first();
    await addButton.click();

    const dialog = page.locator('[role="dialog"]');
    await dialog.waitFor({ timeout: 10000 });

    const removeSection = dialog.getByText(/Remover|Remove/i).first();
    const extraSection = dialog.getByText(/Adicionar extras|Add extras/i).first();

    if ((await removeSection.count()) === 0) {
      fail('Secao de montagem/remocao nao encontrada no modal');
    }

    if ((await extraSection.count()) === 0) {
      fail('Secao de extras nao encontrada no modal');
    }

    const assemblyInDialog = dialog.getByText(assemblyAddon.name, { exact: true });
    const extraInDialog = dialog.getByText(extraAddon.name, { exact: true });

    if ((await assemblyInDialog.count()) === 0) {
      fail('Ingrediente de montagem nao apareceu no modal');
    }

    if ((await extraInDialog.count()) === 0) {
      fail('Ingrediente extra nao apareceu no modal');
    }

    console.log('[E2E UI Menu Assembly/Extra] Validado com sucesso');
    console.log('[E2E UI Menu Assembly/Extra] Finalizado\n');
  } finally {
    await page.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error(`\n[E2E UI Menu Assembly/Extra] Falha: ${error.message}`);
  process.exit(1);
});
