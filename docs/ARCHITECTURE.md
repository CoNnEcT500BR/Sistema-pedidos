# Arquitetura Tecnica - Sistema de Pedidos Off-Grid

Atualizado em 16/03/2026 com base no estado real do repositorio.

## 1. Visao Geral

O sistema opera em rede local (LAN/Wi-Fi) com backend Fastify + Prisma (SQLite) e frontend React (Vite).

Perfis de uso:
- Kiosk: autoatendimento
- Staff: operacao de balcao
- Admin: operacao gerencial e manutencao do catalogo

## 2. Stack Atual

Backend:
- Node.js 20+
- TypeScript
- Fastify
- Prisma 7
- SQLite
- JWT + middleware de role
- Zod para validacao
- Swagger em /docs

Frontend:
- React 18
- TypeScript
- Vite
- Tailwind + componentes UI locais
- Zustand
- Axios
- React Router
- i18n pt/en

Monorepo:
- npm workspaces
- apps/frontend
- apps/server
- packages/shared

## 3. Arquitetura de Aplicacao

Frontend (camadas):
1. Rotas/paginas em src/routes
2. Features de dominio em src/features
3. Services HTTP em src/services e src/features/*/services
4. Estado global em stores (Zustand)

Backend (camadas):
1. Rotas Fastify em src/modules/*/*.routes.ts
2. Regras de negocio em *.service.ts
3. Acesso a dados em *.repository.ts (Prisma)
4. Contratos/validacoes com Zod e schemas OpenAPI

## 4. Modulos Backend Ativos

- auth: login e sessao
- menu: categorias, itens e disponibilidade
- combos: CRUD e disponibilidade
- addons: catalogo global, catalogo admin e addons por item
- orders: criacao, consulta e transicoes de status
- telemetry: ingestao e leitura de eventos
- reports: dashboard e vendas por periodo
- users: CRUD de usuarios internos

## 5. Frentes Frontend Ativas

Kiosk:
- fluxo completo de pedido
- personalizacao com addons
- confirmacao e tela final

Staff:
- login
- novo pedido no balcao (classic/touch)

Admin:
- login por role ADMIN
- dashboard operacional
- CRUD de menu
- CRUD de categorias
- CRUD de ingredientes/addons
- CRUD de combos
- board de pedidos por status
- delivery (estrutura inicial)
- CRUD de usuarios
- relatorios com exportacao JSON

## 6. Regras de Dominio Relevantes

- AddonTypes em uso: EXTRA, SUBSTITUTION, REMOVAL, SIZE_CHANGE.
- SIZE_CHANGE e permitido para DRINK, SIDE e COMBO.
- Em BURGER_BUILD, tipos EXTRA e SIZE_CHANGE sao bloqueados.
- Compatibilidade item x addon e validada no backend (menu.service).
- Metadados de addon (scope/station/priority) podem vir no token [meta|...].

## 7. Persistencia e Migracoes

- Banco: SQLite local em apps/server/prisma/dev.db.
- Migracoes Prisma versionadas em apps/server/prisma/migrations.
- Backfill recente: 20260316123000_size_change_backfill para upgrades de bebida/batata.
- Seed atualizado para manter SIZE_CHANGE vinculado em bebidas e batatas.

## 8. Observabilidade e Qualidade

- Logs estruturados no backend.
- Erros de validacao mapeados para mensagens de dominio no frontend admin.
- Scripts de validacao manual e E2E em scripts/.
- Type-check e lint por workspace.

## 9. Execucao

Comandos principais:
- npm run dev
- npm run type-check
- npm run lint
- npm run test:e2e:kiosk
- npm run test:e2e:admin:orders
- npm run test:e2e:size-change
