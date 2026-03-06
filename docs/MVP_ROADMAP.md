# MVP Roadmap - Sistema de Pedidos

## 1. Filosofia do MVP

**Objetivo**: Criar a **versão mínima funcional** que permita operar o restaurante completamente, validar o conceito e coletar feedback real antes de adicionar funcionalidades avançadas.

**Princípios:**
- ✅ **Funcional, não perfeito**: Foco em features que agregam valor imediato
- ✅ **Validação rápida**: Colocar em uso real o quanto antes
- ✅ **Arquitetura sólida**: Base bem estruturada para crescimento futuro
- ✅ **Reduzir complexidade**: Evitar over-engineering no MVP

---

## 2. Escopo do MVP

### 2.1 O QUE ENTRA NO MVP ✅

#### Backend

**Banco de Dados e Migrations:**
- ✅ Schema Prisma com todas as entidades principais
- ✅ Migrations funcionais
- ✅ Seed data (categorias, itens, combos, usuários padrão)

**API REST:**
- ✅ CRUD de Menu (categorias, itens, adicionais)
- ✅ CRUD de Combos (básico: preço fixo + itens inclusos, sem regras complexas)
- ✅ Criação de pedidos (POST /api/orders)
- ✅ Listagem de pedidos (GET /api/orders com filtros básicos)
- ✅ Atualização de status de pedidos (PATCH /api/orders/:id/status)
- ✅ Autenticação JWT (login staff/admin)
- ✅ Middleware de autorização (checkRole)
- ✅ Cálculo automático de preço de pedidos

**Funcionalidades Adicionais:**
- ✅ Validação de payloads (Zod)
- ✅ Logging básico (Pino)
- ✅ Error handling centralizado
- ✅ CORS configurado para rede local

---

#### Frontend

**Kiosk (Cliente):**
- ✅ Splash screen
- ✅ Navegação de categorias
- ✅ Listagem de itens por categoria
- ✅ Modal de personalização (adicionais + observações)
- ✅ Carrinho com cálculo de total em tempo real
- ✅ Confirmação de pedido
- ✅ Tela de número do pedido

**Staff (Funcionário):**
- ✅ Login
- ✅ Dashboard com métricas básicas (pedidos do dia)
- ✅ Novo pedido (seleção rápida de itens)
- ✅ Lista de pedidos (filtros: pendente, preparando, pronto)
- ✅ Atualização de status de pedido
- ✅ Visualização de detalhes do pedido

**Admin (Gerente):**
- ✅ Login
- ✅ Dashboard com métricas (vendas, pedidos, ticket médio)
- ✅ Gerenciar cardápio (CRUD de itens)
- ✅ Gerenciar categorias (CRUD)
- ✅ Marcar itens como disponível/indisponível
- ✅ Visualizar pedidos do dia/período

**UI/UX:**
- ✅ Design responsivo (totem, tablet, desktop)
- ✅ Componentes shadcn/ui integrados
- ✅ Tailwind CSS configurado
- ✅ Loading states e feedback visual básico

---

#### Infraestrutura

- ✅ Monorepo configurado (frontend + server)
- ✅ TypeScript end-to-end
- ✅ Build scripts (Vite, tsc)
- ✅ SQLite como banco de dados
- ✅ Servidor local (Fastify)
- ✅ Script de inicialização (setup.sh ou npm run setup)
- ✅ README com instruções de instalação

---

### 2.2 O QUE FICA PARA DEPOIS ❌

#### Features Avançadas (v2.0+)

**Combos Avançados:**
❌ Regras de personalização complexas (ComboRule com SELECT_ONE, UPGRADE)
❌ Combos com múltiplas escolhas (ex: monte seu combo)
❌ Validação de regras em tempo real

**Pagamento Integrado:**
❌ Integração com gateway (PIX, cartão)
❌ Geração de QR Code
❌ Webhooks de pagamento
❌ Múltiplas formas de pagamento por pedido

**Tempo Real (WebSocket):**
❌ Atualização automática de pedidos (polling manual no MVP)
❌ Notificações push para staff
❌ Sincronização de cardápio em tempo real

**Relatórios Avançados:**
❌ Gráficos detalhados (usar libs de chart)
❌ Exportação de relatórios (PDF, Excel)
❌ Análise de tendências
❌ Comparativo semanal/mensal

