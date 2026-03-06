# Checklist de Implementação - Sistema de Pedidos

Este checklist guia a implementação prática do MVP, fase por fase.

---

## ✅ FASE 1: Setup e Estrutura Base (5-7 dias)

### Backend Setup

- [ ] **1.1 Inicializar projeto Node.js**
  ```bash
  mkdir sistema-pedidos
  cd sistema-pedidos
  npm init -y
  mkdir apps packages docs
  ```

- [ ] **1.2 Configurar workspaces no root**
  - [ ] Editar `package.json` com `"workspaces": ["apps/*", "packages/*"]`
  - [ ] Adicionar scripts: `dev`, `build`, `test`, `lint`

- [ ] **1.3 Inicializar backend**
  ```bash
  cd apps
  mkdir server
  cd server
  npm init -y
  npm install fastify @fastify/cors @fastify/jwt
  npm install -D typescript @types/node tsx prisma
  ```

- [ ] **1.4 Configurar TypeScript (backend)**
  - [ ] Criar `tsconfig.json`
  - [ ] Configurar `paths` com aliases (`@/*`)

- [ ] **1.5 Estrutura de pastas backend**
  - [ ] Criar: `src/`, `src/modules/`, `src/shared/`, `src/config/`, `src/types/`
  - [ ] Criar: `prisma/`, `prisma/migrations/`

- [ ] **1.6 Configurar Prisma**
  ```bash
  npx prisma init --datasource-provider sqlite
  ```
  - [ ] Editar `schema.prisma` com todas as entidades (copiar de DATA_MODEL.md)
  - [ ] Gerar migrations: `npx prisma migrate dev --name init`
  - [ ] Gerar Prisma Client: `npx prisma generate`

- [ ] **1.7 Criar seed script**
  - [ ] Criar `prisma/seed.ts`
  - [ ] Adicionar categorias padrão (Hambúrgueres, Bebidas, etc.)
  - [ ] Adicionar itens de exemplo (5-10 por categoria)
  - [ ] Adicionar combos exemplo (2-3)
  - [ ] Adicionar usuários: admin e staff padrão
  - [ ] Adicionar roles (admin, staff)
  - [ ] Executar: `npx prisma db seed`

- [ ] **1.8 Setup inicial do Fastify**
  - [ ] Criar `src/app.ts` (configuração do Fastify)
  - [ ] Criar `src/server.ts` (entry point)
  - [ ] Configurar CORS
  - [ ] Configurar logger (Pino)
  - [ ] Testar: `npm run dev` → servidor rodando

---

### Frontend Setup

- [ ] **1.9 Inicializar frontend**
  ```bash
  cd ../
  npm create vite@latest frontend -- --template react-ts
  cd frontend
  npm install
  ```

- [ ] **1.10 Instalar dependências frontend**
  ```bash
  npm install react-router-dom zustand axios
  npm install -D tailwindcss postcss autoprefixer
  npx tailwindcss init -p
  ```

- [ ] **1.11 Configurar Tailwind CSS**
  - [ ] Editar `tailwind.config.js` (adicionar paths: `./src/**/*.{js,ts,jsx,tsx}`)
  - [ ] Criar `src/styles/globals.css` com directives do Tailwind

- [ ] **1.12 Instalar shadcn/ui**
  ```bash
  npx shadcn-ui@latest init
  npx shadcn-ui@latest add button card input dialog toast
  ```

- [ ] **1.13 Estrutura de pastas frontend**
  - [ ] Criar: `src/app/`, `src/routes/`, `src/features/`, `src/components/`
  - [ ] Criar: `src/services/`, `src/stores/`, `src/utils/`, `src/types/`
  - [ ] Criar subpastas em `routes/`: `kiosk/`, `staff/`, `admin/`

- [ ] **1.14 Configurar TypeScript (frontend)**
  - [ ] Editar `tsconfig.json` com paths aliases
  - [ ] Adicionar: `"@/*": ["./src/*"]`

- [ ] **1.15 Configurar React Router**
  - [ ] Criar `src/app/router.tsx`
  - [ ] Definir rotas: `/kiosk`, `/staff`, `/admin`
  - [ ] Integrar no `App.tsx`

- [ ] **1.16 Setup de API client**
  - [ ] Criar `src/services/api.service.ts`
  - [ ] Configurar Axios base URL
  - [ ] Adicionar interceptors (JWT, error handling)

