# Sistema de Pedidos Off-Grid para Restaurante

Sistema de pedidos para operacao local em rede LAN/Wi-Fi, com backend em Fastify + Prisma e frontend React. O repositorio ja entrega a base completa do monorepo, banco SQLite com seed, autenticacao JWT e a API principal da Fase 3.

## Visao Geral

O projeto esta organizado em tres frentes de uso:

- Kiosk: rota base para autoatendimento do cliente
- Staff: rota base para operacao de balcao
- Admin: rota base para operacao e manutencao do cardapio

No estado atual, o backend esta funcional com modulos de negocio ativos, enquanto o frontend ainda esta em fase de shell/interface base.

## Status Atual

- Fase 1 concluida: monorepo, TypeScript, Prisma 7, SQLite, Fastify, React e Tailwind configurados
- Fase 3 backend implementada para auth, menu, combos, addons, orders e telemetry
- Seed inicial pronto com categorias, itens, combos, addons e usuarios padrao
- Swagger UI disponivel para exploracao da API
- Frontend com roteamento pronto para kiosk, staff e admin, ainda com paginas placeholder
- Build, lint e type-check funcionando no monorepo

Entregas de backend disponiveis hoje:

- Auth: login e sessao autenticada via JWT
- Menu: categorias ativas, listagem, detalhe, criacao, edicao, disponibilidade e soft delete
- Combos: listagem, detalhe, criacao, edicao e disponibilidade
- Addons: listagem global e listagem de addons permitidos por item
- Orders: criacao publica, listagem autenticada, detalhe e atualizacao de status
- Telemetry: ingestao e consulta de eventos recentes de jornada

---

## Stack Tecnologica

Backend:

- Node.js 20+
- Fastify 4
- Prisma 7
- SQLite
- JWT
- Zod
- Swagger / Swagger UI

Frontend:

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Zustand
- Axios
- React Router

Compartilhado:

- npm workspaces
- package shared para tipos comuns
- Prettier
- TypeScript strict

---

## Estrutura do Projeto

```text
sistema-pedidos/
|- apps/
|  |- frontend/
|  \- server/
|- packages/
|  \- shared/
|- docs/
|- scripts/
\- package.json
```

---

## Pre-requisitos

- Node.js 20+
- npm 10+

Observacoes:

- O repositorio esta configurado com npm workspaces
- Os comandos documentados abaixo usam npm como padrao

---

## Setup Rapido

```bash
# 1) instalar dependencias do monorepo
npm install

# 2) aplicar migrations do prisma
npm run -w apps/server db:migrate

# 3) carregar dados iniciais
npm run -w apps/server db:seed

# 4) subir backend e frontend
npm run dev
```

Se preferir rodar separadamente:

```bash
npm run -w apps/server dev
npm run -w apps/frontend dev
```

---

## Acessos Locais

- Frontend: http://localhost:5173
- Rota inicial do frontend: http://localhost:5173/ redireciona para /kiosk
- Kiosk: http://localhost:5173/kiosk
- Staff: http://localhost:5173/staff
- Admin: http://localhost:5173/admin
- Backend health: http://localhost:3001/health
- Backend API health: http://localhost:3001/api/v1/health
- Backend status: http://localhost:3001/status
- Swagger UI: http://localhost:3001/docs

---

## Credenciais Seed

Usuarios criados pelo seed:

- Admin: admin@sistema.local / admin123
- Staff: staff@sistema.local / staff123

---

## Endpoints Principais

Todas as rotas de negocio sao registradas com prefixo /api.

Auth:

- POST /api/auth/login
- GET /api/auth/me

Menu:

- GET /api/categories
- GET /api/menu
- GET /api/menu/:id
- POST /api/menu
- PUT /api/menu/:id
- PATCH /api/menu/:id/availability
- DELETE /api/menu/:id

Combos:

- GET /api/combos
- GET /api/combos/:id
- POST /api/combos
- PUT /api/combos/:id
- PATCH /api/combos/:id/availability

Addons:

- GET /api/addons
- GET /api/menu/:menuItemId/addons

Orders:

- POST /api/orders
- GET /api/orders
- GET /api/orders/:id
- PATCH /api/orders/:id/status

Telemetry:

- POST /api/telemetry/events
- GET /api/telemetry/events

---

## Scripts Principais

Root:

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
npm run type-check
npm run format
npm run test:phase1
```

Backend:

```bash
npm run -w apps/server dev
npm run -w apps/server build
npm run -w apps/server start
npm run -w apps/server type-check
npm run -w apps/server db:migrate
npm run -w apps/server db:seed
npm run -w apps/server db:studio
```

Frontend:

```bash
npm run -w apps/frontend dev
npm run -w apps/frontend build
npm run -w apps/frontend type-check
npm run -w apps/frontend lint
```

Scripts manuais adicionais estao na pasta scripts para validacoes por modulo das fases 2 e 3.

---

## Banco de Dados

- Provedor: SQLite
- Arquivo local: apps/server/prisma/dev.db
- Schema: apps/server/prisma/schema.prisma
- Config Prisma 7: apps/server/prisma.config.ts
- Seed: apps/server/prisma/seed.ts
- Migrations: apps/server/prisma/migrations/

---

## Qualidade e Validacao

Validacoes disponiveis no projeto:

- TypeScript strict
- Lint por workspace
- Build de backend e frontend
- Swagger para inspecao rapida da API
- Scripts manuais para fluxos das fases 2 e 3

Comandos recomendados antes de publicar alteracoes:

```bash
npm run lint
npm run test
npm run build
```

---

## Proximas Entregas

Os proximos passos mais evidentes no codigo atual sao:

- Evoluir as paginas de kiosk, staff e admin alem dos placeholders
- Conectar o frontend aos endpoints ja publicados
- Completar telas operacionais de pedido, autenticacao e gestao
- Expandir cobertura de testes manuais/automatizados das fases 2 e 3

---

## Documentacao Relacionada

- docs/index.html
- docs/ARCHITECTURE.md
- docs/DATA_MODEL.md
- docs/IMPLEMENTATION_CHECKLIST.md
- docs/MVP_ROADMAP.md
