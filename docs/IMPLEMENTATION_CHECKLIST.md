# Checklist de Implementacao - Estado Atual

Atualizado em 22/03/2026.

## 1. Fases Entregues

- [x] Fase 1 - Setup de monorepo, toolchain e base de dados
- [x] Fase 2 - Backend principal (Auth/Menu/Combos/Orders/Addons)
- [x] Fase 3 - Frontend Kiosk funcional
- [x] Fase 4 - Frontend Staff de balcao funcional
- [x] Fase 5 - Frontend Admin operacional

## 2. Backend

- [x] Auth com JWT e controle por role
- [x] Menu com CRUD, disponibilidade e regras de compatibilidade
- [x] Combos com CRUD e disponibilidade
- [x] Addons com catalogo publico e admin
- [x] Orders com calculo e transicoes de status
- [x] Telemetry para eventos operacionais
- [x] Reports para dashboard e vendas
- [x] Users para gestao de usuarios internos

## 3. Frontend

Kiosk:

- [x] fluxo completo de compra
- [x] carrinho e checkout
- [x] confirmacao

Staff:

- [x] login
- [x] criacao de pedido em balcao

Admin:

- [x] login por role
- [x] dashboard
- [x] menu (CRUD)
- [x] categorias (CRUD)
- [x] ingredientes/addons (CRUD)
- [x] combos (CRUD)
- [x] pedidos por status (board)
- [x] usuarios (CRUD)
- [x] relatorios com exportacao
- [x] delivery (estrutura inicial)

## 4. Regra SIZE_CHANGE (entregue)

- [x] Tipo adicionado nos contratos compartilhados
- [x] Suporte backend/frontend completo
- [x] Validacao de compatibilidade por escopo
- [x] Backfill de dados para upgrades de bebida/batata
- [x] Seed consistente para novos ambientes
- [x] Script E2E dedicado (test:e2e:size-change)

## 5. Testes e Validacao

- [x] type-check backend
- [x] type-check frontend
- [x] scripts manuais por fase
- [x] e2e kiosk
- [x] e2e admin orders board
- [x] e2e size change

## 6. Pendencias Prioritarias

Confiabilidade e qualidade:

- [x] Integrar todos os E2E no CI com gate de merge
- [x] Adicionar testes de contrato para endpoints criticos (Auth, Orders, Reports, Users)
- [x] Ampliar cobertura de cenarios negativos para addons e transicoes de status de pedido
- [x] Criar smoke test pos-deploy para rotas principais

Operacao Admin e Staff:

- [x] Evoluir fluxo de delivery para uso real (fila, roteirizacao, status de entrega)
- [x] Melhorar board de pedidos com filtros por SLA, tempo em etapa e ordenacao por prioridade
- [x] Adicionar exportacao CSV em relatorios (alem de JSON)

Observabilidade e seguranca:

- [x] Consolidar observabilidade operacional (metricas, logs estruturados e alertas)
- [x] Incluir trilha de auditoria para acoes administrativas sensiveis (menu, preco, usuarios)
- [x] Aplicar hardening de autenticacao (rate limit de login e bloqueio progressivo)

Plataforma e dados:

- [x] Definir rotina automatizada de backup e restore validado do banco local
- [x] Planejar migracao monetaria de Float para Decimal com testes de regressao
- [x] Estruturar feature flags para entregas graduais em Admin e Kiosk