---

### Package Shared (Opcional mas Recomendado)

- [ ] **1.17 Criar package shared**
  ```bash
  cd ../../packages
  mkdir shared
  cd shared
  npm init -y
  npm install -D typescript
  ```

- [ ] **1.18 Definir tipos compartilhados**
  - [ ] Criar `src/types/menu.types.ts`
  - [ ] Criar `src/types/order.types.ts`
  - [ ] Criar `src/types/user.types.ts`

---

### DevOps e Scripts

- [ ] **1.19 Configurar ESLint + Prettier**
  - [ ] Criar `.eslintrc.json` no root
  - [ ] Criar `.prettierrc` no root
  - [ ] Adicionar scripts: `lint`, `format`

- [ ] **1.20 Criar scripts auxiliares**
  - [ ] `scripts/setup.sh` (Linux/Mac)
  - [ ] `scripts/setup.ps1` (Windows)
  - [ ] `scripts/backup.sh` (backup do .db)

- [ ] **1.21 Documentação básica**
  - [ ] Criar README.md no root (copiar de docs/)
  - [ ] Criar .env.example (backend e frontend)

- [ ] **1.22 Testar setup completo**
  - [ ] Backend rodando: `npm run dev -w server`
  - [ ] Frontend rodando: `npm run dev -w frontend`
  - [ ] Sem erros de build
  - [ ] Banco de dados seed executado

---

## ✅ FASE 2: Backend API (7-10 dias)

### Module: Auth

- [ ] **2.1 Criar estrutura do módulo**
  - [ ] `src/modules/auth/auth.routes.ts`
  - [ ] `src/modules/auth/auth.service.ts`
  - [ ] `src/modules/auth/auth.middleware.ts`
  - [ ] `src/modules/auth/auth.types.ts`

- [ ] **2.2 Implementar login**
  - [ ] POST `/api/auth/login`
  - [ ] Validar username + password (bcrypt)
  - [ ] Gerar JWT token
  - [ ] Retornar user + token

- [ ] **2.3 Implementar middleware JWT**
  - [ ] Verificar token no header `Authorization: Bearer <token>`
  - [ ] Decodificar e validar token
  - [ ] Adicionar `user` ao request

- [ ] **2.4 Implementar middleware de role**
  - [ ] `checkRole(['admin', 'staff'])`
  - [ ] Verificar se user.role está na lista permitida

- [ ] **2.5 Testar com Postman/Insomnia**
  - [ ] Login com credenciais corretas → 200 + token
  - [ ] Login com credenciais erradas → 401
  - [ ] Rota protegida sem token → 401
  - [ ] Rota protegida com token válido → 200

---

### Module: Menu

- [ ] **2.6 Criar estrutura do módulo**
  - [ ] `menu.routes.ts`, `menu.service.ts`, `menu.repository.ts`, `menu.types.ts`

- [ ] **2.7 Implementar endpoints públicos**
  - [ ] GET `/api/categories` (listar categorias ativas)
  - [ ] GET `/api/menu` (listar todos os itens disponíveis)
  - [ ] GET `/api/menu?category=:id` (filtrar por categoria)
  - [ ] GET `/api/menu/:id` (detalhes de um item)

- [ ] **2.8 Implementar endpoints admin**
  - [ ] POST `/api/menu` (criar item - admin only)
  - [ ] PUT `/api/menu/:id` (editar item - admin only)
  - [ ] PATCH `/api/menu/:id/availability` (marcar disponível/indisponível)
  - [ ] DELETE `/api/menu/:id` (desativar item - soft delete)

- [ ] **2.9 Implementar validações (Zod)**
  - [ ] Schema para CreateMenuItemDto
  - [ ] Schema para UpdateMenuItemDto
  - [ ] Validar antes de salvar no banco

- [ ] **2.10 Testar CRUD completo**
  - [ ] Criar categoria → 201
  - [ ] Criar item → 201
  - [ ] Listar itens → 200 + array
  - [ ] Editar item → 200
  - [ ] Marcar indisponível → item.isAvailable = false

---

### Module: Combos (Simplificado)

- [ ] **2.11 Criar estrutura do módulo**
  - [ ] `combos.routes.ts`, `combos.service.ts`, `combos.repository.ts`