**Gestão de Usuários Completa:**
❌ Recuperação de senha (email)
❌ Perfis personalizáveis
❌ Histórico de atividades
❌ Permissões granulares (ACL)

**Multi-loja:**
❌ Suporte a múltiplas filiais
❌ Sincronização entre lojas

**Inventário:**
❌ Controle de estoque
❌ Alertas de estoque baixo
❌ Ingredientes e receitas

**Delivery:**
❌ Integração com apps de delivery
❌ Rastreamento de entregadores
❌ Cálculo de taxa de entrega

**Impressão:**
❌ Impressão automática de comandas (cozinha)
❌ Impressão de cupom fiscal
❌ Integração com impressoras térmicas

**PWA Avançado:**
❌ Sincronização offline completa (local-first)
❌ Background sync
❌ Push notifications

**Testes:**
❌ Cobertura de testes completa (80%+)
❌ E2E testes automatizados (Playwright)
❌ Performance testing

---

## 3. Fases de Implementação

### FASE 1: Setup e Estrutura Base (Semana 1)
**Duração estimada:** 5-7 dias

#### Backend
- [ ] Inicializar projeto Node.js + TypeScript + Fastify
- [ ] Configurar Prisma + SQLite
- [ ] Criar schema Prisma (entidades principais)
- [ ] Gerar migrations iniciais
- [ ] Criar seed script (dados de exemplo)
- [ ] Configurar linting (ESLint + Prettier)
- [ ] Estrutura de pastas (modules, routes, services)

#### Frontend
- [ ] Inicializar projeto React + Vite + TypeScript
- [ ] Configurar Tailwind CSS
- [ ] Instalar shadcn/ui (componentes base)
- [ ] Estrutura de pastas (routes, features, components)
- [ ] Configurar React Router
- [ ] Configurar Zustand (state management)

#### DevOps
- [ ] Scripts de build
- [ ] Scripts de dev (hot reload)
- [ ] README com instruções
- [ ] .env.example

**Entregável:** Projeto inicializado, estrutura de pastas, build funcional, seed data no banco.

---

### FASE 2: Backend API (Semana 2)
**Duração estimada:** 7-10 dias

- [ ] Module: Auth
  - [ ] POST /api/auth/login (JWT)
  - [ ] Middleware: verificar JWT
  - [ ] Middleware: checkRole

- [ ] Module: Menu
  - [ ] GET /api/categories (listar categorias)
  - [ ] GET /api/menu (listar todos os itens)
  - [ ] GET /api/menu?category=:id (filtrar por categoria)
  - [ ] POST /api/menu (criar item - admin)
  - [ ] PUT /api/menu/:id (editar - admin)
  - [ ] PATCH /api/menu/:id/availability (disponível/indisponível - admin)

- [ ] Module: Combos (simplificado)
  - [ ] GET /api/combos (listar combos ativos)
  - [ ] GET /api/combos/:id (detalhes do combo)
  - [ ] POST /api/combos (criar - admin)
  - [ ] PUT /api/combos/:id (editar - admin)

- [ ] Module: Orders
  - [ ] POST /api/orders (criar pedido)
  - [ ] GET /api/orders (listar, com filtros: status, date)
  - [ ] GET /api/orders/:id (detalhes)
  - [ ] PATCH /api/orders/:id/status (atualizar status)
  - [ ] Service: calculateOrderTotal (lógica de precificação)

- [ ] Module: Addons
  - [ ] GET /api/addons (listar)
  - [ ] Relação MenuItemAddon (quais addons por item)

**Entregável:** API completa e testável via Postman/Insomnia, documentação das rotas (OpenAPI/Swagger opcional).

---

### FASE 3: Frontend Kiosk (Semana 3)
**Duração estimada:** 7-10 dias

- [ ] Splash Screen (/kiosk)
- [ ] Tela de Categorias (/kiosk/menu)
  - [ ] Fetch /api/categories
  - [ ] Grid de cards clicáveis
- [ ] Tela de Itens (/kiosk/menu/:category)
  - [ ] Fetch /api/menu?category=:id
  - [ ] Lista com imagem, nome, preço
  - [ ] Botão [+] para adicionar
- [ ] Modal de Personalização
  - [ ] Fetch adicionais permitidos
  - [ ] Checkbox + stepper de quantidade
  - [ ] Campo observações
  - [ ] Botão "Adicionar ao Carrinho"
