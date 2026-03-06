# Especificação Técnica - Sistema de Pedidos Off-Grid

## 1. Visão Geral da Arquitetura

### 1.1 Modelo de Operação
O sistema funciona em **modo totalmente offline**, sem dependência de internet. A comunicação ocorre via **rede local (LAN/Wi-Fi)** entre dispositivos e um servidor central.

```
┌─────────────────────────────────────────────────────────────┐
│                    REDE LOCAL (LAN/Wi-Fi)                   │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   TOTEM 1    │  │   TOTEM 2    │  │  TABLET      │       │
│  │   (Cliente)  │  │   (Cliente)  │  │  (Staff)     │       │
│  │   Browser    │  │   Browser    │  │   Browser    │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                  │                  │             │
│         │  HTTP/WS         │  HTTP/WS         │  HTTP/WS    │
│         └──────────────────┼──────────────────┘             │
│                            │                                │
│                    ┌───────▼────────┐                       │
│                    │   PC CENTRAL   │                       │
│                    │   (Windows)    │                       │
│                    │                │                       │
│                    │  ┌──────────┐  │                       │
│                    │  │ Backend  │  │                       │
│                    │  │ Node.js  │  │                       │
│                    │  │ Fastify  │  │                       │
│                    │  └────┬─────┘  │                       │
│                    │       │        │                       │
│                    │  ┌────▼─────┐  │                       │
│                    │  │ SQLite   │  │                       │
│                    │  │ Database │  │                       │
│                    │  └──────────┘  │                       │
│                    │                │                       │
│                    │  Interface     │                       │
│                    │  Admin também  │                       │
│                    │  via Browser   │                       │
│                    └────────────────┘                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Componentes Principais

#### Backend Local (Servidor Central)
- **Plataforma**: Node.js + TypeScript + Fastify
- **Banco de Dados**: SQLite (arquivo local, single-file database)
- **Comunicação**: REST API (HTTP) + WebSocket (tempo real)
- **Localização**: PC Windows da gerência
- **Porta**: HTTP :3000 (configurável)

#### Frontend (PWA Multi-Role)
- **Framework**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Distribuição**: Acesso via navegador (http://IP_SERVIDOR:3000)
- **PWA**: Service Worker para cache de assets, funcionar como app instalável
- **Rotas**: /kiosk, /staff, /admin

#### Banco de Dados
- **SQLite**: Escolhido por:
  - Zero configuração (arquivo único)
  - Alta performance para operações locais
  - Backups triviais (copiar arquivo .db)
  - Transações ACID
  - Sem necessidade de servidor separado
  - Suporta múltiplas conexões simultâneas (modo WAL)

### 1.3 Justificativa da Stack

| Tecnologia | Justificativa |
|------------|---------------|
| **TypeScript** | Tipagem forte reduz erros, melhora manutenibilidade, compartilhamento de tipos entre front/back |
| **React + Vite** | Ecossistema maduro, hot reload rápido, componentes reutilizáveis, grande comunidade |
| **Tailwind CSS** | Desenvolvimento rápido, consistência visual, fácil criar UI responsiva e touch-friendly |
| **shadcn/ui** | Componentes acessíveis, personalizáveis, não é biblioteca pesada, copia código para o projeto |
| **Fastify** | Performance superior ao Express, schema validation nativo, suporte TypeScript, plugins ricos |
| **Prisma** | ORM type-safe, migrations automáticas, query builder intuitivo, integração perfeita com TS |
| **SQLite** | Zero configuração, single-file, perfeito para offline, backups simples, performance local excelente |
| **WebSocket** | Atualizações push em tempo real (status de pedidos) sem polling, baixo overhead |

## 2. Arquitetura de Software

### 2.1 Estrutura de Pastas (Monorepo)

```
sistema-pedidos/
├── apps/
│   ├── frontend/
│   │   ├── public/
│   │   │   ├── manifest.json
│   │   │   └── service-worker.js
│   │   ├── src/
│   │   │   ├── app/                    # Bootstrap, providers, config
│   │   │   │   ├── App.tsx
│   │   │   │   ├── router.tsx
│   │   │   │   └── providers.tsx
│   │   │   ├── routes/                 # Páginas por role
│   │   │   │   ├── kiosk/             # Interface Cliente
│   │   │   │   ├── staff/             # Interface Funcionário
│   │   │   │   └── admin/             # Interface Gerente
│   │   │   ├── features/              # Módulos de domínio
│   │   │   │   ├── menu/
│   │   │   │   ├── combos/
│   │   │   │   ├── orders/
│   │   │   │   ├── cart/
│   │   │   │   └── auth/
│   │   │   ├── components/            # Componentes compartilhados
│   │   │   │   ├── ui/                # shadcn/ui components
│   │   │   │   ├── layout/
│   │   │   │   └── shared/
│   │   │   ├── services/              # API client, WebSocket
│   │   │   │   ├── api.service.ts
│   │   │   │   └── websocket.service.ts
│   │   │   ├── stores/                # State management (Zustand)
│   │   │   │   ├── cart.store.ts
│   │   │   │   ├── menu.store.ts
│   │   │   │   └── auth.store.ts
│   │   │   ├── types/                 # Types específicos do front
│   │   │   ├── utils/                 # Helpers, formatters
│   │   │   └── styles/                # CSS global
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── server/
│       ├── prisma/
│       │   ├── schema.prisma
│       │   ├── migrations/
│       │   └── seed.ts
│       ├── src/
│       │   ├── modules/               # Módulos de negócio
│       │   │   ├── auth/
│       │   │   │   ├── auth.routes.ts
│       │   │   │   ├── auth.service.ts
│       │   │   │   └── auth.types.ts
│       │   │   ├── menu/
│       │   │   │   ├── menu.routes.ts
│       │   │   │   ├── menu.service.ts
│       │   │   │   └── menu.repository.ts
│       │   │   ├── combos/
│       │   │   ├── orders/
│       │   │   └── users/
│       │   ├── shared/                # Código compartilhado backend
│       │   │   ├── database/
│       │   │   │   └── prisma.client.ts
│       │   │   ├── middleware/
│       │   │   │   ├── auth.middleware.ts
│       │   │   │   └── error.middleware.ts
│       │   │   └── utils/
│       │   ├── types/                 # DTOs, contratos
│       │   ├── server.ts              # Entry point
│       │   └── app.ts                 # Fastify app setup
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   └── shared/                        # Tipos compartilhados front+back
│       ├── src/
│       │   ├── types/
│       │   │   ├── menu.types.ts
│       │   │   ├── order.types.ts
│       │   │   ├── combo.types.ts
│       │   │   └── user.types.ts
│       │   └── validators/            # Zod schemas compartilhados
│       ├── tsconfig.json
│       └── package.json
│
├── docs/                              # Documentação
├── package.json                       # Root package.json (workspaces)
└── README.md
```

### 2.2 Camadas de Arquitetura

#### Frontend (Clean Architecture adaptada)
```
Presentation Layer (React Components)
    ↓