- [ ] **2.12 Implementar endpoints públicos**
  - [ ] GET `/api/combos` (listar combos ativos e disponíveis)
  - [ ] GET `/api/combos/:id` (detalhes do combo + itens inclusos)

- [ ] **2.13 Implementar endpoints admin**
  - [ ] POST `/api/combos` (criar combo simples)
  - [ ] PUT `/api/combos/:id` (editar combo)
  - [ ] PATCH `/api/combos/:id/availability`

- [ ] **2.14 Testar combos**
  - [ ] Criar combo com 3 itens inclusos
  - [ ] Listar combos → retorna corretamente
  - [ ] Editar preço → reflete imediatamente

---

### Module: Orders

- [ ] **2.15 Criar estrutura do módulo**
  - [ ] `orders.routes.ts`, `orders.service.ts`, `orders.repository.ts`
  - [ ] `orders.calculator.ts` (lógica de precificação)

- [ ] **2.16 Implementar cálculo de preços**
  - [ ] Função: `calculateOrderTotal(items)`
  - [ ] Iterar por cada item
  - [ ] Se MenuItem: preço base + adicionais
  - [ ] Se Combo: preço fixo + adicionais extras
  - [ ] Retornar: `{ items: [...], totalAmount: 123.45 }`

- [ ] **2.17 Implementar criação de pedido**
  - [ ] POST `/api/orders`
  - [ ] Validar payload (items, quantities)
  - [ ] Calcular total automaticamente
  - [ ] Salvar Order + OrderItems + OrderItemAddons
  - [ ] Gerar orderNumber (ex: `2026-001`)
  - [ ] Registrar OrderStatusHistory (PENDING)
  - [ ] Retornar pedido completo + número

- [ ] **2.18 Implementar listagem de pedidos**
  - [ ] GET `/api/orders` (com filtros: status, date)
  - [ ] GET `/api/orders/:id` (detalhes completos com items)

- [ ] **2.19 Implementar atualização de status**
  - [ ] PATCH `/api/orders/:id/status`
  - [ ] Validar transições (PENDING → CONFIRMED → PREPARING → READY → COMPLETED)
  - [ ] Registrar histórico (OrderStatusHistory)

- [ ] **2.20 Testar fluxo completo de pedido**
  - [ ] Criar pedido com 2 itens + adicionais → 201
  - [ ] Cálculo de total está correto
  - [ ] Listar pedidos → inclui o novo
  - [ ] Atualizar status → histórico registrado
  - [ ] Buscar detalhes → itens completos

---

### Module: Addons

- [ ] **2.21 Implementar endpoints**
  - [ ] GET `/api/addons` (listar todos os adicionais ativos)
  - [ ] GET `/api/menu/:menuItemId/addons` (adicionais permitidos para um item)

- [ ] **2.22 Testar**
  - [ ] Listar adicionais → array correto
  - [ ] Filtrar por item → apenas addons permitidos

---

### Documentação da API

- [ ] **2.23 Documentar rotas (opcional: Swagger)**
  - [ ] Instalar `@fastify/swagger`
  - [ ] Adicionar schemas nas rotas
  - [ ] Acessar `/docs` → documentação interativa

- [ ] **2.24 Criar collection Postman/Insomnia**
  - [ ] Exportar requests de exemplo
  - [ ] Incluir no repositório (`/docs/api-collection.json`)

---

## ✅ FASE 3: Frontend Kiosk (7-10 dias)

### Setup Base

- [ ] **3.1 Criar estrutura de rotas Kiosk**
  - [ ] `routes/kiosk/SplashScreen.tsx`
  - [ ] `routes/kiosk/CategoriesPage.tsx`
  - [ ] `routes/kiosk/MenuItemsPage.tsx`
  - [ ] `routes/kiosk/CartPage.tsx`
  - [ ] `routes/kiosk/CheckoutPage.tsx`
  - [ ] `routes/kiosk/ConfirmationPage.tsx`

- [ ] **3.2 Configurar rotas no React Router**
  - [ ] `/kiosk` → SplashScreen
  - [ ] `/kiosk/menu` → CategoriesPage
  - [ ] `/kiosk/menu/:categoryId` → MenuItemsPage
  - [ ] `/kiosk/cart` → CartPage
  - [ ] `/kiosk/checkout` → CheckoutPage
  - [ ] `/kiosk/confirmation/:orderNumber` → ConfirmationPage