- [ ] Carrinho (sidebar ou tela /kiosk/cart)
  - [ ] Lista de itens com subtotal
  - [ ] Controle de quantidade (+/-)
  - [ ] Remover item
  - [ ] Total calculado
- [ ] Confirmação (/kiosk/checkout)
  - [ ] Resumo do pedido
  - [ ] POST /api/orders
  - [ ] Exibir número do pedido
- [ ] State Management (Zustand)
  - [ ] CartStore (items, addItem, removeItem, calculateTotal)
  - [ ] MenuStore (categories, items, fetch)

**Entregável:** Interface Kiosk funcional end-to-end, cliente pode fazer pedido completo.

---

### FASE 4: Frontend Staff (Semana 4)
**Duração estimada:** 5-7 dias

- [ ] Login (/staff/login)
  - [ ] POST /api/auth/login
  - [ ] Salvar token (localStorage)
- [ ] Dashboard (/staff)
  - [ ] Métricas básicas (cards)
  - [ ] Lista de próximos pedidos (status: PENDING, CONFIRMED)
- [ ] Novo Pedido (/staff/new-order)
  - [ ] Seleção rápida de itens
  - [ ] Busca por nome
  - [ ] Atalhos para combos
  - [ ] Carrinho lateral
  - [ ] Finalizar → POST /api/orders
- [ ] Lista de Pedidos (/staff/orders)
  - [ ] Fetch /api/orders com filtros
  - [ ] Cards por pedido
  - [ ] Ações: Ver detalhes, Atualizar status
- [ ] Detalhes do Pedido (/staff/orders/:id)
  - [ ] Itens do pedido
  - [ ] Status atual
  - [ ] Botões de ação (Confirmar, Preparar, Marcar Pronto)

**Entregável:** Interface Staff funcional, funcionário pode criar e gerenciar pedidos.

---

### FASE 5: Frontend Admin (Semana 5)
**Duração estimada:** 5-7 dias

- [ ] Login (/admin/login)
- [ ] Dashboard (/admin)
  - [ ] Métricas (faturamento, pedidos, ticket médio)
  - [ ] Gráfico simples (lib: recharts ou chart.js - opcional MVP)
- [ ] Gerenciar Cardápio (/admin/menu)
  - [ ] Lista de categorias e itens
  - [ ] Botão [+ Novo Item]
  - [ ] Ações: Editar, Desativar, Marcar indisponível
- [ ] Editar Item (/admin/menu/:id)
  - [ ] Formulário completo
  - [ ] Upload de imagem (opcional MVP: URL externa)
  - [ ] PUT /api/menu/:id
- [ ] Gerenciar Combos (/admin/combos)
  - [ ] Lista de combos
  - [ ] Formulário simplificado (combo fixo, sem regras)
- [ ] Visualizar Pedidos (/admin/orders)
  - [ ] Lista com filtros avançados (data, status)
  - [ ] Exportação básica (copiar JSON - opcional)

**Entregável:** Interface Admin funcional, gerente pode administrar cardápio e visualizar relatórios básicos.

---

### FASE 6: Polimento e Deploy (Semana 6)
**Duração estimada:** 3-5 dias

- [ ] Ajustes de UX (botões grandes, contraste, feedback visual)
- [ ] Loading states e spinners
- [ ] Tratamento de erros (toast notifications)
- [ ] Validação de formulários
- [ ] Testes manuais de fluxos completos
- [ ] Configuração do PC central (Windows)
  - [ ] Instalar Node.js
  - [ ] Configurar IP estático
  - [ ] Abrir porta no firewall
- [ ] Documentação de uso (manual do usuário)
- [ ] Treinamento da equipe (staff + admin)
- [ ] Setup em produção (restaurante)
- [ ] Monitoramento básico (logs)

**Entregável:** Sistema em produção, funcionando na rede local, equipe treinada.

---

## 4. Critérios de Aceite do MVP

### 4.1 Fluxo Kiosk (Cliente)
✅ Cliente acessa totem → vê categorias → escolhe item → personaliza → adiciona ao carrinho → confirma pedido → recebe número do pedido

**Testado com:**
- Cardápio com 20+ itens
- 3-5 categorias diferentes
- Combos simples (preço fixo)
- Pedido com múltiplos itens e adicionais

