const base = "http://localhost:3001";

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
  const runId = Date.now().toString(36);
  let adminToken = "";
  let firstCategory = "";
  let firstItem = "";
  let createdItem = "";

  try {
    const r = await req("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "admin@sistema.local", password: "admin123" }),
    });
    adminToken = r.body?.token || "";
    add("Auth login valido", r.status, r.status === 200 && Boolean(adminToken), "token retornado");
  } catch (error) {
    add("Auth login valido", 0, false, String(error));
  }

  try {
    const r = await req("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "admin@sistema.local", password: "senhaerrada" }),
    });
    add("Auth login invalido", r.status, r.status === 401, "401 esperado");
  } catch (error) {
    add("Auth login invalido", 0, false, String(error));
  }

  try {
    const r = await req("/api/auth/me");
    add("Auth me sem token", r.status, r.status === 401, "401 esperado");
  } catch (error) {
    add("Auth me sem token", 0, false, String(error));
  }

  try {
    const r = await req("/api/auth/me", {
      headers: { authorization: "Bearer " + adminToken },
    });
    add(
      "Auth me com token",
      r.status,
      r.status === 200 && r.body?.user?.role === "ADMIN",
      "usuario autenticado",
    );
  } catch (error) {
    add("Auth me com token", 0, false, String(error));
  }

  try {
    const r = await req("/api/categories");
    firstCategory = r.body?.data?.[0]?.id || "";
    add("Menu categories", r.status, r.status === 200 && (r.body?.data?.length || 0) > 0, "ok");
  } catch (error) {
    add("Menu categories", 0, false, String(error));
  }

  try {
    const r = await req("/api/menu");
    firstItem = r.body?.data?.[0]?.id || "";
    add("Menu listar itens", r.status, r.status === 200 && (r.body?.data?.length || 0) > 0, "ok");
  } catch (error) {
    add("Menu listar itens", 0, false, String(error));
  }

  try {
    const r = await req("/api/menu?category=" + firstCategory);
    add("Menu filtro categoria", r.status, r.status === 200, "ok");
  } catch (error) {
    add("Menu filtro categoria", 0, false, String(error));
  }

  try {
    const r = await req("/api/menu/" + firstItem);
    add("Menu detalhe item", r.status, r.status === 200 && r.body?.data?.id === firstItem, "ok");
  } catch (error) {
    add("Menu detalhe item", 0, false, String(error));
  }

  try {
    const r = await req("/api/menu", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ categoryId: firstCategory, name: "Teste sem token", price: 10 }),
    });
    add("Menu criar sem token", r.status, r.status === 401, "401 esperado");
  } catch (error) {
    add("Menu criar sem token", 0, false, String(error));
  }

  try {
    const r = await req("/api/menu", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer " + adminToken,
      },
      body: JSON.stringify({
        categoryId: firstCategory,
        name: "Item Teste QA " + runId,
        description: "criado em teste manual",
        price: 19.9,
        displayOrder: 99,
      }),
    });
    createdItem = r.body?.data?.id || "";
    add("Menu criar com admin", r.status, r.status === 201 && Boolean(createdItem), "201 esperado");
  } catch (error) {
    add("Menu criar com admin", 0, false, String(error));
  }

  if (!createdItem) {
    add("Menu editar item", 0, false, "item nao criado no passo anterior");
  } else {
    try {
      const r = await req("/api/menu/" + createdItem, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer " + adminToken,
        },
        body: JSON.stringify({ price: 21.5, description: "editado no teste" }),
      });
      add("Menu editar item", r.status, r.status === 200 && r.body?.data?.price === 21.5, "200 esperado");
    } catch (error) {
      add("Menu editar item", 0, false, String(error));
    }
  }

  if (!createdItem) {
    add("Menu indisponivel", 0, false, "item nao criado no passo anterior");
  } else {
    try {
      const r = await req("/api/menu/" + createdItem + "/availability", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer " + adminToken,
        },
        body: JSON.stringify({ isAvailable: false }),
      });
      add("Menu indisponivel", r.status, r.status === 200 && r.body?.data?.isAvailable === false, "200 esperado");
    } catch (error) {
      add("Menu indisponivel", 0, false, String(error));
    }
  }

  if (!createdItem) {
    add("Menu delete soft", 0, false, "item nao criado no passo anterior");
  } else {
    try {
      const r = await req("/api/menu/" + createdItem, {
        method: "DELETE",
        headers: { authorization: "Bearer " + adminToken },
      });
      add("Menu delete soft", r.status, r.status === 200, "200 esperado");
    } catch (error) {
      add("Menu delete soft", 0, false, String(error));
    }
  }

  const failed = results.filter((r) => !r.ok);
  console.log(JSON.stringify({ total: results.length, passed: results.length - failed.length, failed: failed.length, results }, null, 2));

  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
