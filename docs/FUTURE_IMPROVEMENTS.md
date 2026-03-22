# Roadmap de Melhorias Futuras - Sistema de Pedidos

**Data:** 22/03/2026
**Status:** Planejamento de 5 ondas pós-MVP (F-J, 6-12 meses, ~215 horas)
**Objetivo:** Evoluir System Pedidos com segurança, UX operacional, performance e integrações críticas

---

## 📋 Resumo Executivo

O MVP (Fase 5) entregou um sistema funcional e operacional. O próximo horizonte (6-12 meses) foca em:

1. **Segurança Crítica (Onda F):** Proteção contra força bruta, validações robustas
2. **UX Operacional (Onda G):** Melhorias de fluxo, feedback visual, operações
3. **Performance (Onda H):** Cache, lazy loading, otimizações
4. **Integrações Críticas (Onda I):** Pagamentos (Stripe/MP), Notificações (SMS/Email/Push)
5. **Analytics & Escalabilidade (Onda J):** Google Analytics 4, Sentry, precisão monetária

---

## 🔴 ONDA F: Segurança Crítica

### 1. Progressive Account Lockout

**Prioridade:** 🔴 CRÍTICA
**Impacto:** Proteção contra força bruta, melhor conformidade

**O que fazer:**

- Implementar contador de tentativas falhadas de login por email + IP
- Após 3 tentativas falhadas, bloquear o usuário por 15 minutos
- Mostrar mensagem clara: "Conta bloqueada. Tente novamente em 15 minutos"
- Endpoint de desbloqueio: `POST /api/auth/unlock-request` com email validado

**Onde:**

- Backend: [apps/server/src/modules/auth/auth.service.ts](apps/server/src/modules/auth/auth.service.ts)
- Frontend: [apps/frontend/src/features/auth/components/LoginForm.tsx](apps/frontend/src/features/auth/components/LoginForm.tsx)

**Implementação:**

- Usar Redis (ou cache em memória com TTL para MVP) para rastrear tentativas
- Middleware de autenticação: validar login_attempts antes de processar
- Endpoint desbloqueio com código enviado por email (ou link temporal)

**Dependências:** Nenhuma (pode usar cache em memória)

**Teste:**

- E2E: tentar login 3x com senha errada → verificar bloqueio

---

### 2. Validações Client-side Robustas

**Prioridade:** 🔴 CRÍTICA
**Impacto:** Melhor UX, menos carga no backend, validação em tempo real

**O que fazer:**

- Adicionar validação HTML5 + Zod em todos inputs de formulário
- Implementar padrões: email, telefone, min/max length, required fields
- Mostrar erros inline com mensagens claras
- Desabilitar botão de submissão até validação passar

**Formulários a validar:**

1. **DeliveryPage:** endereço, telefone, notas
2. **UsersPage:** email (@domain), senha (min 8 caracteres), nome (3-100)
3. **CategoriesPage:** nome (3-50), descrição (0-200), ícone
4. **AddonsPage:** nome (3-50), preço (0-1000), tipo (enum)
5. **MenuPage:** nome (3-100), preço (0-1000), categoria (required)

**Padrões de Validação:**

```
- Email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
- Telefone Brasil: /^\d{10,11}$/
- Preço: /^\d+(\.\d{1,2})?$/ (0-10000)
- Nome: min 3, max 100 UTF-8
- CEP Brasil: /^\d{5}-?\d{3}$/
```

**Onde:**

- Frontend: [apps/frontend/src/routes/admin/](apps/frontend/src/routes/admin/)

**Dependências:** Zod (já usado no backend)

---

### 3. Normalizar Mensagens de Erro

**Prioridade:** 🟠 ALTA
**Impacto:** Segurança (não expõe detalhes internos), melhor experiência

**O que fazer:**

- Mapear erros Prisma/SQLite para mensagens amigáveis
- Exemplo: `unique constraint failed addon.name` → `"Esta categoria já existe"`
- Exemplo: `FOREIGN_KEY_CONSTRAINT_FAILED` → `"Não é possível deletar item com pedidos associados"`
- Centralizar em middleware de erro com pattern matching

**Mapeamento de Erros:**
| Erro SQLite | Mensagem Usuário |
|---|---|
| `UNIQUE constraint failed` | "Este registro já existe" |
| `FOREIGN_KEY_CONSTRAINT_FAILED` | "Não é possível deletar (há registros associados)" |
| `NOT NULL constraint failed` | "Campo obrigatório não preenchido" |
| `CHECK constraint failed` | "Valor inválido para este campo" |