---

### 4.2 Fluxo Staff (Funcionário)
✅ Funcionário faz login → vê dashboard → cria novo pedido para cliente (balcão) → monitora lista de pedidos → atualiza status (Preparando → Pronto) → marca como entregue

**Testado com:**
- Múltiplos pedidos simultâneos (10+)
- Atualização de status sem refresh
- Filtros funcionando

---

### 4.3 Fluxo Admin (Gerente)
✅ Gerente faz login → vê dashboard com métricas → edita item do cardápio (preço, disponibilidade) → cria novo combo → visualiza pedidos do dia

**Testado com:**
- Edição de item refletida instantaneamente no Kiosk
- Marcar item indisponível oculta do cardápio
- Métricas calculadas corretamente

---

### 4.4 Performance
✅ Tempo de resposta API < 200ms para queries simples (rede local)
✅ Interface responsiva (60 FPS em tablets/totems)
✅ Sem travamentos com 10+ dispositivos simultâneos

---

### 4.5 Usabilidade
✅ Cliente consegue fazer pedido sozinho em menos de 3 minutos
✅ Funcionário consegue criar pedido em menos de 1 minuto
✅ Interface intuitiva, sem necessidade de manual

---

## 5. Estimativa de Esforço

### Por Fase

| Fase | Descrição | Dias | Pessoa |
|------|-----------|------|--------|
| Fase 1 | Setup e estrutura | 5-7 | 1 dev full-stack |
| Fase 2 | Backend API | 7-10 | 1 dev backend |
| Fase 3 | Frontend Kiosk | 7-10 | 1 dev frontend |
| Fase 4 | Frontend Staff | 5-7 | 1 dev frontend |
| Fase 5 | Frontend Admin | 5-7 | 1 dev frontend |
| Fase 6 | Polimento e deploy | 3-5 | 1 dev + 1 operador |
| **TOTAL** | | **32-46 dias** | **1-2 devs** |

**Com 1 desenvolvedor full-stack solo:** ~6-8 semanas (1,5 a 2 meses)
**Com 2 desenvolvedores (1 back + 1 front):** ~4-6 semanas (1 a 1,5 meses)

---

## 6. Stack Recap (MVP)

| Camada | Tecnologia | Justificativa |
|--------|------------|---------------|
| **Backend** | Node.js + TypeScript + Fastify | Performance, type-safety, ecosystem rico |
| **Database** | SQLite + Prisma | Zero config, migrations, ORM type-safe |
| **Frontend** | React + TypeScript + Vite | Maduro, rápido, componentização |
| **UI** | Tailwind CSS + shadcn/ui | Desenvolvimento rápido, acessível |
| **State** | Zustand | Simples, sem boilerplate |
| **Auth** | JWT | Stateless, simples para off-grid |
| **HTTP Client** | Axios | Interceptors, retry logic |
| **Validation** | Zod | Type-safe, runtime validation |

---

## 7. Próximos Passos Pós-MVP (Backlog v2.0)

### Prioridade Alta (Próxima Versão)
1. **WebSocket (Tempo Real)**
   - Atualização automática de pedidos
   - Notificações push para staff
   - Reduzir polling manual

2. **Combos Avançados**
   - Regras de escolha (SELECT_ONE, UPGRADE)
   - Validação de regras
   - Precificação dinâmica

3. **Impressão de Comandas**
   - Integração com impressora térmica
   - Impressão automática ao criar pedido
   - Layout específico para cozinha

4. **Relatórios Avançados**
   - Gráficos detalhados (por período, categoria)
   - Exportação PDF/Excel
   - Dashboard mais rico

---

### Prioridade Média
5. **Pagamento PIX**
   - Integração com gateway
   - QR Code dinâmico
   - Confirmação automática

6. **PWA Completo**
   - Instalável com ícone
   - Service Worker robusto
   - Cache offline de assets

7. **Gestão de Usuários**
   - CRUD de funcionários
   - Permissões granulares
   - Logs de atividade

8. **Backup Automático**
   - Agendamento diário
   - Upload para nuvem (Dropbox, Google Drive)

---

### Prioridade Baixa (Futuro)
9. **Multi-loja**
10. **Delivery**
11. **Inventário**
12. **Integração com ERP**
13. **App Mobile Nativo**

---

