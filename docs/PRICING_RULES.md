# Regras de Precificação - Sistema de Pedidos

## 1. Princípios Gerais

### 1.1 Transparência
- O cliente deve sempre ver o **valor total atualizado** do pedido
- Cada adicional deve mostrar claramente o preço extra
- Combos devem exibir economia comparada aos itens avulsos

### 1.2 Imutabilidade de Preços em Pedidos
- Preços são **snapshot** no momento da criação do pedido
- Mudanças no cardápio NÃO afetam pedidos já criados
- Facilita auditoria e evita inconsistências

### 1.3 Precisão Decimal
- Todos os valores monetários: `Decimal(10,2)` (até R$ 99.999.999,99)
- Armazenar em centavos (Int) ou Decimal conforme preferência do ORM
- **Nunca usar Float/Double** para dinheiro (erros de arredondamento)

---

## 2. Cálculo de Preço de Itens Individuais

### Fórmula Base
```
Preço Item = (MenuItem.price) + Σ(Addon.price × quantity)
```

### Exemplo 1: Hambúrguer Simples
```
Hambúrguer Clássico: R$ 18,00
+ Bacon Extra: R$ 3,50 (qty: 1)
+ Queijo Extra: R$ 2,50 (qty: 2) = R$ 5,00
= TOTAL: R$ 26,50
```

### Exemplo 2: Refrigerante sem Adicionais
```
Refrigerante 500ml: R$ 6,00
+ Sem adicionais
= TOTAL: R$ 6,00
```

### Regras de Adicionais
1. **EXTRA** (pago):
   - Preço adicional aplicado integralmente
   - Quantidade multiplicável (2x bacon = 2 × price)

2. **SUBSTITUTION** (substituição):
   - Pode ser gratuito ou ter taxa
   - Se taxa > 0, aplica diferença de preço
   - Exemplo: Trocar pão comum por integral (+R$ 1,00)

3. **REMOVAL** (remoção):
   - Sempre gratuito (sem cebola, sem picles)
   - Não altera preço, apenas flag informativo

### Validações
- Quantity de addon ≥ 1
- Respeitar MenuItemAddon.maxQuantity (se definido)
- Addon só pode ser aplicado se existir em MenuItemAddon

---

## 3. Cálculo de Preço de Combos

### 3.1 Fórmula Base
```
Preço Combo = Combo.price + Σ(Extras) + Σ(Upgrades)
```

### Características
- **Combo.price é fixo**: já inclui todos os itens base do combo
- Cliente NÃO paga pelos itens individualmente
- Adicionais e upgrades são somados ao preço base

---

### 3.2 Cenário 1: Combo Simples (Sem Personalização)

**Combo Clássico**
- Inclui: Hambúrguer Básico + Batata Média + Refri 500ml
- Preço: R$ 25,00

**Cálculo:**
```
= R$ 25,00 (sem extras)
```

**Economia vs Itens Avulsos:**
```
Hambúrguer Básico: R$ 18,00
Batata Média:      R$ 8,00
Refri 500ml:       R$ 6,00
-----------------------------
Total avulso:      R$ 32,00
Combo:             R$ 25,00
Economia:          R$ 7,00 (22%)
```

---

### 3.3 Cenário 2: Combo com Adicionais

**Combo Clássico + Extras**
- Base: R$ 25,00
- Cliente adiciona: Bacon Extra (R$ 3,50)

**Cálculo:**
```
Combo base:        R$ 25,00
+ Bacon Extra:     R$  3,50
-----------------------------
Total:             R$ 28,50
```

---

### 3.4 Cenário 3: Combo com Upgrade

**Combo Premium (Monte Seu Combo)**
- Base: R$ 30,00
- Inclui: 1 Hambúrguer (escolha entre 3 opções), 1 Acompanhamento, 1 Bebida
- Regra de upgrade: "Hambúrguer Gourmet" tem taxa extra de R$ 5,00

**ComboRule para Hambúrguer:**
```json
{
  "ruleName": "Escolha o Hambúrguer",
  "ruleType": "SELECT_ONE",
  "minSelections": 1,
  "maxSelections": 1,
  "options": [
    { "menuItemId": 1, "name": "Básico", "extraCharge": 0 },
    { "menuItemId": 2, "name": "Bacon", "extraCharge": 0 },
    { "menuItemId": 3, "name": "Gourmet", "extraCharge": 5.00 }
  ]
}
```