**Onde:**

- Backend: [apps/server/src/shared/middleware/error-handler.ts](apps/server/src/shared/middleware/error-handler.ts)

**Dependências:** Nenhuma

---

## 🟠 ONDA G: UX Operacional (Sprint 3-4, 3-4 semanas)

### 4. Integração com Impressora (KDS Mock)

**Prioridade:** 🟠 ALTA
**Impacto:** Operação crítica, validação de fluxo antes de printer real

**O que fazer:**

- Implementar mock local de impressora para etiqueta de pedido (ESC/POS)
- Botão "Imprimir" em OrderBoard → simular impressão (console log + UI feedback)
- Preparar integração futura com impressora real via TCP/serial

**Spec ESC/POS Mock:**

```
Etiqueta (80mm):
┌────────────────────────┐
│  PEDIDO #12345         │
│  PRONTO:13:45 (15min)  │
│                        │
│  • Burger + Bacon      │
│  • Refrigerante Small  │
│  • Extra Queijo        │
│                        │
│  CLIENTE: João Silva   │
│  FONE: 11 9999-0000   │
└────────────────────────┘
```

**Onde:**

- Backend: [apps/server/src/modules/orders/orders.service.ts](apps/server/src/modules/orders/orders.service.ts)
- Frontend: [apps/frontend/src/routes/admin/OrderBoard.tsx](apps/frontend/src/routes/admin/OrderBoard.tsx)

**Implementação:**

- Criar serviço `PrinterService` com adapter pattern
- Mock implementa buffer em memória
- Futura integração: swap para adapter TCP/Serial

**Dependências:** Node.js serial/TCP (futuro)

**Teste:**

- Clicar "Imprimir" → etiqueta renderiza no console/UI

---

### 5. Feedback Visual em Toast Melhorado

**Prioridade:** 🟡 MÉDIA
**Impacto:** Confiança do usuário, feedback claro

**O que fazer:**

- Melhorar componente Toast com spinner, cores por tipo, duração dinâmica
- Estados: info (azul, 3s), success (verde, 2s), error (vermelho, 5s), loading (spinner)
- Stacking automático de múltiplas toasts
- Botão "desfazer" para ações reversíveis

**Onde:**

- Frontend: [apps/frontend/src/hooks/useToast.ts](apps/frontend/src/hooks/useToast.ts)

**Implementação:**

```typescript
// Exemplo de uso
useToast().success('Pedido criado!', { duration: 2000 });
useToast().error('Erro ao deletar', { duration: 5000, undo: deleteOrder });
useToast().loading('Processando...');
```

**Dependências:** Nenhuma

---

### 6. Order Board com Indicadores SLA

**Prioridade:** 🟡 MÉDIA
**Impacto:** Operadores veem rapidamente pedidos críticos

**O que fazer:**

- Adicionar coluna "Tempo em Etapa" com cores por urgência
- Verde: <5min, Amarelo: 5-15min, Vermelho: >15min
- Ordenação por SLA (mostrar vermelhos primeiro)
- Card visual com countdown timer

**Onde:**

- Frontend: [apps/frontend/src/routes/admin/OrderBoard.tsx](apps/frontend/src/routes/admin/OrderBoard.tsx)

**Implementação:**

- Calcular `timeInStatus = now - order.statusChangedAt`
- CSS classes por faixa de tempo
- Sorting automático por SLA críticos

**Dependências:** Nenhuma

---

### 7. Busca/Filtro no Menu Kiosk

**Prioridade:** 🟡 MÉDIA
**Impacto:** UX com menu grande (50+ itens)

**O que fazer:**

- Input de busca com autocomplete em tempo real
- Filtro por categoria, ingredientes, preço
- Destaque de resultados, sugestões enquanto digita

**Onde:**

- Frontend: [apps/frontend/src/routes/kiosk/MenuPage.tsx](apps/frontend/src/routes/kiosk/MenuPage.tsx)

**Features:**

- Busca por nome (case-insensitive, diacríticos)
- Filtro por ingredientes: "sem cebola", "vegetariano"
- Range de preço: "até R$ 30"
- Histórico de buscas (localStorage)

**Dependências:** Nenhuma (Fuse.js para busca fuzzy, opcional)

---

### 8. Live Price Preview em Addon Modal

**Prioridade:** 🟡 MÉDIA
**Impacto:** Transparência de preço = reduz abandono