---

### Feature: Menu

- [ ] **3.3 Criar serviço de menu (frontend)**
  - [ ] `features/menu/services/menu.service.ts`
  - [ ] Função: `getCategories()`
  - [ ] Função: `getMenuItems(categoryId?)`
  - [ ] Função: `getMenuItem(id)`
  - [ ] Função: `getAddons(menuItemId)`

- [ ] **3.4 Criar hook useMenu**
  - [ ] `features/menu/hooks/useMenu.ts`
  - [ ] Usar react-query ou simples useState + useEffect

- [ ] **3.5 Criar componentes de Menu**
  - [ ] `features/menu/components/CategoryCard.tsx`
  - [ ] `features/menu/components/MenuItemCard.tsx`
  - [ ] `features/menu/components/MenuItemModal.tsx`
  - [ ] `features/menu/components/AddonsSelector.tsx`

- [ ] **3.6 Implementar tela de categorias**
  - [ ] Fetch categorias via API
  - [ ] Renderizar grid de CategoryCards
  - [ ] Click → navegar para `/kiosk/menu/:categoryId`

- [ ] **3.7 Implementar tela de itens**
  - [ ] Fetch itens por categoria
  - [ ] Renderizar lista de MenuItemCards
  - [ ] Click em [+] → abrir MenuItemModal

- [ ] **3.8 Implementar modal de personalização**
  - [ ] Exibir detalhes do item (imagem, descrição, preço)
  - [ ] Listar adicionais permitidos (checkbox + stepper)
  - [ ] Campo de observações (textarea)
  - [ ] Calcular preço em tempo real
  - [ ] Botão "Adicionar ao Carrinho"

---

### Feature: Cart

- [ ] **3.9 Criar CartStore (Zustand)**
  - [ ] `features/cart/store/cart.store.ts`
  - [ ] State: `items: CartItem[]`
  - [ ] Actions: `addItem`, `removeItem`, `updateQuantity`, `clear`
  - [ ] Computed: `calculateTotal()`

- [ ] **3.10 Criar componentes de Cart**
  - [ ] `features/cart/components/CartSummary.tsx` (badge com contador)
  - [ ] `features/cart/components/CartDrawer.tsx` (sidebar com itens)
  - [ ] `features/cart/components/CartItem.tsx` (item individual no carrinho)

- [ ] **3.11 Implementar tela de carrinho**
  - [ ] Listar todos os itens do carrinho
  - [ ] Controle de quantidade (+/-)
  - [ ] Botão remover item
  - [ ] Exibir subtotal de cada item
  - [ ] Exibir total geral
  - [ ] Botão "Finalizar Pedido" → navegar para `/kiosk/checkout`

---

### Feature: Orders (Kiosk)

- [ ] **3.12 Criar serviço de orders (frontend)**
  - [ ] `features/orders/services/orders.service.ts`
  - [ ] Função: `createOrder(data)`

- [ ] **3.13 Implementar tela de checkout**
  - [ ] Resumo do pedido (lista de itens + total)
  - [ ] Informação de pagamento (apenas informacional no MVP)
  - [ ] Botão "Confirmar Pedido" → POST `/api/orders`

- [ ] **3.14 Implementar tela de confirmação**
  - [ ] Exibir número do pedido (grande e destacado)
  - [ ] Mensagem: "Aguarde a chamada do seu número"
  - [ ] Botão "Fazer Novo Pedido" → limpar carrinho e voltar para splash
  - [ ] Timeout automático (30s) → voltar para splash

---

### Polimento Kiosk

- [ ] **3.15 Design touch-friendly**
  - [ ] Botões mínimo 80x80px
  - [ ] Font size 18px+
  - [ ] Espaçamento adequado (sem elementos muito próximos)

- [ ] **3.16 Feedback visual**
  - [ ] Loading spinners ao fazer requests
  - [ ] Toast notifications (item adicionado, erro, etc.)
  - [ ] Animações suaves (transitions)

- [ ] **3.17 Tratamento de erros**
  - [ ] Erro de rede → mensagem amigável
  - [ ] Item indisponível → badge "Esgotado"
  - [ ] Timeout → retry automático

- [ ] **3.18 Testar fluxo completo Kiosk**
  - [ ] Splash → Categorias → Itens → Personalizar → Carrinho → Checkout → Confirmação
  - [ ] Adicionar múltiplos itens
  - [ ] Adicionar combos
  - [ ] Remover itens do carrinho
  - [ ] Total calculado corretamente

