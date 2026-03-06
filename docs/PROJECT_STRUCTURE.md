# Estrutura de Pastas Detalhada - Sistema de Pedidos

## 📁 Árvore Completa do Projeto

```
sistema-pedidos/
│
├── .gitignore
├── .eslintrc.json
├── .prettierrc
├── package.json                    # Root: workspaces config
├── pnpm-workspace.yaml             # Se usar pnpm
├── README.md
├── LICENSE
│
├── docs/                           # 📚 Documentação técnica
│   ├── ARCHITECTURE.md
│   ├── DATA_MODEL.md
│   ├── PRICING_RULES.md
│   ├── SCREENS_WIREFLOW.md
│   ├── PAYMENT_STRATEGY.md
│   ├── MVP_ROADMAP.md
│   ├── EXECUTIVE_SUMMARY.md
│   └── PROJECT_STRUCTURE.md        # Este arquivo
│
├── apps/                           # 🚀 Aplicações principais
│   │
│   ├── frontend/                   # React + Vite + TypeScript
│   │   ├── public/
│   │   │   ├── favicon.ico
│   │   │   ├── manifest.json       # PWA manifest
│   │   │   ├── service-worker.js   # PWA service worker
│   │   │   └── logo.svg
│   │   │
│   │   ├── src/
│   │   │   ├── app/                # Bootstrap e configuração
│   │   │   │   ├── App.tsx         # Componente raiz
│   │   │   │   ├── router.tsx      # React Router config
│   │   │   │   └── providers.tsx   # Context providers (Query, Theme, etc.)
│   │   │   │
│   │   │   ├── routes/             # Páginas por role
│   │   │   │   │
│   │   │   │   ├── kiosk/          # Interface Cliente
│   │   │   │   │   ├── SplashScreen.tsx
│   │   │   │   │   ├── CategoriesPage.tsx
│   │   │   │   │   ├── MenuItemsPage.tsx
│   │   │   │   │   ├── CartPage.tsx
│   │   │   │   │   ├── CheckoutPage.tsx
│   │   │   │   │   └── ConfirmationPage.tsx
│   │   │   │   │
│   │   │   │   ├── staff/          # Interface Funcionário
│   │   │   │   │   ├── LoginPage.tsx
│   │   │   │   │   ├── DashboardPage.tsx
│   │   │   │   │   ├── NewOrderPage.tsx
│   │   │   │   │   ├── OrdersListPage.tsx
│   │   │   │   │   └── OrderDetailsPage.tsx
│   │   │   │   │
│   │   │   │   └── admin/          # Interface Gerente
│   │   │   │       ├── LoginPage.tsx
│   │   │   │       ├── DashboardPage.tsx
│   │   │   │       ├── MenuManagementPage.tsx
│   │   │   │       ├── MenuItemFormPage.tsx
│   │   │   │       ├── CombosPage.tsx
│   │   │   │       ├── ComboFormPage.tsx
│   │   │   │       ├── UsersPage.tsx
│   │   │   │       ├── ReportsPage.tsx
│   │   │   │       └── SettingsPage.tsx
│   │   │   │
│   │   │   ├── features/           # Módulos de domínio
│   │   │   │   │
│   │   │   │   ├── menu/
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── CategoryCard.tsx
│   │   │   │   │   │   ├── MenuItemCard.tsx
│   │   │   │   │   │   ├── MenuItemModal.tsx
│   │   │   │   │   │   └── AddonsSelector.tsx
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   ├── useMenu.ts
│   │   │   │   │   │   ├── useCategories.ts
│   │   │   │   │   │   └── useMenuMutations.ts
│   │   │   │   │   ├── services/
│   │   │   │   │   │   └── menu.service.ts
│   │   │   │   │   └── types/
│   │   │   │   │       └── menu.types.ts
│   │   │   │   │
│   │   │   │   ├── combos/
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── ComboCard.tsx
│   │   │   │   │   │   ├── ComboModal.tsx
│   │   │   │   │   │   └── ComboRuleSelector.tsx
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   └── useCombos.ts
│   │   │   │   │   ├── services/
│   │   │   │   │   │   └── combos.service.ts
│   │   │   │   │   └── types/
│   │   │   │   │       └── combos.types.ts
│   │   │   │   │
│   │   │   │   ├── orders/
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── OrderCard.tsx
│   │   │   │   │   │   ├── OrderDetails.tsx
│   │   │   │   │   │   ├── OrderStatusBadge.tsx
│   │   │   │   │   │   └── OrderTimeline.tsx
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   ├── useOrders.ts
│   │   │   │   │   │   └── useOrderMutations.ts
│   │   │   │   │   ├── services/
│   │   │   │   │   │   └── orders.service.ts
│   │   │   │   │   └── types/
│   │   │   │   │       └── orders.types.ts
│   │   │   │   │
│   │   │   │   ├── cart/
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── CartSummary.tsx
│   │   │   │   │   │   ├── CartItem.tsx
│   │   │   │   │   │   └── CartDrawer.tsx
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   └── useCart.ts
│   │   │   │   │   └── store/
│   │   │   │   │       └── cart.store.ts        # Zustand
│   │   │   │   │
│   │   │   │   └── auth/
│   │   │   │       ├── components/
│   │   │   │       │   ├── LoginForm.tsx
│   │   │   │       │   ├── ProtectedRoute.tsx
│   │   │   │       │   └── RoleGuard.tsx
│   │   │   │       ├── hooks/
│   │   │   │       │   └── useAuth.ts
│   │   │   │       ├── services/
│   │   │   │       │   └── auth.service.ts
│   │   │   │       ├── store/
│   │   │   │       │   └── auth.store.ts
│   │   │   │       └── types/
│   │   │   │           └── auth.types.ts
│   │   │   │
│   │   │   ├── components/         # Componentes compartilhados
│   │   │   │   ├── ui/             # shadcn/ui components
│   │   │   │   │   ├── button.tsx
│   │   │   │   │   ├── card.tsx
│   │   │   │   │   ├── dialog.tsx
│   │   │   │   │   ├── input.tsx
│   │   │   │   │   ├── select.tsx
│   │   │   │   │   ├── toast.tsx
│   │   │   │   │   └── ...
│   │   │   │   │
│   │   │   │   ├── layout/
│   │   │   │   │   ├── Header.tsx
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   ├── Footer.tsx
│   │   │   │   │   └── MainLayout.tsx
│   │   │   │   │
│   │   │   │   └── shared/         # Outros componentes
│   │   │   │       ├── Loading.tsx
│   │   │   │       ├── ErrorBoundary.tsx
│   │   │   │       ├── EmptyState.tsx
│   │   │   │       └── SearchBar.tsx
│   │   │   │
│   │   │   ├── services/           # Serviços globais
│   │   │   │   ├── api.service.ts  # Axios instance config
│   │   │   │   └── websocket.service.ts
│   │   │   │
│   │   │   ├── stores/             # Stores globais (Zustand)
│   │   │   │   ├── menu.store.ts
│   │   │   │   └── ui.store.ts
│   │   │   │
│   │   │   ├── types/              # Types globais
│   │   │   │   ├── index.ts
│   │   │   │   └── api.types.ts
│   │   │   │
│   │   │   ├── utils/              # Utilities
│   │   │   │   ├── format.ts       # formatCurrency, formatDate
│   │   │   │   ├── validation.ts
│   │   │   │   └── constants.ts
│   │   │   │
│   │   │   ├── styles/             # CSS global
│   │   │   │   ├── globals.css
│   │   │   │   └── tailwind.css
│   │   │   │
│   │   │   └── main.tsx            # Entry point
│   │   │
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   ├── postcss.config.js
│   │   ├── tsconfig.json
│   │   ├── tsconfig.node.json
│   │   └── package.json
│   │
│   └── server/                     # Node.js + Fastify + Prisma
│       │
│       ├── prisma/
│       │   ├── schema.prisma       # Schema Prisma
│       │   ├── migrations/         # Migrations versionadas
│       │   │   └── 20260306000000_init/
│       │   │       └── migration.sql
│       │   └── seed.ts             # Seed data
│       │
│       ├── src/
│       │   │
│       │   ├── modules/            # Módulos de negócio
│       │   │   │
│       │   │   ├── auth/
│       │   │   │   ├── auth.routes.ts
│       │   │   │   ├── auth.service.ts
│       │   │   │   ├── auth.middleware.ts
│       │   │   │   └── auth.types.ts
│       │   │   │
│       │   │   ├── menu/
│       │   │   │   ├── menu.routes.ts
│       │   │   │   ├── menu.service.ts
│       │   │   │   ├── menu.repository.ts
│       │   │   │   └── menu.types.ts
│       │   │   │
│       │   │   ├── combos/
│       │   │   │   ├── combos.routes.ts
│       │   │   │   ├── combos.service.ts
│       │   │   │   ├── combos.repository.ts
│       │   │   │   └── combos.types.ts
│       │   │   │
│       │   │   ├── orders/
│       │   │   │   ├── orders.routes.ts
│       │   │   │   ├── orders.service.ts
│       │   │   │   ├── orders.repository.ts
│       │   │   │   ├── orders.calculator.ts  # Cálculo de preços
│       │   │   │   └── orders.types.ts
│       │   │   │
│       │   │   └── users/
│       │   │       ├── users.routes.ts
│       │   │       ├── users.service.ts
│       │   │       ├── users.repository.ts
│       │   │       └── users.types.ts
│       │   │
│       │   ├── shared/             # Código compartilhado backend
│       │   │   │
│       │   │   ├── database/
│       │   │   │   ├── prisma.client.ts
│       │   │   │   └── connection.ts
│       │   │   │
│       │   │   ├── middleware/
│       │   │   │   ├── error.middleware.ts
│       │   │   │   ├── cors.middleware.ts
│       │   │   │   └── logger.middleware.ts
│       │   │   │
│       │   │   ├── utils/
│       │   │   │   ├── hash.ts         # bcrypt
│       │   │   │   ├── jwt.ts          # JWT helpers
│       │   │   │   └── validation.ts
│       │   │   │
│       │   │   └── types/
│       │   │       ├── fastify.d.ts    # Extend Fastify types
│       │   │       └── index.ts
│       │   │
│       │   ├── config/             # Configurações
│       │   │   ├── env.ts          # Validação de .env
│       │   │   ├── cors.ts
│       │   │   └── logger.ts       # Pino config
│       │   │
│       │   ├── types/              # DTOs e contratos
│       │   │   ├── dtos/
│       │   │   │   ├── create-order.dto.ts
│       │   │   │   ├── update-menu-item.dto.ts
│       │   │   │   └── ...
│       │   │   └── responses/
│       │   │       ├── order.response.ts
│       │   │       └── ...
│       │   │
│       │   ├── app.ts              # Fastify app setup
│       │   └── server.ts           # Entry point (listen)
│       │
│       ├── .env.example
│       ├── .env
│       ├── tsconfig.json
│       └── package.json
│
├── packages/                       # 📦 Pacotes compartilhados
│   │
│   └── shared/                     # Tipos e validações compartilhadas
│       ├── src/
│       │   ├── types/
│       │   │   ├── menu.types.ts
│       │   │   ├── order.types.ts
│       │   │   ├── combo.types.ts
│       │   │   ├── user.types.ts
│       │   │   └── index.ts
│       │   │
│       │   ├── validators/         # Zod schemas compartilhados
│       │   │   ├── menu.schema.ts
│       │   │   ├── order.schema.ts
│       │   │   └── index.ts
│       │   │
│       │   └── constants/
│       │       ├── order-status.ts
│       │       ├── roles.ts
│       │       └── index.ts
│       │
│       ├── tsconfig.json
│       └── package.json
│
└── scripts/                        # 🛠️ Scripts utilitários
    ├── setup.sh                    # Setup inicial (Linux/Mac)
    ├── setup.ps1                   # Setup inicial (Windows)
    ├── backup.sh                   # Backup do banco SQLite
    └── deploy.sh                   # Deploy em produção
```

