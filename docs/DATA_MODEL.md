# Modelo de Dados - Estado Atual do MVP

Este documento descreve o modelo de dados realmente implementado no backend atual em Prisma.

Referencia principal: apps/server/prisma/schema.prisma

---

## 1. Visao Geral

O banco atual usa:

- SQLite
- IDs string com cuid
- valores monetarios em Float
- modelagem simplificada para o MVP

O desenho conceitual original previa campos e entidades adicionais, mas o schema em producao nesta fase foi reduzido para acelerar a entrega do backend.

---

## 2. Relacionamentos Principais

```text
Category 1:N MenuItem
MenuItem M:N Addon (via MenuItemAddon)
Combo 1:N ComboItem
MenuItem 1:N ComboItem
Order 1:N OrderItem
OrderItem 1:N OrderItemAddon
Addon 1:N OrderItemAddon
Order 1:N OrderStatusHistory
User independente da Order nesta fase
```

---

## 3. Entidades Implementadas

### 3.1 Category

Categorias ativas exibidas no cardapio.

| Campo        | Tipo     | Observacao        |
| ------------ | -------- | ----------------- |
| id           | String   | PK, cuid          |
| name         | String   | unico             |
| description  | String?  | opcional          |
| icon         | String?  | opcional          |
| displayOrder | Int      | default 0         |
| isActive     | Boolean  | default true      |
| createdAt    | DateTime | default now       |
| updatedAt    | DateTime | update automatico |

Relacionamentos:

- 1 categoria possui varios menuItems

---

### 3.2 MenuItem

Itens vendaveis do cardapio.

| Campo        | Tipo     | Observacao                    |
| ------------ | -------- | ----------------------------- |
| id           | String   | PK, cuid                      |
| categoryId   | String   | FK para Category              |
| name         | String   | unico por categoria           |
| description  | String?  | opcional                      |
| price        | Float    | preco base atual              |
| icon         | String?  | opcional                      |
| imageUrl     | String?  | opcional                      |
| isAvailable  | Boolean  | controla exposicao para venda |
| displayOrder | Int      | default 0                     |
| createdAt    | DateTime | default now                   |
| updatedAt    | DateTime | update automatico             |

Relacionamentos:

- pertence a 1 Category
- possui addons permitidos via MenuItemAddon
- pode participar de combos via ComboItem
- pode aparecer em OrderItem

Observacoes:

- nao existe campo slug no schema atual
- nao existe campo isActive para MenuItem no schema atual

---

### 3.3 Addon

Adicionais aplicaveis a itens e combos.

| Campo       | Tipo     | Observacao         |
| ----------- | -------- | ------------------ |
| id          | String   | PK, cuid           |
| name        | String   | unico              |
| addonType   | String   | default EXTRA      |
| price       | Float    | valor do adicional |
| description | String?  | opcional           |
| isActive    | Boolean  | default true       |
| createdAt   | DateTime | default now        |
| updatedAt   | DateTime | update automatico  |

Relacionamentos:

- ligado a MenuItem via MenuItemAddon
- usado em OrderItemAddon

Observacao:

- addonType e armazenado como string, nao enum Prisma nesta fase

---

### 3.4 MenuItemAddon

Tabela de permissao de addon por item do menu.

| Campo        | Tipo    | Observacao       |
| ------------ | ------- | ---------------- |
| id           | String  | PK, cuid         |
| menuItemId   | String  | FK para MenuItem |
| addonId      | String  | FK para Addon    |
| isRequired   | Boolean | default false    |
| displayOrder | Int     | default 0        |

Restricoes:

- combinacao menuItemId + addonId unica

Observacao:

- nao existe maxQuantity no schema atual

---

### 3.5 Combo

Combo simplificado com preco fixo.

| Campo        | Tipo     | Observacao                 |
| ------------ | -------- | -------------------------- |
| id           | String   | PK, cuid                   |
| name         | String   | unico                      |
| description  | String?  | opcional                   |
| price        | Float    | preco fixo do combo        |
| icon         | String?  | opcional                   |
| isActive     | Boolean  | controla exposicao publica |
| displayOrder | Int      | default 0                  |
| createdAt    | DateTime | default now                |
| updatedAt    | DateTime | update automatico          |

Relacionamentos:

- possui varios ComboItem
- pode aparecer em OrderItem

Observacoes:

- nao existe campo isAvailable para Combo no schema atual
- nao existem ComboRule, validFrom ou validUntil nesta fase

---

### 3.6 ComboItem

Itens inclusos em um combo.

