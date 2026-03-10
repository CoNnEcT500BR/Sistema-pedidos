# Sistema de Pedidos Off-Grid para Restaurante

Sistema completo de pedidos para restaurante, funcionando offline em rede local (LAN/Wi-Fi), com backend em Fastify + Prisma e frontend React.

---

## Visao Geral

O sistema possui 3 interfaces:

- Kiosk (totem): autoatendimento do cliente
- Staff: atendimento de balcao
- Admin: gestao de cardapio e operacao

Caracteristicas principais:

- Operacao local sem dependencia de internet
- Multi-dispositivo na mesma rede
- Servidor central com Node.js + SQLite
- Monorepo com apps frontend/backend e pacote shared

---

## Status Atual

- Fase 1 (Setup e Estrutura Base): concluida
- Prisma atualizado para v7
- Migration inicial aplicada (`init`)
- Seed inicial implementado (categorias, itens, combos, usuarios)
- Lint, type-check e build funcionando

Documentos de controle:

- `docs/IMPLEMENTATION_CHECKLIST.md`
- `docs/PHASE1_CHECKLIST_STATUS.md`
- `docs/PHASE1_FILE_VALIDATION.md`

---

## Stack Tecnologica

Backend:

- Node.js 20+
- Fastify (TypeScript)
- Prisma 7 + SQLite
- JWT
- Zod
- Pino + pino-pretty

Frontend:

- React 18 + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui (base)
- Zustand
- Axios
- React Router v6

Compartilhado:

- npm workspaces
- ESLint + Prettier

---

## Estrutura do Projeto

```text
sistema-pedidos/
|- apps/
|  |- frontend/
|  |- server/
|- packages/
|  |- shared/
|- docs/
|- scripts/
|- package.json
```

---

## Pre-requisitos

- Node.js 20+ (recomendado LTS)
- npm 10+

Observacao:

- O projeto funciona com npm workspaces.
- pnpm pode ser usado, mas os scripts do root estao padronizados com npm.

---

## Setup Rapido

```bash
# 1) instalar dependencias do monorepo
npm install

# 2) gerar client do prisma e aplicar migrations
npm run -w apps/server db:migrate

# 3) popular banco com seed inicial
npm run -w apps/server db:seed

# 4) subir backend e frontend
npm run dev
```

Acessos locais:

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:3001/health`
- Backend api health: `http://localhost:3001/api/v1/health`

---

## Scripts Principais

No root:

```bash
npm run dev         # sobe server + frontend
npm run build       # build server + frontend
npm run lint        # lint/checagens
npm run test        # atualmente executa type-check
npm run type-check  # type-check server + frontend
npm run format      # prettier no repo
```

Backend (`apps/server`):

```bash
npm run -w apps/server dev
npm run -w apps/server build
npm run -w apps/server db:migrate
npm run -w apps/server db:seed
npm run -w apps/server db:studio
```

Frontend (`apps/frontend`):

```bash
npm run -w apps/frontend dev
npm run -w apps/frontend build
npm run -w apps/frontend lint
```

---

## Banco de Dados

- Provedor: SQLite
- Arquivo local: `apps/server/prisma/dev.db`
- Schema: `apps/server/prisma/schema.prisma`
- Config Prisma v7: `apps/server/prisma.config.ts`
- Migration inicial: `apps/server/prisma/migrations/*_init/migration.sql`

---

## Qualidade

Validacoes usadas no projeto:

- ESLint
- TypeScript strict mode
- Build de backend e frontend

Comandos recomendados antes de commit:

```bash
npm run lint
npm run test
npm run build
```

---

## Proximos Passos

A proxima etapa planejada no roadmap:

- Fase 2: Backend API (Auth, Menu, Combos, Orders e Addons)

Referencias:

- `docs/MVP_ROADMAP.md`
- `docs/IMPLEMENTATION_CHECKLIST.md`
