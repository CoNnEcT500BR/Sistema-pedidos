# Modelo de Dados - Sistema de Pedidos

## 1. Diagrama Entidade-Relacionamento (Textual)

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Category   │◄────────┤   MenuItem   │────────►│   Addon     │
└─────────────┘    1:N  └──────┬───────┘    M:N  └─────────────┘
                                │                  (MenuItemAddon)
                                │
                          ┌─────▼──────┐
                          │   Combo    │
                          └─────┬──────┘
                                │
                         ┌──────┴───────┐
                    1:N  │              │  1:N
                 ┌───────▼─────┐   ┌────▼────────┐
                 │ ComboItem   │   │ ComboRule   │
                 │ (itens      │   │ (regras)    │
                 │  inclusos)  │   └─────────────┘
                 └─────────────┘

┌──────────┐         ┌─────────────┐         ┌──────────────┐
│   User   │────────►│    Order    │────────►│  OrderItem   │
└──────────┘    1:N  └──────┬──────┘    1:N  └──────┬───────┘
      │                     │                        │
      │                     │                        │
      │              ┌──────▼─────────┐       ┌──────▼────────────┐
      │              │ OrderStatus    │       │ OrderItemAddon    │
      │              │ (histórico)    │       │ (adicionais)      │
      │              └────────────────┘       └───────────────────┘
      │
      │              ┌─────────────┐
      └─────────────►│    Role     │
                 M:N └─────────────┘
               (UserRole)
