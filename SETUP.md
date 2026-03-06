# 🍔 Sistema de Pedidos Off-Grid - Fase 1: Setup ✅

## 📋 O que foi criado

### Estrutura do Monorepo
```
sistema-pedidos/
├── apps/
│   ├── server/          # Backend Fastify
│   └── frontend/        # Frontend React + Vite
├── packages/
│   └── shared/          # Types compartilhados
├── docs/                # Documentação
└── README.md
```

### ✅ Configurações Completas

#### Backend
- **Node.js 20+** com TypeScript
- **Fastify** para API ultra-rápida
- **SQLite** single-file database
- **Prisma** para tipo-safe ORM
- **JWT** para autenticação
- **CORS** para requisições cross-origin

#### Frontend
- **React 18** com TypeScript
- **Vite** build tool ultrarrápido
- **Tailwind CSS** com cores personalizadas
- **React Router** para navegação
- **Zustand** para state management
- **Axios** para requisições HTTP

#### Shared
- Types e interfaces compartilhadas
- TypeScript estritamente configurado

## 🚀 Como Usar - Próximos Passos

### 1. Instalar Dependências
```bash
pnpm install
```

### 2. Configurar Banco de Dados
```bash
# No diretório apps/server
pnpm prisma db push
# ou para migrations:
pnpm prisma migrate dev --name init
```

### 3. Iniciar Desenvolvimento (em dois terminais)

**Terminal 1 - Backend:**
```bash
cd apps/server
pnpm dev
# Servidor em http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd apps/frontend
pnpm dev
# Aplicação em http://localhost:5173
```

### 4. Verificar Saúde
- Backend: http://localhost:3001/health
- Frontend: http://localhost:5173

## 📁 Estrutura de Pastas

```
apps/
├── server/
│   ├── prisma/
│   │   ├── schema.prisma    # Model do banco
│   │   └── migrations/
│   ├── src/
│   │   └── server.ts        # Entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
│
└── frontend/
    ├── src/
    │   ├── App.tsx          # Componente raiz
    │   ├── main.tsx         # Entry point
    │   └── index.css        # Tailwind
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── .env

packages/
└── shared/
    ├── src/
    │   ├── types.ts         # Types compartilhadas
    │   └── index.ts
    └── tsconfig.json
```

## 🛠️ Comandos Importantes

### Development
```bash
# Ambos servidor e frontend
pnpm dev

# Apenas backend
cd apps/server && pnpm dev

# Apenas frontend
cd apps/frontend && pnpm dev
```

### Build
```bash
# Build de ambos
pnpm build

# Build individual
cd apps/server && pnpm build
cd apps/frontend && pnpm build
```

### Type Checking
```bash
# Check de tipos em tudo
pnpm type-check
```

### Database
```bash
# No apps/server:
pnpm prisma studio     # Interface visual
pnpm db:seed          # Carregar dados iniciais
```

## 📊 Prisma Schema - Entidades Principais

✅ **Categories** - Organiza cardápio
✅ **MenuItems** - Produtos individuais
✅ **Addons** - Extras, substituições, remoções
✅ **Combos** - Promoções com preço fixo
✅ **Orders** - Pedidos com histórico
✅ **Users** - Staff e Admin

## 🎯 Próximas Fases

- **Fase 2**: Backend API completa (auth, CRUD, validação)
- **Fase 3**: Kiosk Frontend (carrinho, checkout)
- **Fase 4**: Staff Frontend (novo pedido, lista)
- **Fase 5**: Admin Frontend (gerenciamento)
- **Fase 6**: Deploy e testes

## 💡 Dicas

- Sempre use `@shared/*` para importar types compartilhadas
- Frontend cores: orange (#f97316), red (#ef4444), green (#22c55e)
- JWT secret deve ser mudado em produção
- Database migrations automáticas com Prisma

## ✨ Status

🟢 **Fase 1: COMPLETA**
- Monorepo estruturado
- TypeScript configurado
- Fastify pronto
- React + Vite pronto
- Prisma + SQLite pronto
- Tailwind CSS pronto

---

**Timeline:** 5-7 dias para Phase 1 ✅
**Próximo:** Phase 2 - Backend API (7-10 dias)