---

## ✅ FASE 4: Frontend Staff (5-7 dias)

### Setup e Autenticação

- [ ] **4.1 Criar estrutura de rotas Staff**
  - [ ] `routes/staff/LoginPage.tsx`
  - [ ] `routes/staff/DashboardPage.tsx`
  - [ ] `routes/staff/NewOrderPage.tsx`
  - [ ] `routes/staff/OrdersListPage.tsx`
  - [ ] `routes/staff/OrderDetailsPage.tsx`

- [ ] **4.2 Criar AuthStore (Zustand)**
  - [ ] `features/auth/store/auth.store.ts`
  - [ ] State: `user`, `token`, `isAuthenticated`
  - [ ] Actions: `login`, `logout`, `checkAuth`

- [ ] **4.3 Criar serviço de autenticação**
  - [ ] `features/auth/services/auth.service.ts`
  - [ ] Função: `login(username, password)`
  - [ ] Função: `logout()`

- [ ] **4.4 Implementar LoginPage**
  - [ ] Formulário: username + password
  - [ ] Validação básica (campos obrigatórios)
  - [ ] Submit → POST `/api/auth/login`
  - [ ] Salvar token no localStorage
  - [ ] Redirecionar para `/staff` (dashboard)

- [ ] **4.5 Criar ProtectedRoute**
  - [ ] Verificar se `isAuthenticated`
  - [ ] Se não autenticado → redirecionar para `/staff/login`

---

### Dashboard Staff

- [ ] **4.6 Implementar DashboardPage**
  - [ ] Cards com métricas (pedidos hoje, em preparo, prontos)
  - [ ] Lista de próximos pedidos esperando
  - [ ] Lista de pedidos em preparo
  - [ ] Botão "Novo Pedido" (destaque)

- [ ] **4.7 Buscar dados de pedidos**
  - [ ] Fetch `/api/orders?status=PENDING,CONFIRMED,PREPARING`
  - [ ] Calcular métricas (count, aggregations)

---

### Novo Pedido (Staff)

- [ ] **4.8 Implementar NewOrderPage**
  - [ ] Busca rápida de itens (input de busca)
  - [ ] Atalhos para combos/itens mais vendidos
  - [ ] Grid de categorias (similar ao Kiosk)
  - [ ] Carrinho lateral sempre visível
  - [ ] Campo: nome do cliente (opcional)
  - [ ] Campo: local/mesa (dropdown ou input)

- [ ] **4.9 Reutilizar componentes do Kiosk**
  - [ ] CategoryCard
  - [ ] MenuItemCard (com ajustes de layout se necessário)
  - [ ] CartSummary

- [ ] **4.10 Implementar checkout rápido**
  - [ ] Botão "Finalizar Pedido" → criar pedido
  - [ ] Marcar `createdById` (user staff)
  - [ ] Exibir confirmação (toast ou modal)
  - [ ] Limpar carrinho e voltar para dashboard

---

### Lista de Pedidos

- [ ] **4.11 Implementar OrdersListPage**
  - [ ] Fetch pedidos com filtros (status, data)
  - [ ] Cards por pedido (compact view)
  - [ ] Exibir: #número, horário, status, total, quantidade de itens
  - [ ] Filtros rápidos: [Todos] [Pendentes] [Preparando] [Prontos]

- [ ] **4.12 Criar OrderCard**
  - [ ] `features/orders/components/OrderCard.tsx`
  - [ ] Badge de status (cores diferentes)
  - [ ] Botão "Ver Detalhes"
  - [ ] Ações rápidas: "Confirmar", "Marcar Pronto", "Finalizar"

- [ ] **4.13 Implementar atualização de status inline**
  - [ ] Click em botão de ação → PATCH `/api/orders/:id/status`
  - [ ] Atualizar lista localmente (otimistic update)
  - [ ] Toast de confirmação

---

### Detalhes do Pedido

- [ ] **4.14 Implementar OrderDetailsPage**
  - [ ] Fetch `/api/orders/:id`
  - [ ] Exibir: número, horário, status, cliente, local
  - [ ] Lista completa de itens (com adicionais e observações)
  - [ ] Timeline de status (histórico)
  - [ ] Botões de ação (conforme status atual)