```

## 2. Entidades Principais

### 2.1 Category (Categorias do Cardápio)

**Propósito**: Organizar itens do menu em categorias navegáveis.

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| id | Int | PK, AUTO_INCREMENT | Identificador único |
| name | String | NOT NULL, UNIQUE | Nome da categoria (ex: "Hambúrgueres") |
| slug | String | NOT NULL, UNIQUE | URL-friendly (ex: "hamburgueres") |
| description | String? | NULLABLE | Descrição da categoria |
| displayOrder | Int | NOT NULL, DEFAULT 0 | Ordem de exibição na UI |
| imageUrl | String? | NULLABLE | URL da imagem representativa |
| isActive | Boolean | NOT NULL, DEFAULT true | Categoria visível ou não |
| createdAt | DateTime | NOT NULL, DEFAULT NOW | Data de criação |
| updatedAt | DateTime | NOT NULL, AUTO UPDATE | Data de última atualização |

**Índices**:
- UNIQUE (slug)
- INDEX (isActive, displayOrder)

---

### 2.2 MenuItem (Itens do Cardápio)

**Propósito**: Itens individuais vendidos (hambúrguer, refrigerante, batata, etc).

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| id | Int | PK, AUTO_INCREMENT | Identificador único |
| categoryId | Int | FK → Category.id, NOT NULL | Categoria do item |
| name | String | NOT NULL | Nome do item |
| slug | String | NOT NULL, UNIQUE | URL-friendly |
| description | String? | NULLABLE | Descrição detalhada |
| price | Decimal(10,2) | NOT NULL | Preço unitário (em centavos ou decimal) |
| imageUrl | String? | NULLABLE | URL da imagem do produto |
| isAvailable | Boolean | NOT NULL, DEFAULT true | Disponível para venda |
| isActive | Boolean | NOT NULL, DEFAULT true | Ativo no sistema |
| displayOrder | Int | NOT NULL, DEFAULT 0 | Ordem dentro da categoria |
| preparationTime | Int? | NULLABLE | Tempo de preparo em minutos |
| calories | Int? | NULLABLE | Informação nutricional (opcional) |
| allergens | String? | NULLABLE | Alergênicos (JSON array ou string) |
| createdAt | DateTime | NOT NULL, DEFAULT NOW | Data de criação |
| updatedAt | DateTime | NOT NULL, AUTO UPDATE | Data de última atualização |

**Índices**:
- FK (categoryId)
- UNIQUE (slug)
- INDEX (isAvailable, isActive)

**Relacionamentos**:
- Category: N:1 (muitos itens pertencem a uma categoria)
- Addons: M:N via MenuItemAddon

---

### 2.3 Addon (Adicionais/Modificadores)

**Propósito**: Adicionais que podem ser incluídos nos itens (ex: bacon extra, queijo, molho especial).

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| id | Int | PK, AUTO_INCREMENT | Identificador único |
| name | String | NOT NULL | Nome do adicional (ex: "Bacon Extra") |
| price | Decimal(10,2) | NOT NULL | Preço adicional |
| isActive | Boolean | NOT NULL, DEFAULT true | Ativo no sistema |
| addonType | Enum | NOT NULL | Tipo: 'EXTRA', 'SUBSTITUTION', 'REMOVAL' |
| createdAt | DateTime | NOT NULL, DEFAULT NOW | Data de criação |
| updatedAt | DateTime | NOT NULL, AUTO UPDATE | Data de última atualização |

**Enum AddonType**:
- `EXTRA`: Adicional pago (bacon extra, queijo adicional)
- `SUBSTITUTION`: Substituição (trocar pão, trocar molho)
- `REMOVAL`: Remoção gratuita (sem cebola, sem picles)

**Índices**:
- INDEX (isActive, addonType)

---

### 2.4 MenuItemAddon (Relacionamento M:N)

**Propósito**: Liga MenuItem aos Addons permitidos para aquele item.

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| id | Int | PK, AUTO_INCREMENT | Identificador único |
| menuItemId | Int | FK → MenuItem.id, NOT NULL | Item do menu |
| addonId | Int | FK → Addon.id, NOT NULL | Adicional permitido |
| isDefault | Boolean | NOT NULL, DEFAULT false | Se vem por padrão |
| maxQuantity | Int? | NULLABLE | Quantidade máxima permitida |

**Índices**:
- UNIQUE (menuItemId, addonId)
- FK (menuItemId)
- FK (addonId)

---

### 2.5 Combo (Combos/Promoções)

**Propósito**: Conjuntos de itens vendidos por preço promocional.

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| id | Int | PK, AUTO_INCREMENT | Identificador único |
| name | String | NOT NULL | Nome do combo (ex: "Combo Clássico") |
| slug | String | NOT NULL, UNIQUE | URL-friendly |
| description | String? | NULLABLE | Descrição do combo |
| price | Decimal(10,2) | NOT NULL | Preço total do combo |
| imageUrl | String? | NULLABLE | Imagem representativa |
| isAvailable | Boolean | NOT NULL, DEFAULT true | Disponível para venda |
| isActive | Boolean | NOT NULL, DEFAULT true | Ativo no sistema |
| displayOrder | Int | NOT NULL, DEFAULT 0 | Ordem de exibição |
| validFrom | DateTime? | NULLABLE | Data início de validade |
| validUntil | DateTime? | NULLABLE | Data fim de validade |
| createdAt | DateTime | NOT NULL, DEFAULT NOW | Data de criação |
| updatedAt | DateTime | NOT NULL, AUTO UPDATE | Data de última atualização |

**Índices**:
- UNIQUE (slug)
- INDEX (isAvailable, isActive)

**Regras de Precificação**:
- Preço do combo é fixo, independente dos itens inclusos
- Se cliente adicionar extras, soma-se ao preço do combo
- Exemplo: Combo R$25 (hambúrguer + batata + refri) + bacon extra R$3 = R$28

---

### 2.6 ComboItem (Itens Inclusos no Combo)

**Propósito**: Define quais itens fazem parte de cada combo.

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| id | Int | PK, AUTO_INCREMENT | Identificador único |
| comboId | Int | FK → Combo.id, NOT NULL | Combo relacionado |
| menuItemId | Int | FK → MenuItem.id, NOT NULL | Item incluído no combo |
| quantity | Int | NOT NULL, DEFAULT 1 | Quantidade deste item |
| isRequired | Boolean | NOT NULL, DEFAULT true | Item obrigatório ou opcional |
| displayOrder | Int | NOT NULL, DEFAULT 0 | Ordem de apresentação |

**Índices**:
- FK (comboId)
- FK (menuItemId)
- INDEX (comboId, displayOrder)

**Exemplo de Dados**:
```
Combo "Clássico" (id=1):
  - ComboItem 1: Hambúrguer Básico (quantity=1, required=true)
  - ComboItem 2: Batata Média (quantity=1, required=true)
  - ComboItem 3: Refrigerante 500ml (quantity=1, required=true)
