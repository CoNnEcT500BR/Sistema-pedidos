const {
  req,
  assertStatus,
  assertShape,
  authHeader,
  loginAs,
  parseDataArray,
} = require('./e2e-utils');

async function main() {
  console.log('\n[E2E Contract Users] Inicio');

  const adminToken = await loginAs('admin@sistema.local', 'admin123');
  const staffToken = await loginAs('staff@sistema.local', 'staff123');

  const withoutToken = await req('/api/users');
  assertStatus(withoutToken.status, 401, 'Users list sem token');

  const withStaff = await req('/api/users', {
    headers: authHeader(staffToken),
  });
  assertStatus(withStaff.status, 403, 'Users list sem role ADMIN');

  const usersList = await req('/api/users', {
    headers: authHeader(adminToken),
  });
  assertStatus(usersList.status, 200, 'Users list com ADMIN');
  parseDataArray(usersList.body);

  const runId = Date.now().toString(36);
  const email = `e2e-user-${runId}@sistema.local`;

  const created = await req('/api/users', {
    method: 'POST',
    headers: {
      ...authHeader(adminToken),
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password: 'abc12345',
      role: 'STAFF',
      name: `E2E User ${runId}`,
      isActive: true,
    }),
  });
  assertStatus(created.status, 201, 'Users create');
  assertShape(created.body?.data, ['id', 'email', 'role', 'isActive'], 'Contrato create user');
  const userId = created.body.data.id;

  const duplicated = await req('/api/users', {
    method: 'POST',
    headers: {
      ...authHeader(adminToken),
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password: 'abc12345',
      role: 'STAFF',
    }),
  });
  assertStatus(duplicated.status, 400, 'Users create email duplicado');

  const invalidRole = await req(`/api/users/${userId}`, {
    method: 'PUT',
    headers: {
      ...authHeader(adminToken),
      'content-type': 'application/json',
    },
    body: JSON.stringify({ role: 'INVALID' }),
  });
  assertStatus(invalidRole.status, 400, 'Users update role invalido');

  const missing = await req('/api/users/user-inexistente/status', {
    method: 'PATCH',
    headers: {
      ...authHeader(adminToken),
      'content-type': 'application/json',
    },
    body: JSON.stringify({ isActive: false }),
  });
  assertStatus(missing.status, 404, 'Users status em usuario inexistente');

  const deleted = await req(`/api/users/${userId}`, {
    method: 'DELETE',
    headers: authHeader(adminToken),
  });
  assertStatus(deleted.status, 200, 'Users delete');

  console.log('[E2E Contract Users] Validado com sucesso\n');
}

main().catch((error) => {
  console.error(`\n[E2E Contract Users] Falha: ${error.message}`);
  process.exit(1);
});