- [ ] **4.15 Criar OrderTimeline**
  - [ ] `features/orders/components/OrderTimeline.tsx`
  - [ ] Exibir OrderStatusHistory formatado
  - [ ] Ícones + timestamps

---

### Polimento Staff

- [ ] **4.16 Layout responsivo (tablet landscape)**
  - [ ] Header com menu lateral (sidebar ou hamburger)
  - [ ] Navegação entre Dashboard, Pedidos, Novo Pedido

- [ ] **4.17 Atalhos de teclado (opcional)**
  - [ ] Ctrl+N → Novo Pedido
  - [ ] Esc → Voltar

- [ ] **4.18 Testar fluxo completo Staff**
  - [ ] Login → Dashboard → Novo Pedido → Criar → Ver em lista → Atualizar status

---

## ✅ FASE 5: Frontend Admin (5-7 dias)

### Dashboard Admin

- [ ] **5.1 Criar estrutura de rotas Admin**
  - [ ] `routes/admin/LoginPage.tsx`
  - [ ] `routes/admin/DashboardPage.tsx`
  - [ ] `routes/admin/MenuManagementPage.tsx`
  - [ ] `routes/admin/MenuItemFormPage.tsx`
  - [ ] `routes/admin/CombosPage.tsx`
  - [ ] `routes/admin/ComboFormPage.tsx`
  - [ ] `routes/admin/UsersPage.tsx`
  - [ ] `routes/admin/ReportsPage.tsx`

- [ ] **5.2 Implementar LoginPage (Admin)**
  - [ ] Reutilizar LoginForm (com role check: admin)
  - [ ] Redirecionar para `/admin`

- [ ] **5.3 Implementar DashboardPage**
  - [ ] Cards com métricas (faturamento, pedidos, ticket médio)
  - [ ] Gráfico simples (opcional no MVP: usar recharts ou chart.js)
  - [ ] Lista de itens mais vendidos
  - [ ] Ações rápidas (botões para gerenciar cardápio, relatórios)

---

### Gerenciar Cardápio

- [ ] **5.4 Implementar MenuManagementPage**
  - [ ] Listar categorias (accordion ou tabs)
  - [ ] Listar itens por categoria
  - [ ] Botão [+ Novo Item]
  - [ ] Ações por item: [Editar] [Duplicar] [Desativar] [Marcar Indisponível]

- [ ] **5.5 Implementar MenuItemFormPage**
  - [ ] Formulário completo (nome, categoria, preço, descrição, imagem URL)
  - [ ] Validação (campos obrigatórios, preço > 0)
  - [ ] Checkboxes: `isActive`, `isAvailable`
  - [ ] Multiselect: adicionais permitidos
  - [ ] Submit → POST ou PUT `/api/menu` ou `/api/menu/:id`

- [ ] **5.6 Testar CRUD de cardápio**
  - [ ] Criar novo item → aparece na lista
  - [ ] Editar item → mudanças salvas
  - [ ] Desativar item → não aparece no Kiosk
  - [ ] Marcar indisponível → badge "Esgotado" no Kiosk

---

### Gerenciar Combos

- [ ] **5.7 Implementar CombosPage**
  - [ ] Listar combos (cards ou tabela)
  - [ ] Botão [+ Novo Combo]
  - [ ] Ações: [Editar] [Ver Regras] [Desativar]

- [ ] **5.8 Implementar ComboFormPage**
  - [ ] Formulário: nome, preço, descrição, imagem
  - [ ] Seção: "Itens Inclusos" (multiselect de MenuItems com quantidade)
  - [ ] (MVP simplificado: sem ComboRules, apenas preço fixo)
  - [ ] Submit → POST ou PUT `/api/combos` ou `/api/combos/:id`

- [ ] **5.9 Testar CRUD de combos**
  - [ ] Criar combo com 3 itens → aparece no Kiosk
  - [ ] Editar preço → reflete imediatamente

---

### Relatórios

- [ ] **5.10 Implementar ReportsPage**
  - [ ] Filtro de período (date range picker)
  - [ ] Métricas resumidas (vendas, pedidos, ticket médio)
  - [ ] Vendas por categoria (tabela ou gráfico)
  - [ ] Top 10 itens mais vendidos (tabela)
  - [ ] Botão [Exportar] (opcional: gerar JSON ou CSV para download)

