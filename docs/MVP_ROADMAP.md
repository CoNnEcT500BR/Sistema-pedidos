# MVP Roadmap - Sistema de Pedidos

Atualizado em 16/03/2026 com base no estado do repositorio.

## 1. Status Consolidado

Fases entregues:

- Fase 1: setup de monorepo e base tecnica
- Fase 2: backend principal (auth/menu/combos/orders/addons)
- Fase 3: Kiosk funcional
- Fase 4: Staff de balcao funcional
- Fase 5: Admin operacional (entrega inicial + extensoes)

Modulos backend ativos:

- auth
- menu
- combos
- addons
- orders
- telemetry
- reports
- users

## 2. O que esta entregue no frontend

Kiosk:

- categorias, itens, carrinho, checkout e confirmacao
- selecao de addons por grupos
- fluxo validado por script E2E

Staff:

- login
- novo pedido no balcao (classic e touch)
- suporte operacional da fase 4

Admin:

- login por role ADMIN
- dashboard
- menu (CRUD)
- categorias (CRUD)
- ingredientes/addons (CRUD)
- combos (CRUD)
- pedidos (board por status)
- delivery (estrutura inicial)
- usuarios (CRUD)
- relatorios com filtro e exportacao JSON

## 3. Regras de negocio consolidadas no dominio

- addonType inclui SIZE_CHANGE.
- SIZE_CHANGE focado em bebida e acompanhamento.
- BURGER_BUILD bloqueia EXTRA e SIZE_CHANGE.
- Backfill de dados aplicado para upgrades de bebida/batata.

## 4. Qualidade e validacao disponiveis

Scripts de validacao:

- test:phase1
- test:staff:phase4
- test:admin:phase5
- test:e2e:kiosk
- test:e2e:admin:orders
- test:e2e:size-change

## 5. Roadmap Pos-MVP (proximas ondas)

### Onda A - Confiabilidade

- Integrar todos os E2E no CI
- Aumentar testes de regressao negativa para addons e regras por escopo
- Harden de mensagens de erro e observabilidade

### Onda B - Operacao Admin

- Evoluir aba Delivery para fluxo real
- Melhorar board de pedidos com filtros e SLA
- Exportacoes adicionais para relatorios operacionais

### Onda C - Plataforma

- Estudar migracao monetaria de Float para Decimal
- Definir estrategia de sync/backup operacional automatizada
- Preparar extensoes de pagamento quando houver decisao de negocio

### Onda D - Dados e Governanca

- Adotar testes de contrato para rotas administrativas e de pedidos
- Criar trilha de auditoria para alteracoes sensiveis (preco, disponibilidade, usuarios)
- Padronizar politicas de retention para telemetria e historico operacional

### Onda E - Seguranca e Release

- Aplicar rate limiting e bloqueio progressivo no fluxo de autenticacao
- Adicionar feature flags para liberar mudancas por perfil/canal
- Instituir checklist de release com smoke tests e rollback documentado