---

## 📋 Detalhamento de Conceitos

### 1. Monorepo com Workspaces

**Root `package.json`:**
```json
{
  "name": "sistema-pedidos",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev -w frontend\" \"npm run dev -w server\"",
    "build": "npm run build -w frontend && npm run build -w server",
    "test": "npm run test --workspaces",
    "lint": "npm run lint --workspaces"
  },
  "devDependencies": {
    "concurrently": "^8.0.0",
    "typescript": "^5.3.0"
  }
}
```

---

### 2. Nomenclatura e Convenções

#### Frontend
- **Componentes**: PascalCase (`MenuItemCard.tsx`)
- **Hooks**: camelCase com `use` prefix (`useMenu.ts`)
- **Services**: camelCase com `.service` suffix (`menu.service.ts`)
- **Stores**: camelCase com `.store` suffix (`cart.store.ts`)
- **Types**: PascalCase com `.types` suffix (`menu.types.ts`)

#### Backend
- **Rotas**: kebab-case (`menu.routes.ts`)
- **Services**: kebab-case (`menu.service.ts`)
- **Repositories**: kebab-case (`menu.repository.ts`)
- **Types/DTOs**: PascalCase (`CreateOrderDto`)
- **Enums**: UPPER_SNAKE_CASE (`ORDER_STATUS`)