- [ ] **5.11 Criar endpoint de relatórios (backend)**
  - [ ] GET `/api/reports/sales?start=YYYY-MM-DD&end=YYYY-MM-DD`
  - [ ] Calcular: total de vendas, pedidos, ticket médio
  - [ ] Agrupar por categoria
  - [ ] Retornar JSON estruturado

---

### Gerenciar Usuários (Básico)

- [ ] **5.12 Implementar UsersPage (opcional MVP)**
  - [ ] Listar usuários (staff + admin)
  - [ ] Botão [+ Novo Usuário]
  - [ ] Ações: [Editar] [Desativar]

- [ ] **5.13 Formulário de usuário (opcional MVP)**
  - [ ] Campos: username, fullName, email, role
  - [ ] Senha: hash automático no backend

---

### Polimento Admin

- [ ] **5.14 Layout desktop-first**
  - [ ] Sidebar fixa ou colapsável
  - [ ] Header com nome do admin + botão Sair

- [ ] **5.15 Validação e feedback**
  - [ ] Validação inline em formulários
  - [ ] Mensagens de sucesso/erro (toasts)

- [ ] **5.16 Testar fluxo completo Admin**
  - [ ] Login → Dashboard → Gerenciar Cardápio → Criar Item → Visualizar no Kiosk
  - [ ] Editar combo → Salvar → Visualizar no Kiosk
  - [ ] Gerar relatório de vendas

---

## ✅ FASE 6: Polimento e Deploy (3-5 dias)

### Polimento Geral

- [ ] **6.1 Ajustes de UX**
  - [ ] Garantir botões grandes no Kiosk (80x80px)
  - [ ] Contraste adequado (WCAG AA)
  - [ ] Feedback visual em todos os actions

- [ ] **6.2 Loading states**
  - [ ] Skeleton screens ou spinners em todas as fetches
  - [ ] Desabilitar botões durante submit (evitar duplo clique)

- [ ] **6.3 Error handling**
  - [ ] Tratamento de erro de rede (toast + retry)
  - [ ] Mensagens de erro amigáveis
  - [ ] Fallback UI para erros críticos

- [ ] **6.4 Responsividade**
  - [ ] Testar em diferentes resoluções (1920x1080, 1280x800, 1366x768)
  - [ ] Ajustar breakpoints do Tailwind se necessário

---

### Testes Manuais

- [ ] **6.5 Testar fluxo Kiosk (end-to-end)**
  - [ ] Cliente faz pedido completo sozinho
  - [ ] Testar com múltiplos itens, adicionais, combos
  - [ ] Verificar cálculo correto do total

- [ ] **6.6 Testar fluxo Staff**
  - [ ] Funcionário cria pedido no balcão
  - [ ] Atualiza status de pedidos
  - [ ] Monitora lista em tempo real (refresh manual no MVP)

- [ ] **6.7 Testar fluxo Admin**
  - [ ] Gerente edita cardápio → mudanças refletem no Kiosk
  - [ ] Marca item indisponível → some do Kiosk
  - [ ] Visualiza relatórios corretos

- [ ] **6.8 Testar concorrência**
  - [ ] Abrir Kiosk em 2 dispositivos simultaneamente
  - [ ] Fazer pedidos ao mesmo tempo
  - [ ] Ver pedidos aparecerem no Staff
  - [ ] Sem conflitos ou erros

---

### Deploy em Produção

- [ ] **6.9 Preparar PC Central (Windows)**
  - [ ] Instalar Node.js 20+ LTS
  - [ ] Instalar Git (se necessário)
  - [ ] Configurar IP estático
  - [ ] Desabilitar hibernação/sleep

- [ ] **6.10 Clonar projeto no PC Central**
  ```bash
  git clone <repo-url> C:\sistema-pedidos
  cd C:\sistema-pedidos
  npm install
  ```

- [ ] **6.11 Configurar .env (produção)**
  - [ ] Backend: `NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET`
  - [ ] Frontend: `VITE_API_URL=http://192.168.1.100:3000`

- [ ] **6.12 Build do projeto**
  ```bash
  npm run build
  ```

- [ ] **6.13 Executar migrations**
  ```bash
  cd apps/server
  npx prisma migrate deploy
  npx prisma db seed
  ```

