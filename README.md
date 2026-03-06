# Sistema de Pedidos Off-Grid para Restaurante

Sistema completo de pedidos para restaurante, funcionando **totalmente offline** (sem necessidade de internet), acessado via navegador em rede local (LAN/Wi-Fi).

---

## 📋 Visão Geral

Sistema com 3 interfaces principais:

1. **Kiosk (Totem)**: Cliente monta seu pedido sozinho em tela touch
2. **Staff (Funcionário)**: Atendente registra pedidos no balcão
3. **Admin (Gerente)**: Gerencia cardápio, preços, usuários e visualiza relatórios

### Características Principais

- ✅ **100% Off-Grid**: Funciona sem internet, apenas rede local
- ✅ **Multi-Dispositivo**: Totems, tablets e PCs acessando simultaneamente
- ✅ **Servidor Local**: PC Windows central rodando backend + banco de dados
- ✅ **Interface Touch-First**: UX otimizada para telas grandes e touch
- ✅ **Cardápio Completo**: Categorias, itens avulsos, combos e adicionais
- ✅ **Gestão Centralizada**: Admin completo para gerência

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    REDE LOCAL (LAN/Wi-Fi)                   │
│                                                             │
│  ┌──────────┐  ┌──────────┐   ┌──────────┐  ┌──────────┐    │
│  │  TOTEM 1 │  │  TOTEM 2 │   │  TABLET  │  │    PC    │    │
│  │ (Kiosk)  │  │ (Kiosk)  │   │  (Staff) │  │  (Admin) │    │
│  └────┬─────┘  └────┬─────┘   └────┬─────┘  └────┬─────┘    │
│       │             │              │             │          │
│       └─────────────┴──────────────┴─────────────┘          │
│                            │                                │
│                   HTTP/WebSocket                            │
│                            │                                │
│                   ┌────────▼────────┐                       │
│                   │  PC CENTRAL     │                       │
│                   │  (Servidor)     │                       │
│                   │                 │                       │
│                   │  • Node.js API  │                       │
│                   │  • SQLite DB    │                       │
│                   └─────────────────┘                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Stack Tecnológica

### Backend
- **Runtime**: Node.js 20+ LTS
- **Framework**: Fastify (TypeScript)
- **Database**: SQLite (arquivo local)
- **ORM**: Prisma
- **Auth**: JWT
- **Validation**: Zod
- **Logging**: Pino

### Frontend
- **Framework**: React 18+ (TypeScript)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Router**: React Router v6

### Compartilhado
- **Monorepo**: Workspaces (npm/pnpm)
- **Linting**: ESLint + Prettier
- **Package Manager**: npm ou pnpm

---

## 📚 Documentação

A documentação completa está organizada na pasta [`/docs`](./docs/):

| Documento | Descrição |
|-----------|-----------|
| [**ARCHITECTURE.md**](./docs/ARCHITECTURE.md) | Especificação técnica da arquitetura, justificativa de tecnologias, estrutura de pastas |
| [**DATA_MODEL.md**](./docs/DATA_MODEL.md) | Modelo de dados completo (entidades, relacionamentos, campos) |
| [**PRICING_RULES.md**](./docs/PRICING_RULES.md) | Regras de precificação de itens, combos, adicionais e cálculo de totais |
| [**SCREENS_WIREFLOW.md**](./docs/SCREENS_WIREFLOW.md) | Wireframes e fluxo de telas para Kiosk, Staff e Admin |
| [**PAYMENT_STRATEGY.md**](./docs/PAYMENT_STRATEGY.md) | Estratégia para integração futura de pagamentos (PIX, cartão) |
| [**MVP_ROADMAP.md**](./docs/MVP_ROADMAP.md) | Roadmap de desenvolvimento, priorização de features e estimativas |

**📖 Recomendação**: Ler os documentos na ordem acima para entendimento completo.

---

## 🚀 Quick Start (Futuro)

> ⚠️ **Este projeto ainda não foi implementado.** A documentação acima define a arquitetura e planejamento.

### Pré-requisitos
- Node.js 20+ LTS
- npm ou pnpm
- Windows 10/11 (para servidor central)

### Instalação (quando implementado)

```bash
# 1. Clonar repositório
git clone <repo-url>
cd sistema-pedidos

# 2. Instalar dependências
npm install

# 3. Configurar banco de dados
cd apps/server
npx prisma migrate dev
npx prisma db seed

# 4. Iniciar desenvolvimento
npm run dev
```