```

---

### 2.7 ComboRule (Regras de Personalização do Combo)

**Propósito**: Define regras de substituição/variação dentro do combo.

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| id | Int | PK, AUTO_INCREMENT | Identificador único |
| comboId | Int | FK → Combo.id, NOT NULL | Combo relacionado |
| ruleName | String | NOT NULL | Nome da regra (ex: "Escolha o Hambúrguer") |
| ruleType | Enum | NOT NULL | Tipo: 'SELECT_ONE', 'SELECT_MANY', 'UPGRADE' |
| minSelections | Int | NOT NULL, DEFAULT 1 | Mínimo de seleções |
| maxSelections | Int | NOT NULL, DEFAULT 1 | Máximo de seleções |
| allowedCategoryId | Int? | FK → Category.id, NULLABLE | Categoria de itens permitidos |
| extraCharge | Decimal(10,2) | NOT NULL, DEFAULT 0 | Taxa extra por essa escolha |
| displayOrder | Int | NOT NULL, DEFAULT 0 | Ordem de apresentação |

**Enum RuleType**:
- `SELECT_ONE`: Cliente escolhe 1 item de uma lista (ex: escolha 1 bebida)
- `SELECT_MANY`: Cliente escolhe N itens (ex: escolha 2 acompanhamentos)
- `UPGRADE`: Cliente pode fazer upgrade pagando diferença (ex: trocar por hambúrguer premium +R$5)

**Índices**:
- FK (comboId)
- FK (allowedCategoryId)

**Exemplo**:
```
Combo "Monte seu Combo":
  - Rule 1: "Escolha o Hambúrguer" (SELECT_ONE, min=1, max=1, category=Hambúrgueres, extraCharge=0)
  - Rule 2: "Escolha a Bebida" (SELECT_ONE, min=1, max=1, category=Bebidas, extraCharge=0)
  - Rule 3: "Upgrade para Bacon" (UPGRADE, optional, extraCharge=3.00)
```

---

### 2.8 User (Usuários do Sistema)

**Propósito**: Funcionários e gerentes que acessam o sistema.

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| id | Int | PK, AUTO_INCREMENT | Identificador único |
| username | String | NOT NULL, UNIQUE | Nome de usuário (login) |
| email | String? | UNIQUE, NULLABLE | Email (opcional) |
| passwordHash | String | NOT NULL | Hash bcrypt da senha |
| fullName | String | NOT NULL | Nome completo |
| isActive | Boolean | NOT NULL, DEFAULT true | Usuário ativo |
| lastLoginAt | DateTime? | NULLABLE | Último login |
| createdAt | DateTime | NOT NULL, DEFAULT NOW | Data de criação |
| updatedAt | DateTime | NOT NULL, AUTO UPDATE | Data de última atualização |

**Índices**:
- UNIQUE (username)
- UNIQUE (email)

**Segurança**:
- Senha NUNCA armazenada em plain text
- Hash: bcrypt com salt (cost factor 12)
- Length mínimo senha: 8 caracteres

---

### 2.9 Role (Papéis/Perfis)

**Propósito**: Perfis de acesso ao sistema.

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| id | Int | PK, AUTO_INCREMENT | Identificador único |
| name | String | NOT NULL, UNIQUE | Nome do papel (ex: "admin", "staff") |
| displayName | String | NOT NULL | Nome amigável (ex: "Gerente", "Atendente") |
| permissions | JSON | NOT NULL | Permissões (array de strings) |
| createdAt | DateTime | NOT NULL, DEFAULT NOW | Data de criação |

**Roles Padrão**:
```json
[
  {
    "name": "admin",
    "displayName": "Gerente",
    "permissions": ["*"] // todas as permissões
  },
  {
    "name": "staff",
    "displayName": "Atendente",
    "permissions": [
      "orders:create",
      "orders:read",
      "orders:update_status",
      "menu:read"
    ]
  },
  {
    "name": "kitchen",
    "displayName": "Cozinha",
    "permissions": [
      "orders:read",
      "orders:update_status"
    ]
  }
]
```

---

### 2.10 UserRole (Relacionamento M:N)

**Propósito**: Usuários podem ter múltiplos papéis.

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| userId | Int | FK → User.id, NOT NULL | Usuário |
| roleId | Int | FK → Role.id, NOT NULL | Papel |
| assignedAt | DateTime | NOT NULL, DEFAULT NOW | Data de atribuição |

**Índices**:
- PRIMARY KEY (userId, roleId)
- FK (userId)
- FK (roleId)

---

### 2.11 Order (Pedidos)

**Propósito**: Pedidos realizados por clientes.

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| id | Int | PK, AUTO_INCREMENT | Identificador único |
| orderNumber | String | NOT NULL, UNIQUE | Número do pedido exibido ao cliente |
| customerName | String? | NULLABLE | Nome do cliente (opcional) |
| orderType | Enum | NOT NULL | Tipo: 'KIOSK', 'STAFF', 'DELIVERY' |
| status | Enum | NOT NULL, DEFAULT 'PENDING' | Status atual |
| totalAmount | Decimal(10,2) | NOT NULL | Valor total do pedido |
| notes | String? | NULLABLE | Observações gerais |
| createdById | Int? | FK → User.id, NULLABLE | Usuário que criou (null se kiosk) |
| createdAt | DateTime | NOT NULL, DEFAULT NOW | Data/hora de criação |
| updatedAt | DateTime | NOT NULL, AUTO UPDATE | Última atualização |
| completedAt | DateTime? | NULLABLE | Data/hora de conclusão |

**Enum OrderType**:
- `KIOSK`: Pedido feito pelo cliente no totem
- `STAFF`: Pedido feito por funcionário no balcão
- `DELIVERY`: (futuro) Pedido para entrega

**Enum OrderStatus**:
- `PENDING`: Aguardando confirmação/pagamento
- `CONFIRMED`: Confirmado, aguardando preparo
- `PREPARING`: Em preparo
- `READY`: Pronto para retirada
- `COMPLETED`: Entregue ao cliente
- `CANCELLED`: Cancelado

**Geração de orderNumber**:
- Formato: `2026-001`, `2026-002`... (ano + sequencial diário)
- Ou: `#001`, `#002`... (simples sequencial)