| Campo      | Tipo   | Observacao       |
| ---------- | ------ | ---------------- |
| id         | String | PK, cuid         |
| comboId    | String | FK para Combo    |
| menuItemId | String | FK para MenuItem |
| quantity   | Int    | default 1        |

Restricoes:

- combinacao comboId + menuItemId unica

Observacoes:

- nao existem isRequired e displayOrder no schema atual

---

### 3.7 Order

Pedido consolidado criado pela API.

| Campo         | Tipo      | Observacao             |
| ------------- | --------- | ---------------------- |
| id            | String    | PK, cuid               |
| orderNumber   | Int       | sequencial unico       |
| status        | String    | default PENDING        |
| paymentStatus | String    | default PENDING        |
| totalPrice    | Float     | total bruto            |
| discount      | Float     | default 0              |
| finalPrice    | Float     | total final            |
| customerName  | String?   | opcional               |
| customerPhone | String?   | opcional               |
| notes         | String?   | opcional               |
| createdAt     | DateTime  | default now            |
| updatedAt     | DateTime  | update automatico      |
| completedAt   | DateTime? | preenchido ao concluir |

Relacionamentos:

- possui varios OrderItem
- possui varios OrderStatusHistory

Observacoes:

- nesta fase nao ha relacionamento de Order com User
- orderNumber atual e inteiro sequencial, nao string no formato 2026-001

---

### 3.8 OrderItem

Linha de item do pedido.

| Campo      | Tipo    | Observacao                 |
| ---------- | ------- | -------------------------- |
| id         | String  | PK, cuid                   |
| orderId    | String  | FK para Order              |
| menuItemId | String? | FK opcional                |
| comboId    | String? | FK opcional                |
| quantity   | Int     | default 1                  |
| itemPrice  | Float   | snapshot do preco unitario |
| notes      | String? | opcional                   |

Regra:

- cada linha representa ou um MenuItem ou um Combo

---

### 3.9 OrderItemAddon

Snapshot dos adicionais aplicados em cada linha do pedido.

| Campo       | Tipo   | Observacao                     |
| ----------- | ------ | ------------------------------ |
| id          | String | PK, cuid                       |
| orderItemId | String | FK para OrderItem              |
| addonId     | String | FK para Addon                  |
| quantity    | Int    | default 1                      |
| addonPrice  | Float  | snapshot do preco do adicional |

---

### 3.10 OrderStatusHistory

Historico de transicoes do pedido.

| Campo      | Tipo     | Observacao      |
| ---------- | -------- | --------------- |
| id         | String   | PK, cuid        |
| orderId    | String   | FK para Order   |
| fromStatus | String   | status anterior |
| toStatus   | String   | status novo     |
| reason     | String?  | opcional        |
| changedAt  | DateTime | default now     |

---

### 3.11 User

Usuarios autenticados do backoffice.

| Campo     | Tipo      | Observacao                      |
| --------- | --------- | ------------------------------- |
| id        | String    | PK, cuid                        |
| email     | String    | unico                           |
| password  | String    | plain ou bcrypt no legado atual |
| role      | String    | ADMIN ou STAFF                  |
| name      | String?   | opcional                        |
| isActive  | Boolean   | default true                    |
| lastLogin | DateTime? | opcional                        |
| createdAt | DateTime  | default now                     |
| updatedAt | DateTime  | update automatico               |

Observacoes:

- nao existem tabelas Role e UserRole no schema atual
- autenticacao e por email e senha

---

## 4. Regras de Negocio Implementadas na Fase 2

- GET /api/menu lista apenas MenuItem com isAvailable true
- GET /api/combos lista apenas Combo com isActive true
- DELETE /api/menu faz desativacao logica marcando isAvailable false
- PATCH /api/menu/:id/availability atualiza isAvailable
- PATCH /api/combos/:id/availability atualiza isActive a partir do payload isAvailable
- POST /api/orders calcula valores automaticamente antes de persistir
- addons em MenuItem so podem ser usados no pedido se houver permissao em MenuItemAddon

---

## 5. Simplificacoes Conhecidas do MVP

Itens abaixo estavam no desenho conceitual, mas nao foram implementados ainda:

- slug em varias entidades
- Decimal para valores monetarios
- ComboRule e combos configuraveis avancados
- relacionamento direto de Order com User criador
- tabela Role/UserRole
- campos nutricionais e atributos avancados de MenuItem

Essas ausencias sao esperadas no estado atual da fase 2 e nao representam divergencia de runtime, apenas reducao de escopo do MVP.
