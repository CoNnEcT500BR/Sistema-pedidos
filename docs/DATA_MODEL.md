# Modelo de Dados - Estado Atual (Prisma)

Atualizado em 16/03/2026 com base em apps/server/prisma/schema.prisma.

## 1. Visao Geral

- Banco: SQLite
- ORM: Prisma
- IDs: String com cuid
- Valores monetarios: Float (MVP)
- Tipos de status e addon persistidos como String

## 2. Entidades

### Category
Campos principais: id, name (unico), description, icon, displayOrder, isActive, createdAt, updatedAt.
Relacao: 1:N com MenuItem.

### MenuItem
Campos principais: id, categoryId, name, description, price, icon, imageUrl, isAvailable, removablesJson, displayOrder, createdAt, updatedAt.
Restricao: unique(categoryId, name).
Relacoes: N:1 Category, M:N Addon (via MenuItemAddon), 1:N OrderItem, 1:N ComboItem.

### Addon
Campos principais: id, name (unico), addonType, price, description, isActive, createdAt, updatedAt.
Relacoes: M:N MenuItem (via MenuItemAddon), 1:N OrderItemAddon.

Observacao importante:
- addonType suportado no dominio: EXTRA, SUBSTITUTION, REMOVAL, SIZE_CHANGE.
- Campo continua String no banco, sem enum SQL.

### MenuItemAddon
Tabela de permissao de addon por item.
Campos: id, menuItemId, addonId, isRequired, displayOrder.
Restricao: unique(menuItemId, addonId).

### Combo
Campos principais: id, name (unico), description, price, icon, isActive, displayOrder, createdAt, updatedAt.
Relacoes: 1:N ComboItem, 1:N OrderItem.

### ComboItem
Campos: id, comboId, menuItemId, quantity.
Restricao: unique(comboId, menuItemId).

### Order
Campos principais: id, orderNumber (unico), status, paymentStatus, totalPrice, discount, finalPrice, customerName, customerPhone, notes, createdAt, updatedAt, completedAt.
Relacoes: 1:N OrderItem, 1:N OrderStatusHistory.

### OrderItem
Campos: id, orderId, menuItemId?, comboId?, quantity, itemPrice, notes.
Relacao: 1:N OrderItemAddon.

### OrderItemAddon
Snapshot de addons aplicados no pedido.
Campos: id, orderItemId, addonId, quantity, addonPrice.

### OrderStatusHistory
Historico de transicoes.
Campos: id, orderId, fromStatus, toStatus, reason, changedAt.

### User
Campos principais: id, email (unico), password, role, name, isActive, lastLogin, createdAt, updatedAt.
Uso atual: autenticacao e administracao de usuarios internos.

## 3. Relacionamentos (resumo)

- Category 1:N MenuItem
- MenuItem M:N Addon (MenuItemAddon)
- Combo 1:N ComboItem
- MenuItem 1:N ComboItem
- Order 1:N OrderItem
- OrderItem 1:N OrderItemAddon
- Addon 1:N OrderItemAddon
- Order 1:N OrderStatusHistory

## 4. Regras de Dominio Conectadas ao Modelo

- Addons selecionados em OrderItemAddon sao snapshots (addonPrice no momento da compra).
- MenuItemAddon define quais addons podem ser aplicados por item.
- Compatibilidade por escopo (incluindo bloqueio de BURGER_BUILD) e feita na camada de servico.
- Backfill 20260316123000 converte upgrades de bebida/batata para SIZE_CHANGE e garante vinculos em MenuItemAddon.

## 5. Pendencias Tecnicas Conhecidas

- Valores monetarios ainda em Float (possivel migrar para Decimal em evolucao futura).
- Campos de status/addonType ainda sao string no banco (sem enum nativo).