**O que fazer:**

- Mostrar preço final atualizado em tempo real ao adicionar/remover addons
- Breakdown: item base + addons + total

**Onde:**

- Frontend: [apps/frontend/src/features/menu/components/AddonModal.tsx](apps/frontend/src/features/menu/components/AddonModal.tsx)

**Implementação:**

```
Item: Big Burger          R$ 28.90
├─ Extra Bacon           + R$ 5.00
├─ Extra Queijo          + R$ 3.50
└─ Sem Cebola (GRÁTIS)   + R$ 0.00
───────────────────────────────────
TOTAL                     R$ 37.40
```

**Dependências:** Nenhuma

---

## 🟡 ONDA H: Performance & Escalabilidade (Sprint 5-6, 2-3 semanas)

### 9. Cache HTTP em Catálogo

**Prioridade:** 🟡 MÉDIA
**Impacto:** Reduz banda, viável offline, melhor TTI

**O que fazer:**

- Adicionar `Cache-Control: max-age=3600` em `GET /api/menu`, `/api/categories`, `/api/combos`
- Implementar `ETag` para validação (304 Not Modified)
- Client-side: respeitar cache headers

**Onde:**

- Backend: [apps/server/src/app.ts](apps/server/src/app.ts)

**Implementação:**

```typescript
app.get('/api/menu', { onRequest: [...middleware] }, async (request, reply) => {
  reply.header('Cache-Control', 'max-age=3600, public');
  reply.header('ETag', generateETag(menu));
  return { data: menu };
});
```

**Dependências:** Nenhuma

---

### 10. Lazy Loading em Rotas Admin

**Prioridade:** 🟡 MÉDIA
**Impacto:** Reduz bundle inicial, melhor TTI

**O que fazer:**

- `React.lazy()` em rotas admin pesadas: ReportsPage, CategoriesPage, UsersPage, DeliveryPage
- Suspense boundary com skeleton loader

**Onde:**

- Frontend: [apps/frontend/src/app/router.tsx](apps/frontend/src/app/router.tsx)

**Implementação:**

```typescript
const ReportsPage = lazy(() => import('../routes/admin/ReportsPage'))
const UsersPage = lazy(() => import('../routes/admin/UsersPage'))

// em routes:
<Suspense fallback={<Skeleton />}>
  <Route path="/reports" element={<ReportsPage />} />
</Suspense>
```

**Dependências:** Nenhuma

---

### 11. Consolidar 4 Realtime Hooks em 1 Genérico

**Prioridade:** 🟢 BAIXA (refactoring)
**Impacto:** DRY, manutenção simplificada

**O que fazer:**

- Consolidar: `useRealtimeRefresh`, `useCatalogRealtimeRefresh`, `useOrdersRealtimeRefresh`, `useUsersRealtimeRefresh`
- Novo hook genérico: `useRealtimeSync(channel, callback, debounceMs?)`

**Onde:**

- Frontend: [apps/frontend/src/hooks/](apps/frontend/src/hooks/)

**Implementação:**

```typescript
// Antes (4 hooks duplicados)
useOrdersRealtimeRefresh(debounceMs);
useCatalogRealtimeRefresh(debounceMs);

// Depois (1 hook genérico)
useRealtimeSync('orders', () => refreshOrders(), 250);
useRealtimeSync('catalog', () => refreshCatalog(), 250);
```

**Dependências:** Nenhuma

---

### 12. Virtualização OrderBoard (50+ itens)

**Prioridade:** 🟢 BAIXA (otimização)
**Impacto:** UI não trava com 50+ pedidos simultâneos

**O que fazer:**

- Integrar `react-window` para virtualização de lista
- Render apenas itens visíveis na viewport

**Onde:**

- Frontend: [apps/frontend/src/routes/admin/OrderBoard.tsx](apps/frontend/src/routes/admin/OrderBoard.tsx)

**Dependências:** `react-window` (npm install)

---

## 🔴 ONDA I: Integrações Críticas (Sprint 7-10, 6-8 semanas)

### 13. Payment Gateway - Stripe

**Prioridade:** 🔴 CRÍTICA (comercial)
**Impacto:** Suporta pagamento online, expande canais

**O que fazer:**

- Integração completa com Stripe (card + PIX)
- Fluxo: Order → Payment Intent → Confirmação → Webhook
- Salvar payment_id na Order para rastreamento
- Admin: visualizar status pagamento