### Acesso
- **Kiosk**: `http://localhost:3000/kiosk`
- **Staff**: `http://localhost:3000/staff`
- **Admin**: `http://localhost:3000/admin`

---

## 📁 Estrutura do Projeto (Sugerida)

```
sistema-pedidos/
├── apps/
│   ├── frontend/          # Aplicação React (Kiosk, Staff, Admin)
│   └── server/            # API Node.js + Prisma
├── packages/
│   └── shared/            # Tipos e validações compartilhadas
├── docs/                  # Documentação técnica
├── package.json           # Root package.json (workspaces)
└── README.md             # Este arquivo
```

Veja detalhes completos em [ARCHITECTURE.md](./docs/ARCHITECTURE.md).

---

## 🎯 MVP: O Que Vai Entrar?

### ✅ Incluído no MVP
- Kiosk funcional (cliente faz pedido sozinho)
- Staff (funcionário cria e gerencia pedidos)
- Admin (gerente administra cardápio)
- Cardápio completo (categorias, itens, adicionais)
- Combos simples (preço fixo)
- Cálculo automático de preços
- Autenticação JWT
- SQLite local

### ❌ Para Versões Futuras
- Combos avançados (regras dinâmicas)
- Pagamento integrado (PIX, cartão)
- WebSocket (tempo real)
- Relatórios avançados (gráficos, exportação)
- Impressão de comandas
- Multi-loja
- Delivery

Veja roadmap completo em [MVP_ROADMAP.md](./docs/MVP_ROADMAP.md).

---

## 💡 Conceitos-Chave

### Operação Off-Grid
- Sistema **não depende de internet**
- Comunicação via **rede local (LAN/Wi-Fi)**
- Servidor central no **PC da gerência**
- Dispositivos acessam via navegador (`http://IP:3000`)

### Multi-Role
- **Kiosk**: Público, sem autenticação
- **Staff**: Login com role "staff"
- **Admin**: Login com role "admin"
- Controle de acesso via middleware JWT

### Precificação
- Preços são **snapshot** no momento do pedido
- Combos têm preço fixo + extras
- Adicionais somam ao preço base
- Cálculo automático e validado no backend

Veja regras detalhadas em [PRICING_RULES.md](./docs/PRICING_RULES.md).

---

## 🧪 Testes (Futuro)

```bash
# Testes unitários
npm run test

# Testes E2E
npm run test:e2e

# Cobertura
npm run test:coverage
```

---

## 📦 Deploy (Produção - Futuro)

### Setup PC Central (Windows)

1. **Instalar Node.js 20+ LTS**
2. **Clonar e instalar projeto**
3. **Configurar IP estático** no Windows
4. **Abrir porta 3000 no Firewall**
5. **Build do projeto**:
   ```bash
   npm run build
   ```
6. **Iniciar como serviço** (pm2 ou Windows Service):
   ```bash
   npm install -g pm2
   pm2 start apps/server/dist/server.js --name sistema-pedidos
   pm2 startup
   pm2 save
   ```

### Acesso pelos Dispositivos

Descobrir IP do PC central:
```bash
ipconfig
# Ex: 192.168.1.100
```

Acessar nos dispositivos:
```
http://192.168.1.100:3000/kiosk (totems)
http://192.168.1.100:3000/staff (tablets)
http://192.168.1.100:3000/admin (gerência)
```

---

## 🤝 Contribuindo (Futuro)

Este projeto segue:
- **Conventional Commits** (feat, fix, docs, etc.)
- **ESLint + Prettier** (formatação automática)
- **TypeScript strict mode**
- **Pull requests** com code review

---

## 📄 Licença

[MIT License](./LICENSE) (ou conforme definido)

---

## 📌 Status do Projeto

🟡 **Em Planejamento** - Documentação completa, aguardando implementação.

### Roadmap de Alto Nível

- [x] Especificação técnica
- [x] Modelo de dados
- [x] Wireframes
- [x] Estratégia de pagamento
- [x] **Fase 1**: Setup (Semana 1)
- [ ] **Fase 2**: Backend API (Semana 2)
- [ ] **Fase 3**: Frontend Kiosk (Semana 3)
- [ ] **Fase 4**: Frontend Staff (Semana 4)
- [ ] **Fase 5**: Frontend Admin (Semana 5)
- [ ] **Fase 6**: Deploy e Treinamento (Semana 6)
- [ ] 🎉 **MVP em Produção**

---

## 🙏 Agradecimentos

Projeto desenvolvido com foco em:
- Simplicidade operacional
- Robustez offline
- Experiência do usuário
- Manutenibilidade de código

---

**Última atualização**: Março 2026