**Índices**:
- UNIQUE (orderNumber)
- FK (createdById)
- INDEX (status, createdAt)
- INDEX (createdAt) para queries de relatório

---

### 2.12 OrderItem (Itens do Pedido)

**Propósito**: Itens individuais (ou combos) dentro de um pedido.

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| id | Int | PK, AUTO_INCREMENT | Identificador único |
| orderId | Int | FK → Order.id, NOT NULL | Pedido relacionado |
| menuItemId | Int? | FK → MenuItem.id, NULLABLE | Item individual (null se combo) |
| comboId | Int? | FK → Combo.id, NULLABLE | Combo (null se item individual) |
| quantity | Int | NOT NULL, DEFAULT 1 | Quantidade |
| unitPrice | Decimal(10,2) | NOT NULL | Preço unitário (snapshot do momento) |
| subtotal | Decimal(10,2) | NOT NULL | quantity * unitPrice + addons |
| notes | String? | NULLABLE | Observações específicas do item |
| createdAt | DateTime | NOT NULL, DEFAULT NOW | Data de inclusão |

**Restrições**:
- CHECK: (menuItemId IS NOT NULL) XOR (comboId IS NOT NULL)
  - Ou é item individual OU é combo, nunca ambos ou nenhum

**Índices**:
- FK (orderId)
- FK (menuItemId)
- FK (comboId)

---

### 2.13 OrderItemAddon (Adicionais do Item do Pedido)

**Propósito**: Captura quais adicionais foram aplicados a cada item.

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| id | Int | PK, AUTO_INCREMENT | Identificador único |
| orderItemId | Int | FK → OrderItem.id, NOT NULL | Item do pedido |
| addonId | Int | FK → Addon.id, NOT NULL | Adicional aplicado |
| quantity | Int | NOT NULL, DEFAULT 1 | Quantidade do adicional |
| unitPrice | Decimal(10,2) | NOT NULL | Preço unitário (snapshot) |
| subtotal | Decimal(10,2) | NOT NULL | quantity * unitPrice |

**Índices**:
- FK (orderItemId)
- FK (addonId)

---

### 2.14 OrderStatusHistory (Histórico de Status)

