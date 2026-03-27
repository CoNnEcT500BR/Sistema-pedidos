# Estrutura do Projeto - Snapshot Atual

Atualizado em 22/03/2026.

## 1. Raiz

- package.json (workspaces e scripts globais)
- README.md
- SETUP.md
- docs/
- apps/
- packages/
- scripts/

## 2. Apps

### apps/frontend

Arquivos de build/config:

- index.html
- vite.config.ts
- tailwind.config.js
- tsconfig.json

Codigo em src/:

- app/router.tsx: roteamento principal por contexto
- routes/kiosk: fluxo do cliente
- routes/staff: fluxo de balcao
- routes/admin: painel administrativo completo
- features/auth: login, store e protecao de rota
- features/menu: tipos, componentes e servicos de cardapio
- features/orders: tipos/componentes de pedidos
- features/admin: services e tipos do painel admin
- i18n: provider, tradutor e dicionario pt/en
- components/ui: componentes base + dialogs/inputs custom

Rotas admin implementadas:

- /admin/login
- /admin/dashboard
- /admin/menu
- /admin/categories
- /admin/ingredients
- /admin/combos
- /admin/orders
- /admin/delivery
- /admin/users
- /admin/reports

### apps/server

Infra e dados:

- prisma/schema.prisma
- prisma/seed.ts
- prisma/migrations/
- src/server.ts
- src/app.ts
- src/routes.ts

Modulos em src/modules:

- auth
- menu
- combos
- addons
- orders
- telemetry
- reports
- users

Shared:

- src/shared/database
- src/shared/http/openapi.ts
- src/shared/http/error-handler.ts

## 3. Pacotes Compartilhados

### packages/shared

- src/types/menu.types.ts
- src/types/order.types.ts
- src/types/user.types.ts
- src/index.ts

Uso principal: contratos e tipos compartilhados entre frontend/backend.

## 4. Scripts

Scripts manuais e E2E relevantes:

- scripts/e2e-kiosk-critical-flow.js
- scripts/e2e-admin-orders-board.js
- scripts/e2e-size-change-flow.js
- scripts/manual-test-staff-phase4.js
- scripts/manual-test-admin-phase5.js

## 5. Comandos Globais

- npm run dev
- npm run build
- npm run type-check
- npm run lint
- npm run test:e2e:kiosk
- npm run test:e2e:admin:orders
- npm run test:e2e:size-change