**Onde:**

- Backend: [apps/server/src/modules/payments/](apps/server/src/modules/payments/) (novo)
- Frontend: [apps/frontend/src/features/checkout/](apps/frontend/src/features/checkout/)

**Endpoints:**

- `POST /api/payments/create-intent` → { clientSecret, paymentId }
- `GET /api/payments/:paymentId/status` → { status, order }
- `POST /api/webhooks/stripe` → validar assinatura, atualizar Order

**Implementação:**

- Padrão adapter: `PaymentProvider` abstrato (futuro: trocar for MP)
- Salvar Stripe pubKey em config
- Cliente-side: @stripe/react-stripe-js

**Dependências:**

- Stripe account + pubKey/secretKey
- @stripe/stripe-js
- Webhook URL configurado

**Security:**

- Nunca expôr secretKey no frontend
- Validar assinatura webhook
- PCI compliance

---

### 14. Payment Gateway - Mercado Pago

**Prioridade:** 🔴 CRÍTICA (comercial)
**Impacto:** Alternativa Stripe, maior penetração Brasil

**O que fazer:**

- Integração paralela com Mercado Pago (PIX QR + Cartão)
- Mesma arquitetura adapter (trocar provider)
- Suporte a webhook e polling de status

**Onde:**

- Backend: [apps/server/src/modules/payments/](apps/server/src/modules/payments/)
- Frontend: [apps/frontend/src/features/checkout/](apps/frontend/src/features/checkout/)

**Features:**

- PIX QR Code (cópia e cola)
- Parcelamento de cartão (até 12x)
- Status em tempo real

**Dependências:**

- Mercado Pago account + accessToken
- mercadopago SDK

---

### 15. SMS Notifications (Twilio)

**Prioridade:** 🟠 ALTA
**Impacto:** Notificações, aumenta retirada a tempo

**O que fazer:**

- Enviar SMS de confirmação pedido + status pronta-retirada
- Novo módulo: `notifications` (shared para SMS, Email, Push)
- Trigger automático em transições de status críticas

**Onde:**

- Backend: [apps/server/src/modules/notifications/](apps/server/src/modules/notifications/) (novo)

**Triggers:**

- Order created: "Seu pedido #12345 foi confirmado. Pronto em ~15min"
- Status READY: "Seu pedido #12345 está pronto! Retire em balcão"
- Payment confirmed: "Pagamento confirmado. Obrigado!"

**Implementação:**

- Serviço TwilioService com fallback mock
- Fila de SMS (Bull/Bee-Queue para retry)
- Config em .env (Twilio account SID, auth token, número)

**Dependências:**

- Twilio account + SDK
- twilio npm package

---

### 16. Email Notifications (SendGrid)

**Prioridade:** 🟠 ALTA
**Impacto:** Rastreabilidade, notificações assíncronas

**O que fazer:**