**Se cliente escolhe "Gourmet":**
```
Combo base:        R$ 30,00
+ Upgrade Gourmet: R$  5,00
-----------------------------
Total:             R$ 35,00
```

---

### 3.5 Cenário 4: Combo com Múltiplas Personalizações

**Combo Família**
- Base: R$ 55,00
- 2 Hambúrgueres (escolha entre 4 tipos)
- 2 Acompanhamentos (escolha 2 de 5 opções)
- 2 Bebidas

**Cliente escolhe:**
1. Hambúrguer Bacon (R$ 0 extra)
2. Hambúrguer Gourmet (+R$ 5,00)
3. Batata Grande (R$ 0)
4. Onion Rings (+R$ 3,00)
5. Refri 500ml (R$ 0)
6. Suco Natural (+R$ 2,50)
7. Adiciona Bacon Extra no hambúrguer 1 (+R$ 3,50)

**Cálculo:**
```
Combo base:            R$ 55,00
+ Upgrade Gourmet:     R$  5,00
+ Upgrade Onion Rings: R$  3,00
+ Upgrade Suco Natural:R$  2,50
+ Bacon Extra:         R$  3,50
-----------------------------
Total:                 R$ 69,00
```

---

## 4. Cálculo de Pedido Completo

### Fórmula
```
Order.totalAmount = Σ(OrderItem.subtotal)

Onde:
OrderItem.subtotal = (unitPrice + Σ addons) × quantity
```

### Exemplo Completo

**Pedido #2026-042**

**Item 1: Hambúrguer Clássico**
- Preço base: R$ 18,00
- Bacon Extra: R$ 3,50
- Queijo Extra: R$ 2,50
- Subtotal: (18,00 + 3,50 + 2,50) × 1 = **R$ 24,00**

**Item 2: Combo Clássico**
- Preço base: R$ 25,00
- Sem extras
- Quantidade: 2
- Subtotal: 25,00 × 2 = **R$ 50,00**

**Item 3: Refrigerante 500ml**
- Preço base: R$ 6,00
- Sem extras
- Quantidade: 1
- Subtotal: 6,00 × 1 = **R$ 6,00**

**Total do Pedido:**
```
Item 1:   R$ 24,00
Item 2:   R$ 50,00
Item 3:   R$  6,00
--------------------
TOTAL:    R$ 80,00
```

---

## 5. Implementação Backend (Lógica de Negócio)

### 5.1 Service: calculateOrderTotal

```typescript
interface OrderItemInput {
  menuItemId?: number;
  comboId?: number;
  quantity: number;
  addons: { addonId: number; quantity: number }[];
  selectedComboOptions?: { ruleId: number; menuItemId: number }[];
}

async function calculateOrderTotal(items: OrderItemInput[]): Promise<{
  items: Array<{
    unitPrice: number;
    subtotal: number;
    addons: Array<{ id: number; unitPrice: number; subtotal: number }>;
  }>;
  totalAmount: number;
}> {
  let totalAmount = 0;
  const processedItems = [];

  for (const item of items) {
    let unitPrice = 0;
    const addonsData = [];

    // Caso 1: Item individual
    if (item.menuItemId) {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: item.menuItemId }
      });
      unitPrice = menuItem.price;

      // Processar adicionais
      for (const addon of item.addons) {
        const addonData = await prisma.addon.findUnique({
          where: { id: addon.addonId }
        });
        const addonSubtotal = addonData.price * addon.quantity;
        addonsData.push({
          id: addon.addonId,
          unitPrice: addonData.price,
          subtotal: addonSubtotal
        });
        unitPrice += addonSubtotal;
      }
    }

    // Caso 2: Combo
    if (item.comboId) {
      const combo = await prisma.combo.findUnique({
        where: { id: item.comboId },
        include: { rules: true }
      });
      unitPrice = combo.price;

      // Processar upgrades baseados em ComboRule
      for (const option of item.selectedComboOptions || []) {
        const rule = combo.rules.find(r => r.id === option.ruleId);
        if (rule && rule.extraCharge > 0) {
          unitPrice += rule.extraCharge;
        }
      }

      // Processar adicionais extras
      for (const addon of item.addons) {
        const addonData = await prisma.addon.findUnique({
          where: { id: addon.addonId }
        });
        const addonSubtotal = addonData.price * addon.quantity;
        addonsData.push({
          id: addon.addonId,
          unitPrice: addonData.price,
          subtotal: addonSubtotal
        });
        unitPrice += addonSubtotal;
      }
    }

    const subtotal = unitPrice * item.quantity;
    totalAmount += subtotal;

    processedItems.push({
      unitPrice,
      subtotal,
      addons: addonsData
    });
  }

  return { items: processedItems, totalAmount };
}
```