**Propósito**: Rastreia mudanças de status do pedido com timestamp.

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| id | Int | PK, AUTO_INCREMENT | Identificador único |
| orderId | Int | FK → Order.id, NOT NULL | Pedido relacionado |
| status | Enum | NOT NULL | Status (mesmo enum de Order) |
| changedById | Int? | FK → User.id, NULLABLE | Quem mudou (null se automático) |
| changedAt | DateTime | NOT NULL, DEFAULT NOW | Quando mudou |
| notes | String? | NULLABLE | Observação sobre a mudança |

**Índices**:
- FK (orderId)
- FK (changedById)
- INDEX (orderId, changedAt)

---

## 3. Relacionamentos Resumidos

```
Category (1) ←→ (N) MenuItem
MenuItem (N) ←→ (M) Addon (através de MenuItemAddon)
Combo (1) ←→ (N) ComboItem
Combo (1) ←→ (N) ComboRule
User (N) ←→ (M) Role (através de UserRole)
User (1) ←→ (N) Order (como criador)
Order (1) ←→ (N) OrderItem
OrderItem (N) ←→ (1) MenuItem (ou null)
OrderItem (N) ←→ (1) Combo (ou null)
OrderItem (1) ←→ (N) OrderItemAddon
Order (1) ←→ (N) OrderStatusHistory
```

## 4. Estratégia de Preços (Snapshots)

**Por que salvar preços no pedido?**
- Preços podem mudar no cardápio, mas pedidos antigos devem manter valores originais
- Cada OrderItem salva `unitPrice` e `subtotal` **no momento da criação**
- Cada OrderItemAddon salva `unitPrice` e `subtotal` **no momento da criação**
- Order.totalAmount é calculado mas também salvo (facilita queries e relatórios)

**Imutabilidade**:
- Uma vez criado, OrderItem e OrderItemAddon NÃO devem ter preços alterados
- Se precisar ajustar pedido, melhor cancelar e criar novo

## 5. Queries Comuns (Otimização)

**Q1: Listar cardápio ativo por categoria**
```sql
SELECT * FROM Category
WHERE isActive = true
ORDER BY displayOrder;

SELECT * FROM MenuItem
WHERE categoryId = ? AND isActive = true AND isAvailable = true
ORDER BY displayOrder;
```

**Q2: Buscar pedidos do dia**
```sql
SELECT * FROM Order
WHERE DATE(createdAt) = CURRENT_DATE
ORDER BY createdAt DESC;
```

**Q3: Pedidos por status em tempo real**
```sql
SELECT * FROM Order
WHERE status IN ('PENDING', 'CONFIRMED', 'PREPARING')
ORDER BY createdAt ASC;
```

**Q4: Detalhes completos de um pedido**
```sql
-- Join: Order → OrderItem → MenuItem/Combo → OrderItemAddon → Addon
```

## 6. Migrações e Seed Data

**Prisma Migrations**:
- Todas as alterações de schema via `npx prisma migrate dev`
- Versionamento automático em `prisma/migrations/`

**Seed Script** (`prisma/seed.ts`):
- Criar categorias padrão (Hambúrgueres, Bebidas, Acompanhamentos, Sobremesas)
- Criar itens básicos (3-5 por categoria)
- Criar adicionais comuns (Bacon, Queijo, Molhos)
- Criar 2-3 combos exemplo
- Criar usuários admin e staff padrão
- Criar roles (admin, staff, kitchen)

## 7. Considerações Futuras

### Pagamentos (Preparação)
Adicionar entidade **Payment** no futuro:
```
Payment:
  - id
  - orderId (FK)
  - amount
  - method (CASH, CARD, PIX)
  - status (PENDING, APPROVED, FAILED)
  - transactionId
  - paidAt
```

### Multi-loja (Preparação)
Adicionar entidade **Store**:
```
Store:
  - id
  - name
  - address
  - isActive

Relacionamentos:
  - MenuItem.storeId (FK)
  - User.storeId (FK)
  - Order.storeId (FK)
```

### Inventário (Opcional)
```
Ingredient:
  - id
  - name
  - unit (kg, L, unidade)
  - currentStock
  - minStock

MenuItemIngredient:
  - menuItemId
  - ingredientId
  - quantity (quanto gasta por item)
```
