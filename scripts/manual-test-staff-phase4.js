/**
 * manual-test-staff-phase4.js
 * Validação manual dos fluxos da Fase 4 (Frontend Staff – API Layer)
 *
 * Execução: node scripts/manual-test-staff-phase4.js
 * Pré-requisito: servidor rodando em http://localhost:3001
 */

const BASE = "http://localhost:3001";
const results = [];

const add = (test, status, ok, detail) =>
  results.push({ test, status: String(status), ok, detail });

async function req(path, opt = {}) {
  const res = await fetch(BASE + path, opt);
  const text = await res.text();
  let body = null;
  try { body = JSON.parse(text); } catch { body = null; }
  return { status: res.status, body };
}

function authHeader(token) {
  return { authorization: "Bearer " + token };
}

async function main() {
  let staffToken = "";
  let adminToken = "";
  let createdOrderId = "";
  let createdOrderNumber = 0;

  // ─────────────────────────────────────────────
  // BLOCO 1: Autenticação Staff
  // ─────────────────────────────────────────────

  try {
    const r = await req("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "staff@sistema.local", password: "staff123" }),
    });
    staffToken = r.body?.token ?? "";
    add(
      "1.1 Login Staff - credenciais válidas",
      r.status,
      r.status === 200 && Boolean(staffToken) && r.body?.user?.role === "STAFF",
      `role=${r.body?.user?.role}`,
    );
  } catch (err) {
    add("1.1 Login Staff - credenciais válidas", 0, false, String(err));
  }

  try {
    const r = await req("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "staff@sistema.local", password: "senha_errada" }),
    });
    add("1.2 Login Staff - credenciais inválidas", r.status, r.status === 401, "401 esperado");
  } catch (err) {
    add("1.2 Login Staff - credenciais inválidas", 0, false, String(err));
  }

  try {
    const r = await req("/api/auth/me", {
      headers: { ...authHeader(staffToken), "content-type": "application/json" },
    });
    add(
      "1.3 Auth /me com token Staff",
      r.status,
      r.status === 200 && r.body?.user?.role === "STAFF",
      `role=${r.body?.user?.role}`,
    );
  } catch (err) {
    add("1.3 Auth /me com token Staff", 0, false, String(err));
  }

  try {
    const r = await req("/api/auth/me");
    add("1.4 Auth /me sem token", r.status, r.status === 401, "401 esperado");
  } catch (err) {
    add("1.4 Auth /me sem token", 0, false, String(err));
  }

  // ─────────────────────────────────────────────
  // BLOCO 2: Listagem de pedidos (requer autenticação)
  // ─────────────────────────────────────────────

  try {
    const r = await req("/api/orders");
    add("2.1 GET /orders sem token → 401", r.status, r.status === 401, "401 esperado");
  } catch (err) {
    add("2.1 GET /orders sem token → 401", 0, false, String(err));
  }

  try {
    const r = await req("/api/orders", { headers: authHeader(staffToken) });
    add(
      "2.2 GET /orders com token Staff",
      r.status,
      r.status === 200 && Array.isArray(r.body?.data),
      `count=${r.body?.data?.length ?? "?"}`,
    );
  } catch (err) {
    add("2.2 GET /orders com token Staff", 0, false, String(err));
  }

  try {
    const today = new Date().toISOString().split("T")[0];
    const r = await req(`/api/orders?date=${today}`, { headers: authHeader(staffToken) });
    add(
      "2.3 GET /orders?date=hoje",
      r.status,
      r.status === 200 && Array.isArray(r.body?.data),
      `count=${r.body?.data?.length ?? "?"}`,
    );
  } catch (err) {
    add("2.3 GET /orders?date=hoje", 0, false, String(err));
  }

  try {
    const r = await req("/api/orders?status=PENDING", { headers: authHeader(staffToken) });
    const allPending =
      Array.isArray(r.body?.data) && r.body.data.every((o) => o.status === "PENDING");
    add(
      "2.4 GET /orders?status=PENDING filtra corretamente",
      r.status,
      r.status === 200 && allPending,
      `count=${r.body?.data?.length ?? "?"} todos PENDING=${allPending}`,
    );
  } catch (err) {
    add("2.4 GET /orders?status=PENDING", 0, false, String(err));
  }

  // ─────────────────────────────────────────────
  // BLOCO 3: Criação de pedido pelo balcão
  // ─────────────────────────────────────────────

  // Buscar um item de menu disponível para usar no pedido
  let menuItemId = "";
  try {
    const r = await req("/api/menu");
    const available = r.body?.data?.find((i) => i.isAvailable);
    menuItemId = available?.id ?? "";
    add("3.1 Buscar item disponível no menu", r.status, Boolean(menuItemId), `itemId=${menuItemId}`);
  } catch (err) {
    add("3.1 Buscar item disponível no menu", 0, false, String(err));
  }

  if (menuItemId) {
    try {
      const runId = Date.now().toString(36);
      const payload = {
        customerName: `Funcionario-${runId}`,
        notes: "Pedido de teste fase 4",
        items: [{ menuItemId, quantity: 2, addons: [] }],
      };
      // POST /orders é público — não requer token
      const r = await req("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      createdOrderId = r.body?.data?.id ?? "";
      createdOrderNumber = r.body?.data?.orderNumber ?? 0;
      add(
        "3.2 Criar pedido via POST /orders",
        r.status,
        r.status === 201 && Boolean(createdOrderId),
        `orderNumber=${createdOrderNumber}`,
      );
    } catch (err) {
      add("3.2 Criar pedido via POST /orders", 0, false, String(err));
    }
  }

  // ─────────────────────────────────────────────
  // BLOCO 4: Detalhe do pedido
  // ─────────────────────────────────────────────

  if (createdOrderId) {
    try {
      const r = await req(`/api/orders/${createdOrderId}`, {
        headers: authHeader(staffToken),
      });
      const hasItems = Array.isArray(r.body?.data?.items) && r.body.data.items.length > 0;
      const hasHistory = Array.isArray(r.body?.data?.statusHistory) && r.body.data.statusHistory.length > 0;
      add(
        "4.1 GET /orders/:id — itens e histórico presentes",
        r.status,
        r.status === 200 && hasItems && hasHistory,
        `items=${r.body?.data?.items?.length ?? 0} history=${r.body?.data?.statusHistory?.length ?? 0}`,
      );
    } catch (err) {
      add("4.1 GET /orders/:id", 0, false, String(err));
    }

    try {
      const r = await req(`/api/orders/${createdOrderId}`);
      add("4.2 GET /orders/:id sem token → 401", r.status, r.status === 401, "401 esperado");
    } catch (err) {
      add("4.2 GET /orders/:id sem token → 401", 0, false, String(err));
    }
  }

  // ─────────────────────────────────────────────
  // BLOCO 5: Fluxo completo de status (Staff)
  // ─────────────────────────────────────────────

  const statusFlow = [
    { from: "PENDING", to: "CONFIRMED", label: "Confirmar pedido" },
    { from: "CONFIRMED", to: "PREPARING", label: "Iniciar preparo" },
    { from: "PREPARING", to: "READY", label: "Marcar pronto" },
    { from: "READY", to: "COMPLETED", label: "Finalizar" },
  ];

  for (const step of statusFlow) {
    if (!createdOrderId) {
      add(`5.x ${step.label}`, 0, false, "Sem orderId");
      continue;
    }
    try {
      const r = await req(`/api/orders/${createdOrderId}/status`, {
        method: "PATCH",
        headers: { ...authHeader(staffToken), "content-type": "application/json" },
        body: JSON.stringify({ status: step.to }),
      });
      add(
        `5 Status: ${step.from} → ${step.to} (${step.label})`,
        r.status,
        r.status === 200 && r.body?.data?.status === step.to,
        `status=${r.body?.data?.status}`,
      );
    } catch (err) {
      add(`5 Status: ${step.from} → ${step.to}`, 0, false, String(err));
    }
  }

  // Transição inválida após COMPLETED
  if (createdOrderId) {
    try {
      const r = await req(`/api/orders/${createdOrderId}/status`, {
        method: "PATCH",
        headers: { ...authHeader(staffToken), "content-type": "application/json" },
        body: JSON.stringify({ status: "PENDING" }),
      });
      add(
        "5.5 Transição inválida COMPLETED → PENDING",
        r.status,
        r.status === 400,
        "400 esperado",
      );
    } catch (err) {
      add("5.5 Transição inválida COMPLETED → PENDING", 0, false, String(err));
    }
  }

  // ─────────────────────────────────────────────
  // BLOCO 6: Admin também acessa pedidos
  // ─────────────────────────────────────────────

  try {
    const r = await req("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "admin@sistema.local", password: "admin123" }),
    });
    adminToken = r.body?.token ?? "";
    add("6.1 Login Admin", r.status, r.status === 200 && Boolean(adminToken), "ok");
  } catch (err) {
    add("6.1 Login Admin", 0, false, String(err));
  }

  try {
    const r = await req("/api/orders", { headers: authHeader(adminToken) });
    add(
      "6.2 Admin acessa GET /orders",
      r.status,
      r.status === 200 && Array.isArray(r.body?.data),
      `count=${r.body?.data?.length ?? "?"}`,
    );
  } catch (err) {
    add("6.2 Admin acessa GET /orders", 0, false, String(err));
  }

  // ─────────────────────────────────────────────
  // Resultado Final
  // ─────────────────────────────────────────────

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  console.log("\n══════════════════════════════════════════════════");
  console.log("  FASE 4 – Manual Test Results");
  console.log("══════════════════════════════════════════════════");
  results.forEach((r) => {
    const icon = r.ok ? "✓" : "✗";
    console.log(`  ${icon} [${r.status}] ${r.test} — ${r.detail}`);
  });
  console.log("──────────────────────────────────────────────────");
  console.log(`  TOTAL: ${passed + failed}  PASSED: ${passed}  FAILED: ${failed}`);
  console.log("══════════════════════════════════════════════════\n");

  console.log(JSON.stringify({ passed, failed, results }, null, 2));
}

main().catch(console.error);