- Confirmação de pedido, recibo, relatórios agendados (admin)
- Templates HTML profissionais
- Fila com retry(automático para falhas

**Onde:**

- Backend: [apps/server/src/modules/notifications/](apps/server/src/modules/notifications/)

**Emails:**

- Confirmação: "Seu pedido foi recebido"
- Recibo: "Seu pedido #12345: Big Burger + Extras = R$ 37.40"
- Relatório diário (admin): vendas, itens mais vendidos
- Notificação de erro (admin): falha crítica no sistema

**Implementação:**

- Serviço SendGridService com templates
- Fila de emails com retry
- Config em .env (SendGrid API key, fromEmail)

**Dependências:**

- SendGrid account + API key
- @sendgrid/mail npm package

---

### 17. Push Notifications (Firebase Cloud Messaging)

**Prioridade:** 🟠 ALTA
**Impacto:** Engagement, retirada no prazo

**O que fazer:**

- Notificar status pedido, retirada pronta em app/web
- Service Worker + FCM token
- Permissão do browser na primeira visita

**Onde:**

- Frontend: [apps/frontend/src/App.tsx](apps/frontend/src/App.tsx)
- Backend: [apps/server/src/modules/notifications/](apps/server/src/modules/notifications/)

**Flow:**

1. Frontend: solicita permissão → recebe FCM token
2. Frontend: envia token ao backend (POST /api/notifications/register-token)
3. Backend: armazena token em User profile
4. Backend: envia push quando status muda (Order → Ready)

**Triggers:**

- "Seu pedido está sendo preparado"
- "Seu pedido está pronto! Retire em balcão"

**Implementação:**

- Firebase Console: criar projeto
- Frontend: firebase/messaging
- Backend: firebase-admin SDK
- Salvar FCM tokens em User.notificationTokens[]

**Dependências:**

- Firebase project + serviceAccountKey
- firebase npm package (frontend)
- firebase-admin npm package (backend)

---

## 🟡 ONDA J: Analytics & Escalabilidade (Sprint 11-12, 2-3 semanas)

### 18. Google Analytics 4 Tracking

**Prioridade:** 🟡 MÉDIA
**Impacto:** Entender comportamento usuário, otimizar conversão

**O que fazer:**

- Funnel conversion: Kiosk (Menu → Cart → Checkout → Confirmation)
- Pageviews, eventos customizados (add item, apply coupon)
- Heatmap de cliques (futuro: Hotjar)

**Onde:**

- Frontend: [apps/frontend/src/App.tsx](apps/frontend/src/App.tsx)

**Eventos GA4:**

- `page_view` (automático)
- `add_to_cart` → { item_id, item_name, price, quantity }
- `begin_checkout` → { value, currency }
- `purchase` → { transaction_id, value, items[] }

**Implementação:**

- Usar `react-ga4` ou `gtag.js` direto
- Inicializar em App.tsx com GA4 Measurement ID
- Enviar eventos customizados em rotas críticas

**Dependências:**

- GA4 account + Measurement ID
- react-ga4 ou gtag.js

---

### 19. Sentry Error Tracking

**Prioridade:** 🟡 MÉDIA
**Impacto:** Detecção rápida de bugs, debugging

**O que fazer:**

- Rastrear exceções frontend/backend
- Sourcemaps para stack trace legível
- Alertas de erro crítico (Slack/Email)

**Onde:**

- Frontend: [apps/frontend/src/App.tsx](apps/frontend/src/App.tsx)
- Backend: [apps/server/src/app.ts](apps/server/src/app.ts)

**Implementação:**

- Sentry.init() em App.tsx com DSN
- ErrorBoundary React com Sentry
- Middleware backend: catch e Sentry.captureException()

**Dependências:**

- Sentry account + DSN
- @sentry/react npm package
- @sentry/node npm package

---

### 20. Migração Float → Decimal (Monetário)

**Prioridade:** 🟢 BAIXA (futuro)
**Impacto:** Evitar acumulação centavos > 1 (problemas contábeis pós-1000 pedidos/dia)

**O que fazer:**

- Trocar precisão monetária Float → Decimal (Prisma)
- Migration: converter dados existentes Float → Decimal
- Testing: validação monetária (soma = subtotal \* items)
- Precaução: backup antes de rodar

**Fase 1: Preparação**

- Criar migration Prisma: Float → Decimal(10, 2)
- Converter dados com rounding (ROUND_HALF_UP)
- Testar em staging

**Fase 2: Validação **

- Script de validação: soma(OrderItems) == Order.total
- Teste de regressão monetária (50+ pedidos x múltiplos addons)
- Documentar rollback

**Fase 3: Deploy**

- Backup automatizado
- Executar migration em produção
- Monitoramento de erros 24h

**Dependências:**

- Volume > 1000/dia (trigger para roadmap)
- Prisma ≥ 5.0 (Decimal support)

**Risco:** ALTO (dados monetários críticos)

---

## 📊 Resumo Consolidado

### Por Prioridade

| Prioridade | Ondas   | Itens  | Exemplos                                  |
| ---------- | ------- | ------ | ----------------------------------------- |
| 🔴 CRÍTICA | F, I    | 4      | Lockout, Validações, Stripe, MP           |
| 🟠 ALTA    | F, G, I | 6      | Erros normalizados, KDS, SMS, Email, Push |
| 🟡 MÉDIA   | G, H, J | 6      | Toast, Board SLA, Cache, LA4, Sentry      |
| 🟢 BAIXA   | H, J    | 4      | Lazy load, Consolidar hooks, Decimal      |
| **TOTAL**  | **F-J** | **20** | **5 ondas, 6-12 meses**                   |

### Timeline Recomendada

- **ONDA F** (Sprint 1-2) → Segurança (vai primeiro)
- **ONDA G** (Sprint 3-4) → Operações
- **ONDA H** (Sprint 5-6) → Performance
- **ONDA I** (Sprint 7-10) → Integrações (maior esforço)
- **ONDA J** (Sprint 11-12) → Analytics