Business Logic Layer (Hooks, Stores)
    ↓
Data Access Layer (API Services)
    ↓
External APIs (HTTP/WebSocket)
```

#### Backend (Layered Architecture)
```
Routes Layer (Fastify handlers) → controllers HTTP
    ↓
Service Layer → regras de negócio, validações
    ↓
Repository Layer → acesso Prisma, queries
    ↓
Database (SQLite via Prisma)
```

## 3. Fluxo de Dados

### 3.1 Criação de Pedido (Kiosk)
```
1. Cliente acessa /kiosk no browser
2. PWA carrega do cache (assets) + busca cardápio via API
3. Cliente escolhe itens/combos → adiciona ao carrinho (state local)
4. Cliente confirma pedido → POST /api/orders
5. Backend valida, calcula preço, salva no SQLite
6. Backend retorna pedido com ID e número
7. Frontend exibe confirmação e número do pedido
8. WebSocket notifica todas as telas /staff (novo pedido)
```

### 3.2 Atualização em Tempo Real
```
1. Funcionário marca pedido como "Pronto" no /staff
2. Frontend chama PATCH /api/orders/:id/status
3. Backend atualiza SQLite
4. Backend emite evento WebSocket: "order:status_changed"
5. Todas as telas conectadas recebem atualização
6. UI atualiza automaticamente (sem refresh)
```

## 4. Segurança e Controle de Acesso

### 4.1 Autenticação
- **Kiosk**: Sem autenticação (acesso público)
- **Staff**: Login com usuário/senha → JWT token
- **Admin**: Login com usuário/senha → JWT token + role "admin"

### 4.2 Autorização
- Middleware verifica JWT e role antes de rotas protegidas
- Rotas públicas: GET /api/menu, GET /api/combos
- Rotas staff: POST /api/orders, PATCH /api/orders/:id/status
- Rotas admin: POST/PUT/DELETE /api/menu, /api/users, etc.

## 5. Resiliência e Operação Off-Grid

### 5.1 PWA e Cache
- Service Worker intercepta requests
- Assets (JS, CSS, imagens) servidos do cache
- Fallback para network se dados atualizados
- Strategy: Cache-First para assets, Network-First para API

### 5.2 Backup e Recuperação
- Backup automático do arquivo SQLite (cron job ou trigger diário)
- Copiar `database.db` para pasta de backup com timestamp
- Possibilidade de restaurar estado anterior
- Exportar relatórios em JSON/CSV para arquivamento

### 5.3 Sincronização (Futuro)
- Se implementar múltiplas filiais, preparar:
  - Export/import de cardápio (JSON)
  - Replicação eventual de pedidos (quando houver internet)

## 6. Requisitos Não-Funcionais

| Requisito | Especificação |
|-----------|---------------|
| **Performance** | Resposta < 200ms para operações CRUD, < 50ms para queries locais |
| **Disponibilidade** | 99.9% uptime (depende apenas do PC central ligado) |
| **Concorrência** | Suportar 10+ dispositivos simultâneos sem degradação |
| **Escalabilidade** | Até 5.000 itens no cardápio, 1.000 pedidos/dia |
| **Usabilidade** | Interface touch-first, botões mínimo 44x44px, fonte 18px+ |
| **Manutenibilidade** | Código TypeScript com 80%+ cobertura de tipos, documentação inline |

## 7. Deploy e Instalação

### 7.1 Setup Inicial (PC Central)
```bash
1. Instalar Node.js 20+ LTS
2. Clonar repositório
3. npm install (instala todas as dependências)
4. cd apps/server && npx prisma migrate deploy
5. npm run seed (popular dados iniciais)
6. npm run build (build frontend + backend)
7. npm run start:prod
```

### 7.2 Acesso pelos Dispositivos
```
1. Descobrir IP do PC central: ipconfig (ex: 192.168.1.100)
2. Nos dispositivos, acessar: http://192.168.1.100:3000
3. Escolher interface:
   - http://192.168.1.100:3000/kiosk (totems)
   - http://192.168.1.100:3000/staff (tablets funcionários)
   - http://192.168.1.100:3000/admin (gerência)
