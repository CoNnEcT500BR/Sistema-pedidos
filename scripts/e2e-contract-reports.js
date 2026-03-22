const {
  req,
  assertStatus,
  assertShape,
  authHeader,
  loginAs,
} = require('./e2e-utils');

async function main() {
  console.log('\n[E2E Contract Reports] Inicio');

  const adminToken = await loginAs('admin@sistema.local', 'admin123');
  const staffToken = await loginAs('staff@sistema.local', 'staff123');

  const withoutToken = await req('/api/reports/dashboard');
  assertStatus(withoutToken.status, 401, 'Reports dashboard sem token');

  const withStaff = await req('/api/reports/dashboard', {
    headers: authHeader(staffToken),
  });
  assertStatus(withStaff.status, 403, 'Reports dashboard sem role ADMIN');

  const invalidDateRange = await req('/api/reports/sales?startDate=2026-03-01', {
    headers: authHeader(adminToken),
  });
  assertStatus(invalidDateRange.status, 400, 'Reports com range invalido');

  const dashboard = await req('/api/reports/dashboard', {
    headers: authHeader(adminToken),
  });
  assertStatus(dashboard.status, 200, 'Reports dashboard com ADMIN');
  assertShape(
    dashboard.body?.data,
    ['period', 'totals', 'statusBreakdown', 'topItems', 'salesByCategory', 'recentOrders'],
    'Contrato reports dashboard',
  );

  const sales = await req('/api/reports/sales?startDate=2026-03-01&endDate=2026-03-22', {
    headers: authHeader(adminToken),
  });
  assertStatus(sales.status, 200, 'Reports sales com ADMIN');
  assertShape(sales.body?.data, ['dailyTotals', 'exportGeneratedAt', 'totals'], 'Contrato reports sales');

  console.log('[E2E Contract Reports] Validado com sucesso\n');
}

main().catch((error) => {
  console.error(`\n[E2E Contract Reports] Falha: ${error.message}`);
  process.exit(1);
});