- [ ] **6.14 Iniciar servidor como serviço (pm2)**
  ```bash
  npm install -g pm2
  pm2 start apps/server/dist/server.js --name sistema-pedidos
  pm2 startup
  pm2 save
  ```

- [ ] **6.15 Configurar firewall do Windows**
  - [ ] Abrir porta 3000 (TCP)
  - [ ] Testar acesso de outro dispositivo na rede

- [ ] **6.16 Configurar roteador**
  - [ ] Garantir que PC Central e dispositivos estão na mesma rede
  - [ ] Testar ping entre dispositivos

---

### Acesso pelos Dispositivos

- [ ] **6.17 Configurar totems/tablets**
  - [ ] Acessar `http://<IP_PC_CENTRAL>:3000/kiosk`
  - [ ] Adicionar bookmark ou atalho na tela inicial
  - [ ] Instalar PWA (se configurado)

- [ ] **6.18 Testar acesso**
  - [ ] Totem 1: http://192.168.1.100:3000/kiosk → OK
  - [ ] Tablet Staff: http://192.168.1.100:3000/staff → OK
  - [ ] PC Admin: http://192.168.1.100:3000/admin → OK

---

### Treinamento e Documentação

- [ ] **6.19 Criar manual do usuário**
  - [ ] Como usar o Kiosk (para clientes, se necessário)
  - [ ] Como usar o Staff (para funcionários)
  - [ ] Como usar o Admin (para gerência)

- [ ] **6.20 Treinamento da equipe**
  - [ ] Sessão hands-on com staff (30min)
  - [ ] Sessão hands-on com gerente (1h)
  - [ ] Responder dúvidas

- [ ] **6.21 Criar documentação técnica de manutenção**
  - [ ] Como fazer backup do banco de dados
  - [ ] Como reiniciar o servidor
  - [ ] Como atualizar o sistema (deploy)

---

### Monitoramento e Backup

- [ ] **6.22 Configurar backup automático**
  - [ ] Script para copiar `database.db` diariamente
  - [ ] Agendar via Task Scheduler (Windows)

- [ ] **6.23 Configurar logs**
  - [ ] Logs do Pino salvos em arquivo
  - [ ] Rotação de logs (evitar arquivos muito grandes)

- [ ] **6.24 Monitoramento básico**
  - [ ] pm2 monit ou pm2 logs
  - [ ] Alertas se servidor cair (pm2 restart automático já faz isso)

---

### Go-Live

- [ ] **6.25 Soft Launch**
  - [ ] Operar em horário de menor movimento (ex: tarde)
  - [ ] Equipe técnica de prontidão
  - [ ] Coletar feedback em tempo real

- [ ] **6.26 Ajustes pós-launch**
  - [ ] Corrigir pequenos bugs encontrados
  - [ ] Ajustar UX conforme feedback

- [ ] **6.27 Hard Launch**
  - [ ] Operar em horário de pico
  - [ ] Sem sistema antigo como fallback
  - [ ] Comunicar aos clientes sobre novo sistema

---

### Pós-MVP

- [ ] **6.28 Retrospectiva**
  - [ ] Reunião com equipe (devs + stakeholders)
  - [ ] O que funcionou bem?
  - [ ] O que pode melhorar?
  - [ ] Documentar lições aprendidas

- [ ] **6.29 Coletar métricas**
  - [ ] Tempo médio de criação de pedido
  - [ ] Erros reportados
  - [ ] Feedback de usuários (funcionários e clientes)

- [ ] **6.30 Priorizar backlog v2.0**
  - [ ] Revisar MVP_ROADMAP.md
  - [ ] Decidir próximas features (WebSocket? Pagamento? Impressão?)
  - [ ] Agendar próxima sprint

---

## 🎉 FIM DO MVP

**Parabéns!** O sistema está em produção e funcionando.

**Próximos passos:**
1. Operar por 2-4 semanas sem mudanças grandes (estabilizar)
2. Coletar dados e feedback
3. Iterar nas funcionalidades mais solicitadas
4. Planejar v2.0 com features avançadas

---

## 📞 Suporte

Em caso de dúvidas durante a implementação, consultar:
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DATA_MODEL.md](./DATA_MODEL.md)
- [PRICING_RULES.md](./PRICING_RULES.md)
- [MVP_ROADMAP.md](./MVP_ROADMAP.md)

**Contato do Arquiteto:** [email@exemplo.com]