---

### 5.2 Validações Obrigatórias

#### Antes de Calcular Preço:
1. **Verificar disponibilidade**:
   - MenuItem.isAvailable = true
   - Combo.isAvailable = true
   - Addon.isActive = true

2. **Validar regras de combo**:
   - ComboRule.minSelections ≤ seleções ≤ ComboRule.maxSelections
   - MenuItem selecionado pertence à categoria permitida (allowedCategoryId)

3. **Validar adicionais**:
   - Addon existe em MenuItemAddon para aquele item
   - Respeitar maxQuantity (se definido)

#### Após Salvar Pedido:
- Registrar OrderStatusHistory com status inicial
- (Futuro) Deduzir do estoque se houver controle de inventário

---

## 6. Frontend: Cálculo em Tempo Real

### 6.1 State do Carrinho (Zustand)

```typescript
interface CartItem {
  type: 'item' | 'combo';
  id: number; // menuItemId ou comboId
  name: string;
  basePrice: number;
  quantity: number;
  addons: Array<{
    id: number;
    name: string;
    price: number;
    quantity: number;
  }>;
  comboSelections?: Array<{
    ruleId: number;
    menuItemId: number;
    extraCharge: number;
  }>;
  notes?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  calculateSubtotal: (item: CartItem) => number;
  calculateTotal: () => number;
  clear: () => void;
}

const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  calculateSubtotal: (item: CartItem) => {
    let unitPrice = item.basePrice;

    // Adicionar extras
    item.addons.forEach(addon => {
      unitPrice += addon.price * addon.quantity;
    });

    // Adicionar upgrades de combo
    item.comboSelections?.forEach(selection => {
      unitPrice += selection.extraCharge;
    });

    return unitPrice * item.quantity;
  },

  calculateTotal: () => {
    const { items, calculateSubtotal } = get();
    return items.reduce((total, item) => {
      return total + calculateSubtotal(item);
    }, 0);
  },

  // ... outros métodos
}));
```

### 6.2 Componente: CartSummary

```tsx
function CartSummary() {
  const { items, calculateSubtotal, calculateTotal } = useCartStore();
  const total = calculateTotal();

  return (
    <div className="cart-summary">
      <h3>Resumo do Pedido</h3>
      {items.map((item, idx) => (
        <div key={idx} className="cart-item">
          <span>{item.name}</span>
          <span>R$ {calculateSubtotal(item).toFixed(2)}</span>
        </div>
      ))}
      <div className="cart-total">
        <strong>TOTAL:</strong>
        <strong>R$ {total.toFixed(2)}</strong>
      </div>
    </div>
  );
}
```

---

## 7. Descontos e Promoções (Preparação Futura)

### 7.1 Estrutura para Cupons

**Entidade: Coupon** (adicionar futuramente)
```
Coupon:
  - id
  - code (ex: "BEMVINDO10")
  - type (PERCENTAGE, FIXED_AMOUNT, FREE_ITEM)
  - value (10 para 10%, ou 5.00 para R$5 desconto)
  - minOrderAmount (pedido mínimo para aplicar)
  - validFrom / validUntil
  - usageLimit
  - usageCount
```

**Cálculo com Desconto:**
```
Subtotal (sem desconto):  R$ 80,00
Cupom "BEMVINDO10" (-10%): -R$  8,00
------------------------------------
Total Final:               R$ 72,00
```

### 7.2 Integração no Modelo de Dados

**Order.discountAmount** (adicionar campo):
```typescript
discountAmount: Decimal(10,2) // valor do desconto aplicado
couponCode?: string           // código do cupom usado
finalAmount: Decimal(10,2)    // totalAmount - discountAmount
```

**Fórmula atualizada:**
```
Order.finalAmount = Order.totalAmount - Order.discountAmount
```

---

## 8. Taxas Adicionais (Preparação Futura)

