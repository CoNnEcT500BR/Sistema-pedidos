# Análise de Andamento do Roadmap de Melhorias Futuras

**Data da análise:** 04/08/2026
**Base de referência:** [FUTURE_IMPROVEMENTS.md](./FUTURE_IMPROVEMENTS.md)

## Resumo executivo

O projeto está em uma fase madura de MVP, com fluxo principal já funcional e com várias áreas operacionais implementadas. O que aparece no código atual mostra avanço real em UX operacional e hardening inicial de autenticação, mas ainda há uma grande distância entre o MVP atual e o roadmap de melhorias pós-MVP.

## Status consolidado por onda

### Onda F — Segurança Crítica

**Status:** Implementado parcialmente com avanço operacional concreto

**Evidências encontradas:**

- Persistência do lockout com campos de conta em [apps/server/prisma/schema.prisma](../apps/server/prisma/schema.prisma)
- Lógica de bloqueio com backoff exponencial em [apps/server/src/modules/auth/auth.lockout.ts](../apps/server/src/modules/auth/auth.lockout.ts)
- Integração do bloqueio e do endpoint de recuperação no fluxo de login em [apps/server/src/modules/auth/auth.routes.ts](../apps/server/src/modules/auth/auth.routes.ts)
- Rate limiting no endpoint de desbloqueio e auditoria de segurança em [apps/server/src/shared/audit/audit.service.ts](../apps/server/src/shared/audit/audit.service.ts)
- UX de desbloqueio em admin e staff em [apps/frontend/src/routes/admin/LoginPage.tsx](../apps/frontend/src/routes/admin/LoginPage.tsx) e [apps/frontend/src/routes/staff/LoginPage.tsx](../apps/frontend/src/routes/staff/LoginPage.tsx)

**O que já existe:**

- bloqueio persistido por conta e tentativas acumuladas;
- reset do bloqueio via `POST /api/auth/unlock-request`;
- resposta `429` com `retry-after` e instrução operacional clara para o cliente;
- auditoria de segurança com entidade `AUTH` e ações específicas como `LOGIN_ATTEMPT` e `UNLOCK_REQUESTED`;
- rate limit configurado no endpoint de login e unlock.

**O que ainda falta:**

- fluxo de recuperação real com token temporal ou e-mail de segurança;
- suporte a retenção de histórico de bloqueio por IP e usuário em infraestrutura de observabilidade externa;
- refinamento de políticas de alerta para tentativas suspeitas massivas.

### Onda G — UX Operacional

**Status:** Parcialmente implementado

**Evidências encontradas:**

- Quadro de produção com SLA e filtro de urgência em [apps/frontend/src/routes/admin/OrdersBoardPage.tsx](../apps/frontend/src/routes/admin/OrdersBoardPage.tsx)
- Busca simples no kiosk em [apps/frontend/src/routes/kiosk/CategoriesPage.tsx](../apps/frontend/src/routes/kiosk/CategoriesPage.tsx)
- Toast básico em [apps/frontend/src/hooks/useToast.ts](../apps/frontend/src/hooks/useToast.ts)

**O que já existe:**

- filtro de SLA;
- ordenação por urgência;
- tempo na etapa;
- busca por categoria.

**O que ainda falta:**

- indicadores visuais por faixa de SLA;
- countdown por etapa;
- printer/KDS mock;
- toast com loading, undo, stacking e duração dinâmica.

### Onda H — Performance & Escalabilidade

**Status:** Não implementado

**Evidências encontradas:**

- Não há `Cache-Control` nem `ETag` em [apps/server/src/app.ts](../apps/server/src/app.ts)
- Não há `React.lazy()` / `Suspense` em [apps/frontend/src/app/router.tsx](../apps/frontend/src/app/router.tsx)
- Não há virtualização no board de pedidos

**O que falta:**

- cache HTTP em rotas de catálogo;
- lazy loading de rotas admin pesadas;
- consolidação dos hooks de realtime em um hook genérico;
- virtualização da lista do Order Board.

### Onda I — Integrações Críticas

**Status:** Não implementado

**Evidências encontradas:**

- Não há módulo de pagamentos;
- Não há módulo de notificações;
- Não há webhook/payment provider;
- Não há SDK de Stripe, Mercado Pago, Twilio, SendGrid ou Firebase no repo principal.

**O que falta:**

- integração de Stripe / Mercado Pago;
- notificações por SMS, email e push;
- provider abstraction e arquitetura de adaptadores.

### Onda J — Analytics & Escalabilidade

**Status:** Não implementado

**Evidências encontradas:**

- O schema ainda usa `Float` em [apps/server/prisma/schema.prisma](../apps/server/prisma/schema.prisma)
- Não há rastreamento com GA4 ou Sentry;
- Não há preparação de migração monetária para `Decimal`.

**O que falta:**

- migração de precisão monetária;
- Sentry no frontend e backend;
- GA4 tracking em rotas críticas;
- script de validação monetária e backup antes de deploy.

## Conclusão

O projeto está em uma etapa de MVP funcional e operacional, com boa base de fluxo e arquitetura, mas ainda distante do roadmap de pós-MVP em termos de segurança robusta, performance, integrações externas e observabilidade.

### Prioridades recomendadas

1. Segurança operacional
   - completar lockout com endpoint de desbloqueio;
   - persistir tentativas em infraestrutura externa;
   - centralizar normalização de mensagens de erro.

2. Operação administrativa
   - KDS mock / impressora mock;
   - toast mais rico;
   - indicadores SLA e tempo em etapa mais claros e visuais.

3. Performance
   - `Cache-Control` e `ETag` no backend;
   - `React.lazy()` para rotas pesadas;
   - consolidar realtime hooks e virtualizar board.

4. Integrações comerciais
   - pagamento online;
   - notificações em cascata;
   - observabilidade externa.

5. Preparação monetária
   - migrar para `Decimal` com validação e backup.

## Observação final

O desenvolvimento atual mostra que o produto já evoluiu para um MVP bem sólido. A maior lacuna do roadmap está na maturidade de produção: segurança, integrações, observabilidade e escalabilidade operacional.