## 8. Riscos e Mitigações

### Risco 1: Performance do SQLite com Múltiplos Dispositivos
**Impacto:** Alto | **Probabilidade:** Média

**Mitigação:**
- Habilitar WAL mode (Write-Ahead Logging)
- Otimizar queries (índices)
- Monitorar carga (se > 20 dispositivos, considerar PostgreSQL)

---

### Risco 2: Rede Wi-Fi Instável
**Impacto:** Alto | **Probabilidade:** Média-Alta

**Mitigação:**
- Usar roteador profissional (não doméstico)
- Configurar IP estático para servidor
- Implementar retry logic no frontend
- Timeout configurável

---

### Risco 3: PC Central Desligado/Travado
**Impacto:** Alto | **Probabilidade:** Baixa

**Mitigação:**
- Configurar Windows para não hibernar
- Processo do Node.js como serviço (pm2 ou Windows Service)
- Script de monitoramento (restart automático)
- UPS (no-break) para evitar desligamento por queda de energia

---

### Risco 4: Cardápio Muito Grande (100+ itens)
**Impacto:** Médio | **Probabilidade:** Baixa

**Mitigação:**
- Paginação na listagem
- Busca eficiente (índices no banco)
- Lazy loading de imagens
- Cache de cardápio no frontend (5 minutos)

---

### Risco 5: Adoção pelos Usuários (Staff Resiste)
**Impacto:** Alto | **Probabilidade:** Média

**Mitigação:**
- Treinamento adequado (hands-on)
- Interface intuitiva (UX research)
- Período de transição (sistema antigo + novo em paralelo)
- Coletar feedback contínuo

---

## 9. Métricas de Sucesso

### Operacionais
- ✅ **Tempo médio de criação de pedido (Kiosk)** < 3 minutos
- ✅ **Tempo médio de atendimento no balcão** < 1 minuto
- ✅ **Uptime do sistema** > 99% (durante horário de operação)
- ✅ **Erros reportados** < 5 por semana

### Negócio
- ✅ **Redução de filas** em 30%+ (comparado a atendimento manual)
- ✅ **Aumento de ticket médio** (clientes adicionam mais itens no totem)
- ✅ **Satisfação do cliente** (pesquisa pós-pedido - futuro)
- ✅ **Redução de erros de pedido** em 50%+

---

## 10. Checklist de Go-Live

### Pré-Lançamento
- [ ] Todos os fluxos principais testados (Kiosk, Staff, Admin)
- [ ] Seed data com cardápio real do restaurante
- [ ] Treinamento da equipe concluído
- [ ] Documentação de uso entregue
- [ ] PC central configurado e testado
- [ ] Rede Wi-Fi estável e IP estático
- [ ] Backup inicial do banco de dados
- [ ] Plano de rollback (ter sistema antigo como fallback)

### Durante Soft Launch (1-2 semanas)
- [ ] Operar em horário de menor movimento
- [ ] Equipe técnica de prontidão
- [ ] Coletar feedback de staff e clientes
- [ ] Monitorar logs e performance
- [ ] Ajustes rápidos conforme necessário

### Pós-Lançamento
- [ ] Reunião de retrospectiva com equipe
- [ ] Documentar lições aprendidas
- [ ] Priorizar backlog v2.0
- [ ] Agendar próximas iterações

---

## 11. Conclusão

Este MVP é **ambicioso, mas viável** em 6-8 semanas com desenvolvedor(es) dedicado(s). A stack escolhida é moderna, produtiva e adequada para off-grid.

**Próximo Passo:** Validar este documento com stakeholders e iniciar a **Fase 1** (Setup).

**Após MVP em Produção:** Coletar feedback real, medir métricas e iterar rapidamente. A arquitetura preparada permite evoluir sem reescrita.

---

## Apêndice: Diagrama de Gantt (Simplificado)

```
Semana 1: ████████████████ Fase 1: Setup
Semana 2: ████████████████ Fase 2: Backend API
Semana 3: ████████████████ Fase 3: Frontend Kiosk
Semana 4: ████████████████ Fase 4: Frontend Staff
Semana 5: ████████████████ Fase 5: Frontend Admin
Semana 6: ████████████████ Fase 6: Polimento + Deploy
```

**Timeline Total:** 6 semanas (ajustável conforme disponibilidade de recursos)