### 8.1 Taxa de Serviço
```
Subtotal:         R$ 80,00
Taxa 10%:         R$  8,00
-----------------------------
Total com taxa:   R$ 88,00
```

### 8.2 Taxa de Entrega (Delivery)
```
Subtotal:         R$ 80,00
Entrega:          R$  5,00
-----------------------------
Total:            R$ 85,00
```

**Adicionar campo Order.serviceFee e Order.deliveryFee**

---

## 9. Relatórios e Análises

### 9.1 Queries Úteis

**Total de Vendas do Dia:**
```sql
SELECT SUM(totalAmount) as total_vendas
FROM Order
WHERE DATE(createdAt) = CURRENT_DATE
  AND status IN ('COMPLETED');
```

**Item Mais Vendido:**
```sql
SELECT mi.name, SUM(oi.quantity) as total_qty
FROM OrderItem oi
JOIN MenuItem mi ON oi.menuItemId = mi.id
JOIN Order o ON oi.orderId = o.id
WHERE DATE(o.createdAt) = CURRENT_DATE
GROUP BY mi.id
ORDER BY total_qty DESC
LIMIT 10;
```

**Ticket Médio:**
```sql
SELECT AVG(totalAmount) as ticket_medio
FROM Order
WHERE DATE(createdAt) = CURRENT_DATE
  AND status = 'COMPLETED';
```

---

## 10. Casos de Teste (Validação da Lógica)

### Teste 1: Item Individual com Múltiplos Adicionais
```
Input:
  - Hambúrguer Clássico (R$ 18,00)
  - Bacon (R$ 3,50) × 2
  - Queijo (R$ 2,50) × 1

Expected:
  unitPrice = 18 + (3.5*2) + 2.5 = 27.50
  subtotal (qty=1) = 27.50
```

### Teste 2: Combo Simples sem Extras
```
Input:
  - Combo Clássico (R$ 25,00)
  - Quantidade: 3

Expected:
  unitPrice = 25.00
  subtotal = 25 * 3 = 75.00
```

### Teste 3: Combo com Upgrade
```
Input:
  - Combo Premium (R$ 30,00)
  - Upgrade Hambúrguer Gourmet (+R$ 5,00)
  - Bacon Extra (R$ 3,50)

Expected:
  unitPrice = 30 + 5 + 3.5 = 38.50
  subtotal (qty=1) = 38.50
```

### Teste 4: Pedido Completo Misto
```
Input:
  Item 1: Hambúrguer (R$ 18 + 3.5 bacon) × 1 = 21.50
  Item 2: Combo (R$ 25) × 2 = 50.00
  Item 3: Refri (R$ 6) × 1 = 6.00

Expected:
  totalAmount = 21.50 + 50.00 + 6.00 = 77.50
```

---

## 11. Checklist de Implementação

**Backend:**
- [ ] Service `calculateOrderTotal` implementado
- [ ] Validações de disponibilidade e regras de combo
- [ ] Snapshot de preços salvos em OrderItem/OrderItemAddon
- [ ] Testes unitários para cálculos complexos
- [ ] Endpoint `/api/orders/calculate-preview` (pré-visualização sem salvar)

**Frontend:**
- [ ] CartStore com cálculo em tempo real
- [ ] Componente CartSummary exibindo total atualizado
- [ ] Validação visual de valores (preço unitário vs subtotal)
- [ ] Formatação monetária consistente (use `Intl.NumberFormat`)
- [ ] Testes E2E para fluxos de compra

**Banco de Dados:**
- [ ] Prisma schema com Decimal(10,2) para valores monetários
- [ ] Migrations criadas e testadas
- [ ] Seed data com preços realistas

---

## 12. Referências e Boas Práticas

### Formatação Monetária (JavaScript)
```typescript
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Uso:
formatCurrency(25.50); // "R$ 25,50"
```

### Arredondamento Seguro
```typescript
// Sempre arredondar para 2 casas decimais
const roundMoney = (value: number): number => {
  return Math.round(value * 100) / 100;
};
```

### Evitar Erros de Precisão
```typescript
// ❌ ERRADO: usar float diretamente
const total = 0.1 + 0.2; // 0.30000000000000004

// ✅ CORRETO: usar inteiros (centavos) ou Decimal
import Decimal from 'decimal.js';
const total = new Decimal(0.1).plus(0.2).toNumber(); // 0.3
```
