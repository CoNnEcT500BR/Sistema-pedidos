const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const rootDir = path.resolve(__dirname, "..");
const runBuild = !process.argv.includes("--skip-build");
const runTypeCheck = !process.argv.includes("--skip-typecheck") && !process.argv.includes("--skip-test");
const runServerCheck = !process.argv.includes("--skip-server-check");

const results = [];

function add(test, status, ok, detail, skipped = false) {
  results.push({ test, status, ok, detail, skipped });
}

function resolveFromRoot(relativePath) {
  return path.join(rootDir, relativePath);
}

function fileExists(relativePath) {
  return fs.existsSync(resolveFromRoot(relativePath));
}

function readText(relativePath) {
  return fs.readFileSync(resolveFromRoot(relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function ensurePaths(test, relativePaths) {
  const missing = relativePaths.filter((relativePath) => !fileExists(relativePath));
  add(
    test,
    missing.length === 0 ? "OK" : "MISSING",
    missing.length === 0,
    missing.length === 0 ? "estrutura encontrada" : "faltando: " + missing.join(", "),
  );
}

function ensureTextIncludes(test, relativePath, expectedSnippets) {
  try {
    const content = readText(relativePath);
    const missing = expectedSnippets.filter((snippet) => !content.includes(snippet));
    add(
      test,
      missing.length === 0 ? "OK" : "MISSING",
      missing.length === 0,
      missing.length === 0 ? relativePath : "trechos ausentes: " + missing.join(" | "),
    );
  } catch (error) {
    add(test, "ERROR", false, String(error));
  }
}

function ensurePackageJson(test, relativePath, validator) {
  try {
    const packageJson = readJson(relativePath);
    const detail = validator(packageJson);
    add(test, detail.ok ? "OK" : "INVALID", detail.ok, detail.detail);
  } catch (error) {
    add(test, "ERROR", false, String(error));
  }
}

function runCommand(command, args, label) {
  const executable = process.platform === "win32" ? command + ".cmd" : command;
  const commandLine = [executable, ...args].join(" ");
  const result = spawnSync(commandLine, {
    cwd: rootDir,
    encoding: "utf8",
    stdio: "pipe",
    shell: true,
  });

  if (result.error) {
    add(label, "ERROR", false, String(result.error));
    return;
  }

  const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
  add(
    label,
    result.status ?? "NO_EXIT_CODE",
    result.status === 0,
    output ? output.split(/\r?\n/).slice(-8).join(" | ") : "comando executado sem saida",
  );
}

async function checkServerHealth() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const response = await fetch("http://localhost:3001/health", { signal: controller.signal });
    clearTimeout(timeout);

    const bodyText = await response.text();
    let body = null;
    try {
      body = JSON.parse(bodyText);
    } catch {
      body = null;
    }

    add(
      "Backend health em execucao",
      response.status,
      response.status === 200 && body?.status === "ok",
      body?.status === "ok" ? "health respondeu status=ok" : bodyText,
    );
  } catch (error) {
    add(
      "Backend health em execucao",
      "SKIP",
      true,
      "servidor nao esta ativo em http://localhost:3001; inicie-o para validar runtime",
      true,
    );
  }
}

async function main() {
  ensurePackageJson("Root workspaces e scripts", "package.json", (packageJson) => {
    const workspaces = Array.isArray(packageJson.workspaces) ? packageJson.workspaces : [];
    const scripts = packageJson.scripts || {};
    const missing = [];

    if (!workspaces.includes("apps/*")) missing.push("workspace apps/*");
    if (!workspaces.includes("packages/*")) missing.push("workspace packages/*");
    if (!scripts.dev) missing.push("script dev");
    if (!scripts.build) missing.push("script build");
    if (!scripts.test) missing.push("script test");
    if (!scripts.lint) missing.push("script lint");
    if (!scripts["type-check"]) missing.push("script type-check");

    return {
      ok: missing.length === 0,
      detail: missing.length === 0 ? "workspaces e scripts principais presentes" : missing.join(", "),
    };
  });

  ensurePaths("Documentacao base", ["README.md", "SETUP.md", "docs/IMPLEMENTATION_CHECKLIST.md", "docs/MVP_ROADMAP.md"]);

  ensurePackageJson("Backend package e scripts", "apps/server/package.json", (packageJson) => {
    const scripts = packageJson.scripts || {};
    const dependencies = packageJson.dependencies || {};
    const missing = [];

    ["dev", "build", "start", "type-check", "db:seed"].forEach((scriptName) => {
      if (!scripts[scriptName]) missing.push("script " + scriptName);
    });

    ["fastify", "@fastify/cors", "@fastify/jwt", "@prisma/client"].forEach((dependencyName) => {
      if (!dependencies[dependencyName]) missing.push("dep " + dependencyName);
    });

    return {
      ok: missing.length === 0,
      detail: missing.length === 0 ? "backend configurado" : missing.join(", "),
    };
  });

  ensurePaths("Backend estrutura de pastas", [
    "apps/server/src",
    "apps/server/src/modules",
    "apps/server/src/shared",
    "apps/server/src/config",
    "apps/server/src/types",
    "apps/server/prisma",
    "apps/server/prisma/migrations",
  ]);

  ensureTextIncludes("Backend tsconfig com aliases", "apps/server/tsconfig.json", ['"paths"', '"@/*"', '"@shared/*"']);
  ensureTextIncludes("Fastify setup inicial", "apps/server/src/app.ts", ["fastifyCors", "fastifyJwt", "app.get('/health'", "registerRoutes"]);
  ensureTextIncludes("Prisma configurado", "apps/server/prisma.config.ts", ["defineConfig", "schema: 'prisma/schema.prisma'", "seed: 'tsx prisma/seed.ts'", "datasource"]);
  ensureTextIncludes("Schema Prisma com entidades base", "apps/server/prisma/schema.prisma", ["model Category", "model MenuItem", "model Addon", "model Combo", "model Order", "model User"]);
  ensureTextIncludes("Seed com dados minimos", "apps/server/prisma/seed.ts", [
    "Hamburgueres",
    "Bebidas",
    "Acompanhamentos",
    "Classic Burger",
    "Combo Classico",
    "admin@sistema.local",
    "staff@sistema.local",
  ]);
  ensurePaths("Prisma migration inicial", [
    "apps/server/prisma/migrations/migration_lock.toml",
    "apps/server/prisma/migrations/20260308025452_init/migration.sql",
  ]);

  ensurePackageJson("Frontend package e dependencias base", "apps/frontend/package.json", (packageJson) => {
    const scripts = packageJson.scripts || {};
    const dependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};
    const missing = [];

    ["dev", "build", "type-check", "lint"].forEach((scriptName) => {
      if (!scripts[scriptName]) missing.push("script " + scriptName);
    });

    ["react-router-dom", "zustand", "axios"].forEach((dependencyName) => {
      if (!dependencies[dependencyName]) missing.push("dep " + dependencyName);
    });

    ["tailwindcss", "vite", "typescript"].forEach((dependencyName) => {
      if (!devDependencies[dependencyName]) missing.push("devDep " + dependencyName);
    });

    return {
      ok: missing.length === 0,
      detail: missing.length === 0 ? "frontend configurado" : missing.join(", "),
    };
  });

  ensurePaths("Frontend estrutura de pastas", [
    "apps/frontend/src/app",
    "apps/frontend/src/routes",
    "apps/frontend/src/routes/kiosk",
    "apps/frontend/src/routes/staff",
    "apps/frontend/src/routes/admin",
    "apps/frontend/src/features",
    "apps/frontend/src/components",
    "apps/frontend/src/services",
    "apps/frontend/src/stores",
    "apps/frontend/src/utils",
    "apps/frontend/src/types",
  ]);

  ensureTextIncludes("Tailwind configurado", "apps/frontend/tailwind.config.js", ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"]);
  ensureTextIncludes("Globals CSS com diretivas do Tailwind", "apps/frontend/src/styles/globals.css", ["@tailwind base;", "@tailwind components;", "@tailwind utilities;"]);
  ensureTextIncludes("shadcn configurado", "apps/frontend/components.json", ["new-york", "src/styles/globals.css", '"ui": "@/components/ui"']);
  ensurePaths("Componentes base do shadcn", [
    "apps/frontend/src/components/ui/button.tsx",
    "apps/frontend/src/components/ui/card.tsx",
    "apps/frontend/src/components/ui/input.tsx",
    "apps/frontend/src/components/ui/dialog.tsx",
    "apps/frontend/src/components/ui/toast.tsx",
  ]);
  ensureTextIncludes("Frontend tsconfig com aliases", "apps/frontend/tsconfig.json", ['"@/*"', '"@shared/*"']);
  ensureTextIncludes("React Router com rotas base", "apps/frontend/src/app/router.tsx", ["/kiosk", "/staff", "/admin", "Navigate"]);
  ensureTextIncludes("Zustand store inicial", "apps/frontend/src/stores/app.store.ts", ["create } from 'zustand'", "isLoading", "user", "toggleDarkMode"]);
  ensureTextIncludes("API client com interceptor", "apps/frontend/src/services/api.service.ts", ["axios.create", "VITE_API_URL", "interceptors.request.use", "interceptors.response.use"]);

  ensurePaths("Shared package presente", [
    "packages/shared/package.json",
    "packages/shared/src/index.ts",
    "packages/shared/src/types/menu.types.ts",
    "packages/shared/src/types/order.types.ts",
    "packages/shared/src/types/user.types.ts",
  ]);
  ensureTextIncludes("Shared exports principais", "packages/shared/src/index.ts", ["./types/menu.types", "./types/order.types", "./types/user.types"]);

  if (runTypeCheck) {
    runCommand("npm", ["run", "test"], "Smoke test de type-check");
  } else {
    add("Smoke test de type-check", "SKIP", true, "ignorado por flag --skip-typecheck/--skip-test", true);
  }

  if (runBuild) {
    runCommand("npm", ["run", "build"], "Smoke test de build");
  } else {
    add("Smoke test de build", "SKIP", true, "ignorado por flag --skip-build", true);
  }

  if (runServerCheck) {
    await checkServerHealth();
  } else {
    add("Backend health em execucao", "SKIP", true, "ignorado por flag --skip-server-check", true);
  }

  const failed = results.filter((result) => !result.ok);
  const skipped = results.filter((result) => result.skipped);
  const passed = results.filter((result) => result.ok && !result.skipped);

  console.log(
    JSON.stringify(
      {
        total: results.length,
        passed: passed.length,
        failed: failed.length,
        skipped: skipped.length,
        results,
      },
      null,
      2,
    ),
  );

  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
