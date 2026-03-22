# Arquitetura Tecnica - Sistema de Pedidos Off-Grid

Atualizado em 22/03/2026 com base no estado real do repositorio.

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

## 8. Auditoria (Módulo audit)

O módulo audit fornece trilha de auditoria automática para operações sensíveis no backend.

**Funcionalidade:**
- Logging automático de operações POST/PUT/PATCH/DELETE em todos os módulos
- Captura automática de contexto: actorId, email, role, IP do cliente
- Rastreamento de entidades modificadas e ações executadas
- Armazenamento de payload de requisição, statusCode e timestamp

**Entidades:**
- AuditLog: entity (string), action (CREATED|UPDATED|DELETED), actorId, email, role, timestamp, payload, statusCode, clientIp

**Endpoints:**
- GET /api/audit/logs: listagem com filtros por entity, action, email, período (startDate/endDate)
- Requer autenticação e role ADMIN

**Casos de Uso:**
- Compliance: rastreamento de alterações em preços, disponibilidade de itens, configuração de usuários
- Debugging: investigação de mudanças indevidas ou comportamentos inesperados
- Detecção de Abuso: identificação de padrões de operações suspeitas (múltiplas exclusões, alterações de papel)

**Referências de Código:**
- Backend: [apps/server/src/modules/audit/](apps/server/src/modules/audit/)
- Frontend Admin: [apps/frontend/src/routes/admin/AuditPage.tsx](apps/frontend/src/routes/admin/AuditPage.tsx)

## 9. Feature Flags (Módulo feature-flags)

O módulo feature-flags permite liberar mudanças gradualmente por perfil de usuário (role) e canal (KIOSK/STAFF/ADMIN/API).

**Status:** ✅ Implementado e em produção (Onda E entregue)

**Funcionalidade:**
- Configuração baseada em arquivo JSON (apps/server/config/feature-flags.json)
- Regras por role (ADMIN, STAFF, PUBLIC) e channel (ADMIN, STAFF, KIOSK, API)
- Suporte a rollout gradual via rolloutPercentage (0-100%) com hash consistente de userKey
- Carregamento de configuração em startup do servidor
- Sem necessidade de restart para mudanças em feature flags estáticas

**Entidades:**
- FeatureFlag: name, enabled, roles (array), channels (array), rolloutPercentage, description
- Permite lógica "canary" e A/B testing por percentual

**Endpoints:**
- GET /api/feature-flags: listagem de flags habilitadas para o usuário autenticado
- POST /api/feature-flags: criar nova flag (admin)
- PUT /api/feature-flags/:name: atualizar flag (admin)
- PATCH /api/feature-flags/:name/toggle: ativar/desativar (admin)
- DELETE /api/feature-flags/:name: remover flag (admin)

**Casos de Uso:**
- Roll-out gradual de funcionalidades novas (ex: novo método de pagamento para 10% de usuários)
- A/B testing de mudanças na interface (ex: novo layout de carrinho)
- Funcionalidades experimentais por canal (ex: KDS apenas para STAFF)
- Desativar features rapidamente em caso de bug (sem deploy)

**Referências de Código:**
- Backend: [apps/server/src/modules/feature-flags/](apps/server/src/modules/feature-flags/)
- Config: [apps/server/config/feature-flags.json](apps/server/config/feature-flags.json)

## 10. Delivery (Módulo delivery)

O módulo delivery gerencia a entrega e roteamento de pedidos, integrando com operações logísticas.

**Status:** Estrutura implementada, extensível para roteirizador externo

**Funcionalidade:**
- Criação automática de Delivery ao criar Order
- Assignação de Courier (entregador)
- Rastreamento de status de entrega (PENDING → ASSIGNED → IN_DELIVERY → DELIVERED)
- Suporte a rotas otimizadas via DeliveryRoute
- Integração com priorização de pedidos (zona geográfica, tempo)

**Entidades:**
- Delivery: Order 1:1, status (enum), createdAt, assignedAt, deliveredAt, address, notes
- DeliveryCourier: name, phone, ativo, vehicle (tipo de transporte)
- DeliveryRoute: otimização de rota, parada de múltiplos pedidos, ETA
- DeliveryAddress: integrado em Order para consulta rápida

**Endpoints:**
- GET /api/delivery/orders: listagem de pedidos aguardando/em entrega
- POST /api/delivery/orders/:orderId/assign: assignar courier específico
- PATCH /api/delivery/orders/:orderId/status: atualizar status (PENDING → ASSIGNED → IN_DELIVERY → DELIVERED)
- GET /api/delivery/couriers: listagem de entregadores ativos
- POST /api/delivery/couriers: criar novo courier (admin)
- GET /api/delivery/routes: listagem de rotas otimizadas

**Casos de Uso:**
- Integração com Google Maps ou OpenStreetMap para roteirizador
- Rastreamento de pedidos em tempo real via SMS/push notification
- Otimização de rotas para entregas em lote
- Priorização de pedidos por zona e horário de retirada

**Referências de Código:**
- Backend: [apps/server/src/modules/delivery/](apps/server/src/modules/delivery/)
- Frontend Admin: [apps/frontend/src/routes/admin/DeliveryPage.tsx](apps/frontend/src/routes/admin/DeliveryPage.tsx)
- Types: [apps/frontend/src/features/delivery/types/](apps/frontend/src/features/delivery/types/)

## 11. Observabilidade e Qualidade

- Logs estruturados no backend.
- Erros de validacao mapeados para mensagens de dominio no frontend admin.
- Scripts de validacao manual e E2E em scripts/.
- Type-check e lint por workspace.

## 12. Execucao

Comandos principais:
- npm run dev
- npm run type-check
- npm run lint
- npm run test:e2e:kiosk
- npm run test:e2e:admin:orders
- npm run test:e2e:size-change