---

### 3. Imports e Paths

#### tsconfig.json (Frontend)
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/features/*": ["./src/features/*"],
      "@/services/*": ["./src/services/*"],
      "@/stores/*": ["./src/stores/*"],
      "@/utils/*": ["./src/utils/*"],
      "@/types/*": ["./src/types/*"]
    }
  }
}
```

**Uso:**
```typescript
import { Button } from '@/components/ui/button';
import { useCart } from '@/features/cart/hooks/useCart';
import { MenuService } from '@/services/menu.service';
```

#### tsconfig.json (Backend)
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/modules/*": ["./src/modules/*"],
      "@/shared/*": ["./src/shared/*"],
      "@/types/*": ["./src/types/*"]
    }
  }
}
```

**Uso:**
```typescript
import { prisma } from '@/shared/database/prisma.client';
import { MenuService } from '@/modules/menu/menu.service';
```

---

### 4. Organização por Feature (Feature-First)

Em vez de organizar por tipo (components/, services/, hooks/), organizamos por **domínio** (menu/, orders/, cart/). Cada feature é autocontida.

**Vantagens:**
- ✅ Fácil de encontrar código relacionado
- ✅ Facilita remoção de features (delete folder)
- ✅ Reduz acoplamento
- ✅ Permite trabalho paralelo de múltiplos devs

---

### 5. Camada de Serviço (Backend)

Cada módulo segue padrão em camadas:

```
Routes (HTTP handlers)
    ↓
Service (Business logic)
    ↓
Repository (Database access)
    ↓
Prisma Client
```

**Exemplo: orders.routes.ts**
```typescript
export async function ordersRoutes(fastify: FastifyInstance) {
  const orderService = new OrderService();

  fastify.post('/api/orders', async (request, reply) => {
    const order = await orderService.createOrder(request.body);
    return reply.code(201).send(order);
  });
}
```

**Exemplo: orders.service.ts**
```typescript
export class OrderService {
  private repository = new OrderRepository();
  private calculator = new OrderCalculator();

  async createOrder(data: CreateOrderDto) {
    const total = await this.calculator.calculateTotal(data.items);
    return this.repository.create({ ...data, totalAmount: total });
  }
}
```

**Exemplo: orders.repository.ts**
```typescript
export class OrderRepository {
  async create(data: any) {
    return prisma.order.create({ data });
  }

  async findById(id: number) {
    return prisma.order.findUnique({ where: { id } });
  }
}
```

---

### 6. State Management (Frontend)

**Zustand Store Exemplo (cart.store.ts):**
```typescript
import { create } from 'zustand';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  addons: Addon[];
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  calculateTotal: () => number;
  clear: () => void;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  addItem: (item) => set((state) => ({
    items: [...state.items, item]
  })),

  removeItem: (id) => set((state) => ({
    items: state.items.filter(item => item.id !== id)
  })),

  updateQuantity: (id, quantity) => set((state) => ({
    items: state.items.map(item =>
      item.id === id ? { ...item, quantity } : item
    )
  })),

  calculateTotal: () => {
    const { items } = get();
    return items.reduce((total, item) => {
      const itemTotal = (item.price +
        item.addons.reduce((sum, addon) => sum + addon.price, 0)
      ) * item.quantity;
      return total + itemTotal;
    }, 0);
  },

  clear: () => set({ items: [] })
}));
```

---

### 7. API Client (Frontend)

**services/api.service.ts:**
```typescript
import axios from 'axios';

// Configuração base do Axios
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar JWT
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratamento de erros
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirecionar para login
      localStorage.removeItem('token');
      window.location.href = '/staff/login';
    }
    return Promise.reject(error);
  }
);
```

---

### 8. Variáveis de Ambiente

**Frontend (.env):**
```bash
VITE_API_URL=http://192.168.1.100:3000
VITE_WS_URL=ws://192.168.1.100:3000
```

**Backend (.env):**
```bash
NODE_ENV=development
PORT=3000
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"
```

---

## 🎨 Padrões de Design

### 1. Componentes de UI (shadcn/ui)

Todos os componentes base vêm do shadcn/ui e ficam em `components/ui/`. São copiados diretamente para o projeto (não instalados como dependência).

### 2. Componentes Compostos

Componentes complexos são divididos em partes menores:

```
OrderCard/
  ├── OrderCard.tsx         # Container
  ├── OrderHeader.tsx       # Cabeçalho
  ├── OrderItems.tsx        # Lista de itens
  └── OrderActions.tsx      # Botões de ação
```

### 3. Custom Hooks

Lógica reutilizável extraída em hooks:

```typescript
// useMenu.ts
export function useMenu(categoryId?: number) {
  return useQuery({
    queryKey: ['menu', categoryId],
    queryFn: () => MenuService.getItems(categoryId)
  });
}

// Uso:
const { data: items, isLoading } = useMenu(categoryId);
```

---

## 🧪 Testes (Futuro)

```
apps/frontend/
  ├── src/
  └── tests/
      ├── unit/
      │   ├── components/
      │   └── utils/
      └── e2e/
          ├── kiosk.spec.ts
          ├── staff.spec.ts
          └── admin.spec.ts

apps/server/
  ├── src/
  └── tests/
      ├── unit/
      │   ├── services/
      │   └── repositories/
      └── integration/
          ├── auth.test.ts
          ├── menu.test.ts
          └── orders.test.ts
```

---

## 📝 Conclusão

Esta estrutura segue **best practices** modernas:
- ✅ **Separation of Concerns** (camadas bem definidas)
- ✅ **Feature-First** (organização por domínio)
- ✅ **Type Safety** (TypeScript end-to-end)
- ✅ **Scalability** (fácil adicionar novas features)
- ✅ **Maintainability** (código fácil de entender e modificar)

Pronto para ser implementado na **Fase 1** do roadmap.