4. Instalar PWA (botão "Adicionar à tela inicial") para app nativo
```

### 7.3 Configuração de Rede
- Garantir que firewall do Windows permite conexões na porta 3000
- Recomendado: IP estático para o PC central
- Opcional: Configurar DNS local (ex: pedidos.local)

## 8. Tecnologias Complementares

| Finalidade | Tecnologia |
|------------|------------|
| **Validação** | Zod (schemas runtime + compile-time via TS) |
| **State Management** | Zustand (leve, sem boilerplate) |
| **HTTP Client** | Axios (interceptors, timeout, retry) |
| **WebSocket** | Socket.io (fallbacks, reconexão automática) |
| **Logging** | Pino (high-performance, estruturado) |
| **Testing** | Vitest (frontend), Vitest + Supertest (backend) |
| **Linting** | ESLint + Prettier (consistência de código) |
| **Migrations** | Prisma Migrate (versionamento de schema) |

## 9. Próximos Passos (Pós-Documento)

1. **Validar** este documento com stakeholders
2. **Definir** modelo de dados detalhado (próximo doc)
3. **Criar** wireframes de alta fidelidade (Figma/similar)
4. **Implementar** MVP conforme roadmap definido
5. **Testar** em ambiente real com dispositivos reais
6. **Iterar** com feedback do cliente/gerente
