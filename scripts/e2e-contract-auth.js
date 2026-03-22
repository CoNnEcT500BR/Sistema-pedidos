const {
  req,
  assertStatus,
  assertShape,
  authHeader,
  loginAs,
} = require('./e2e-utils');

async function main() {
  console.log('\n[E2E Contract Auth] Inicio');

  const badPayload = await req('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'nao-e-email', password: '' }),
  });
  assertStatus(badPayload.status, 400, 'Login payload invalido');

  const badCredentials = await req('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'admin@sistema.local', password: 'senha-invalida' }),
  });
  assertStatus(badCredentials.status, 401, 'Login credenciais invalidas');

  const meWithoutToken = await req('/api/auth/me');
  assertStatus(meWithoutToken.status, 401, 'Auth me sem token');

  const token = await loginAs('admin@sistema.local', 'admin123');

  const me = await req('/api/auth/me', {
    headers: authHeader(token),
  });
  assertStatus(me.status, 200, 'Auth me com token');
  assertShape(me.body?.user, ['id', 'email', 'role'], 'Contrato auth/me');

  const meWithInvalidToken = await req('/api/auth/me', {
    headers: authHeader('token-invalido'),
  });
  assertStatus(meWithInvalidToken.status, 401, 'Auth me token invalido');

  console.log('[E2E Contract Auth] Validado com sucesso\n');
}

main().catch((error) => {
  console.error(`\n[E2E Contract Auth] Falha: ${error.message}`);
  process.exit(1);
});
