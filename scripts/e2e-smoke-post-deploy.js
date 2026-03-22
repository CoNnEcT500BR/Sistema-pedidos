const {
  req,
  assertStatus,
  assertShape,
  authHeader,
  loginAs,
  parseDataArray,
} = require('./e2e-utils');

async function main() {
  console.log('\n[Smoke Pos Deploy] Inicio');

  const health = await req('/health');
  assertStatus(health.status, 200, 'Health check');
  assertShape(health.body, ['status', 'timestamp', 'uptime'], 'Contrato health');

  const status = await req('/status');
  assertStatus(status.status, 200, 'Status endpoint');

  const ping = await req('/ping');
  assertStatus(ping.status, 200, 'Ping endpoint');

  const categories = await req('/api/categories');
  assertStatus(categories.status, 200, 'Categorias publicas');
  const categoriesData = parseDataArray(categories.body);
  if (categoriesData.length === 0) {
    throw new Error('Categorias publicas vazias');
  }

  const menu = await req('/api/menu');
  assertStatus(menu.status, 200, 'Menu publico');
  const menuData = parseDataArray(menu.body);
  if (menuData.length === 0) {
    throw new Error('Menu publico vazio');
  }

  const combos = await req('/api/combos');
  assertStatus(combos.status, 200, 'Combos publicos');

  const token = await loginAs('admin@sistema.local', 'admin123');

  const orders = await req('/api/orders?limit=5', {
    headers: authHeader(token),
  });
  assertStatus(orders.status, 200, 'Orders autenticado');

  const reports = await req('/api/reports/dashboard', {
    headers: authHeader(token),
  });
  assertStatus(reports.status, 200, 'Reports dashboard autenticado');

  const telemetryAccepted = await req('/api/telemetry/events', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      event: 'smoke_post_deploy',
      timestamp: new Date().toISOString(),
      sessionId: `smoke-${Date.now()}`,
      path: '/health',
      metadata: {
        source: 'e2e-smoke-post-deploy',
      },
    }),
  });
  assertStatus(telemetryAccepted.status, 202, 'Telemetry ingestao');

  console.log('[Smoke Pos Deploy] Validado com sucesso\n');
}

main().catch((error) => {
  console.error(`\n[Smoke Pos Deploy] Falha: ${error.message}`);
  process.exit(1);
});
