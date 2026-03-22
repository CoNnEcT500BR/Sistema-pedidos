const BASE = process.env.E2E_API_BASE || 'http://localhost:3001';

function fail(message) {
  throw new Error(message);
}

async function req(path, options = {}) {
  const response = await fetch(BASE + path, options);
  const text = await response.text();
  let body = null;

  try {
    body = JSON.parse(text);
  } catch {
    body = null;
  }

  return {
    status: response.status,
    body,
    raw: text,
    headers: response.headers,
  };
}

function assertStatus(actual, expected, label) {
  if (actual !== expected) {
    fail(`${label}: esperado HTTP ${expected}, recebido ${actual}`);
  }
}

function assertStatusIn(actual, expectedList, label) {
  if (!expectedList.includes(actual)) {
    fail(`${label}: esperado HTTP ${expectedList.join(' ou ')}, recebido ${actual}`);
  }
}

function assertShape(value, requiredKeys, label) {
  if (!value || typeof value !== 'object') {
    fail(`${label}: resposta ausente`);
  }

  for (const key of requiredKeys) {
    if (!(key in value)) {
      fail(`${label}: chave obrigatoria ausente (${key})`);
    }
  }
}

function authHeader(token) {
  return {
    authorization: `Bearer ${token}`,
  };
}

async function loginAs(email, password) {
  const loginRes = await req('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  assertStatus(loginRes.status, 200, `Login ${email}`);
  const token = loginRes.body?.token;
  if (!token) {
    fail(`Login ${email}: token ausente`);
  }

  return token;
}

function parseDataArray(body) {
  const data = body?.data;
  if (!Array.isArray(data)) {
    fail('Resposta esperada em formato data[]');
  }

  return data;
}

module.exports = {
  BASE,
  fail,
  req,
  assertStatus,
  assertStatusIn,
  assertShape,
  authHeader,
  loginAs,
  parseDataArray,
};
