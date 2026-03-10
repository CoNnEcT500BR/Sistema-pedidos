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

  return { status: response.status, body, bodyText };
}

async function main() {
  const addonsResponse = await req('/api/addons');
  const addons = addonsResponse.body?.data || [];
  add('Addons listar ativos', addonsResponse.status, addonsResponse.status === 200 && addons.length > 0, `addons=${addons.length}`);

  const menuResponse = await req('/api/menu');
  const menuItem = (menuResponse.body?.data || []).find((item) => item.name === 'Classic Burger');
  add('Addons carregar menu item', menuResponse.status, menuResponse.status === 200 && Boolean(menuItem), 'menu item encontrado');

  const allowedAddonsResponse = await req('/api/menu/' + menuItem.id + '/addons');
  const allowedAddons = allowedAddonsResponse.body?.data || [];
  add('Addons filtrar por item', allowedAddonsResponse.status, allowedAddonsResponse.status === 200 && allowedAddons.length > 0, `addons_item=${allowedAddons.length}`);

  const invalidItemResponse = await req('/api/menu/inexistente/addons');
  add('Addons item inexistente', invalidItemResponse.status, invalidItemResponse.status === 404, '404 esperado');

  const docsUiResponse = await req('/docs');
  const hasHtml = (docsUiResponse.bodyText || '').includes('<!DOCTYPE html>') || (docsUiResponse.bodyText || '').includes('<html');
  add('Swagger UI /docs', docsUiResponse.status, docsUiResponse.status === 200 && hasHtml, 'pagina docs acessivel');

  const docsJsonResponse = await req('/docs/json');
  const openapiTitle = docsJsonResponse.body?.info?.title;
  add('Swagger JSON /docs/json', docsJsonResponse.status, docsJsonResponse.status === 200 && Boolean(openapiTitle), `title=${openapiTitle || 'n/a'}`);

  const failed = results.filter((r) => !r.ok);
  console.log(JSON.stringify({ total: results.length, passed: results.length - failed.length, failed: failed.length, results }, null, 2));

  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
