# Mapa de Telas (Wireflow) - Sistema de Pedidos

## 1. Visão Geral das Interfaces

### Três Perfis Principais
```
┌────────────────────────────────────────────────────────┐
│                   SISTEMA DE PEDIDOS                   │
│                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐   │
│  │   KIOSK      │  │    STAFF     │  │    ADMIN    │   │
│  │  (Cliente)   │  │ (Funcionário)│  │  (Gerente)  │   │
│  │              │  │              │  │             │   │
│  │ • Público    │  │ • Login      │  │ • Login     │   │
│  │ • Touch UI   │  │ • Rápido     │  │ • Completo  │   │
│  │ • Autoserviço│  │ • Balcão     │  │ • Gestão    │   │
│  └──────────────┘  └──────────────┘  └─────────────┘   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 2. KIOSK - Interface do Cliente (Totem Touch)

### 2.1 Fluxo Principal
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Splash    │────►│  Categorias │────►│   Itens     │────►│  Detalhes   │
│   Screen    │     │   do Menu   │     │   da Cat.   │     │   do Item   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                    │                                      │
      │                    │                                      ▼
      │                    │                             ┌─────────────────┐
      │                    │                             │  Personalizar   │
      │                    │                             │ (Adicionais)    │
      │                    │                             └────────┬────────┘
      │                    │                                      │
      │                    ▼                                      ▼
      │            ┌─────────────┐                       ┌─────────────────┐
      │            │   Combos    │──────────────────────►│  Escolher Itens │
      │            │  Destaque   │                       │     do Combo    │
      │            └─────────────┘                       └────────┬────────┘
      │                                                           │
      │                                                           │
      └────────────────────────────────┐                          │
                                       ▼                          │
                              ┌─────────────────┐                 │
                              │    Carrinho     │◄────────────────┘
                              │   (Resumo)      │
                              └────────┬────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │  Confirmação    │
                              │   do Pedido     │
                              └────────┬────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │  Número do      │
                              │    Pedido       │
                              │  (Aguarde...)   │
                              └─────────────────┘
```

---

### 2.2 Tela 1: Splash Screen (Bem-vindo)

**Layout:**
```
┌──────────────────────────────────────────────────┐
│                                                  │
│            ╔════════════════════╗                │
│            ║                    ║                │
│            ║   LOGO RESTAURANTE ║                │
│            ║                    ║                │
│            ╚════════════════════╝                │
│                                                  │
│              Bem-vindo(a)!                       │
│                                                  │
│     ┌──────────────────────────────┐             │
│     │                              │             │
│     │   TOQUE PARA FAZER PEDIDO    │             │
│     │                              │             │
│     └──────────────────────────────┘             │
│                                                  │
│                                                  │
│     [Idioma: Português ▾]                        │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Comportamento:**
- Timeout de 30s sem interação → volta para splash
- Botão grande e evidente
- Opção de idioma (futuro)

---

### 2.3 Tela 2: Categorias do Menu

**Layout:**
```
┌──────────────────────────────────────────────────┐
│ [< Início]           CARDÁPIO         [🛒 0]     │ ← Header fixo
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  │
│  │   🍔      │   │   🍟      │  │   🥤       │  │
│  │            │  │            │  │            │  │
│  │Hambúrgueres│  │Acompanha-  │  │  Bebidas   │  │
│  │   (12)     │  │ mentos (8) │  │    (10)    │  │
│  └────────────┘  └────────────┘  └────────────┘  │
│                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  │
│  │   🍰       │  │   ⭐      │  │   🎯       │   │
│  │            │  │            │  │            │  │
│  │ Sobremesas │  │  Combos    │  │ Promoções  │  │
│  │    (6)     │  │    (5)     │  │    (3)     │  │
│  └────────────┘  └────────────┘  └────────────┘  │
│                                                  │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │         🔍 Buscar item...               │     │
│  └──────────────────────────────────────────┘    │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Elementos:**
- Cards grandes (200x200px mínimo)
- Ícone + Nome + Quantidade de itens
- Busca sempre visível
- Badge de carrinho com contador

---

### 2.4 Tela 3: Itens da Categoria

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ [< Voltar]       HAMBÚRGUERES        [🛒 2]     │
├─────────────────────────────────────────────────┤
│                                                 │
│ ╔════════════════════════════════════════════╗  │
│ ║  🍔 COMBO CLÁSSICO         R$ 25,00 💰    ║  │
│ ║  Hambúrguer + Batata + Refri               ║  │
│ ║  ECONOMIZE R$ 7,00!                        ║  │
│ ╚════════════════════════════════════════════╝  │
│                                                 │
│ ┌──────────────────────────────────────────────┐│
│ │ [IMG]  Hambúrguer Clássico                   ││
│ │        Pão, carne, alface, tomate            ││
│ │                              R$ 18,00   [+]  ││
│ └──────────────────────────────────────────────┘│
│                                                 │
│ ┌──────────────────────────────────────────────┐│
│ │ [IMG]  Hambúrguer Bacon                      ││
│ │        Com bacon crocante                    ││
│ │                              R$ 22,00   [+]  ││
│ └──────────────────────────────────────────────┘│
│                                                 │
│ ┌──────────────────────────────────────────────┐│
│ │ [IMG]  Hambúrguer Gourmet                    ││
│ │        Carne especial com brie               ││
│ │                              R$ 28,00   [+]  ││
│ └──────────────────────────────────────────────┘│
│                                                 │
└─────────────────────────────────────────────────┘
```

**Elementos:**
- Destaque para combos (borda colorida)
- Cards de itens com imagem, nome, descrição curta, preço
- Botão [+] grande para adicionar
- Scroll vertical suave

---

### 2.5 Tela 4: Detalhes e Personalização (Item Individual)

**Layout:**
```
┌──────────────────────────────────────────────────┐
│ [✕ Fechar]    HAMBÚRGUER CLÁSSICO               │
├──────────────────────────────────────────────────┤
│                                                  │
│          ┌────────────────────┐                  │
│          │                    │                  │
│          │    [IMAGEM ITEM]   │                  │
│          │                    │                  │
│          └────────────────────┘                  │
│                                                  │
│  Pão artesanal, carne 180g, alface, tomate,      │
│  cebola, molho especial                          │
│                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━      │
│                                                  │
│  ADICIONE EXTRAS:                                │
│                                                  │
│  ☐ Bacon Extra            + R$ 3,50  [  - 0 + ] │
│  ☐ Queijo Extra           + R$ 2,50  [  - 0 + ] │
│  ☐ Ovo                    + R$ 2,00  [  - 0 + ] │
│  ☐ Cheddar                + R$ 3,00  [  - 0 + ] │
│                                                  │
│  REMOVA INGREDIENTES (grátis):                   │
│  [X] Sem cebola   [ ] Sem picles   [ ] Sem tomate│
│                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━      │
│                                                  │
│  Observações:                                    │
│  ┌────────────────────────────────────────┐      │
│  │ Ponto da carne bem passado...          │      │
│  └────────────────────────────────────────┘      │
│                                                  │
│  ┌────────────────────────────────────────┐      │
│  │  ADICIONAR AO CARRINHO - R$ 18,00      │      │
│  └────────────────────────────────────────┘      │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Comportamento:**
- Checkbox + stepper de quantidade para cada extra
- Preço atualizado em tempo real
- Botão destaque no final

---

### 2.6 Tela 5: Personalização de Combo

**Layout:**
```
┌──────────────────────────────────────────────────┐
│ [✕ Fechar]       COMBO CLÁSSICO                  │
├──────────────────────────────────────────────────┤
│                                                  │
│  R$ 25,00  (Economize R$ 7,00 vs avulso)         │
│                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━      │
│                                                  │
│  PASSO 1: ESCOLHA O HAMBÚRGUER (obrigatório)     │
│                                                  │
│  ◉ Hambúrguer Clássico              Incluído     │
│  ○ Hambúrguer Bacon                 Incluído     │
│  ○ Hambúrguer Gourmet         + R$ 5,00 💰       │
│                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━      │
│                                                  │
│  PASSO 2: ESCOLHA O ACOMPANHAMENTO               │
│                                                  │
│  ◉ Batata Frita Média              Incluída      │
│  ○ Onion Rings                + R$ 3,00          │
│  ○ Batata Grande              + R$ 2,00          │
│                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━      │
│                                                  │
│  PASSO 3: ESCOLHA A BEBIDA                       │
│                                                  │
│  ◉ Refrigerante 500ml              Incluído      │
│  ○ Suco Natural               + R$ 2,50          │
│  ○ Refrigerante 1L            + R$ 3,00          │
│                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━      │
│                                                  │
│  ADICIONAIS EXTRAS (opcional):                   │
│  [ ] Bacon Extra + R$ 3,50   [ ] Queijo + R$ 2,50│
│                                                  │
│  ┌────────────────────────────────────────┐      │
│  │  ADICIONAR AO CARRINHO - R$ 25,00      │      │
│  └────────────────────────────────────────┘      │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Comportamento:**
- Radio buttons para escolhas únicas
- Indicação clara de valores extras
- Total atualizado dinamicamente

---

### 2.7 Tela 6: Carrinho (Revisão do Pedido)

**Layout:**
```
┌──────────────────────────────────────────────────┐
│ [< Continuar]      MEU PEDIDO      [🗑️ Limpar]  │
├──────────────────────────────────────────────────┤
│                                                  │
│ ┌────────────────────────────────────────────┐   │
│ │ Hambúrguer Clássico               R$ 21,50 │   │
│ │   + Bacon Extra                             │  │
│ │   Obs: Bem passado                          │  │
│ │   Quantidade: [- 1 +]              [✕]      │  │
│ └────────────────────────────────────────────┘   │
│                                                  │
│ ┌────────────────────────────────────────────┐   │
│ │ Combo Clássico                    R$ 25,00 │   │
│ │   Hambúrguer Bacon                         │   │
│ │   Batata Média                             │   │
│ │   Refrigerante 500ml                       │   │
│ │   Quantidade: [- 2 +]              [✕]     │   │
│ │                         Subtotal: R$ 50,00 │   │
│ └────────────────────────────────────────────┘   │
│                                                  │
│ ┌────────────────────────────────────────────┐   │
│ │ Refrigerante 500ml                R$  6,00 │   │
│ │   Quantidade: [- 1 +]              [✕]     │   │
│ └────────────────────────────────────────────┘   │
│                                                  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━     │
│                                                  │
│  Subtotal                          R$ 77,50      │
│                                                  │
│  ╔══════════════════════════════════════════╗    │
│  ║  TOTAL                      R$ 77,50     ║    │
│  ╚══════════════════════════════════════════╝    │
│                                                  │
│  ┌────────────────────────────────────────┐      │
│  │      FINALIZAR PEDIDO                  │      │
│  └────────────────────────────────────────┘      │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Elementos:**
- Lista expansível de itens
- Controle de quantidade inline
- Botão remover por item
- Total destacado

---

### 2.8 Tela 7: Confirmação e Número do Pedido

**Layout:**
```
┌──────────────────────────────────────────────────┐
│                                                  │
│                                                  │
│                   ✅                             │
│                                                  │
│           PEDIDO CONFIRMADO!                     │
│                                                  │
│      ╔══════════════════════════════╗            │
│      ║                              ║            │
│      ║        NÚMERO #042         ║            │
│      ║                              ║            │
│      ╚══════════════════════════════╝            │
│                                                  │
│   Aguarde a chamada do seu número no painel.     │
│                                                  │
│                                                  │
│        Total pago:  R$ 77,50                     │
│                                                  │
│                                                  │
│  ┌────────────────────────────────────────┐      │
│  │       FAZER NOVO PEDIDO                │      │
│  └────────────────────────────────────────┘      │
│                                                  │
│           [Ver Detalhes do Pedido]               │
│                                                  │
│                                                  │
│  (Auto-retorna à tela inicial em 30s)            │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Comportamento:**
- Exibir número grande e claro
- Timeout para voltar ao início
- Opção de imprimir (se houver impressora)

---

## 3. STAFF - Interface do Funcionário (Balcão)

### 3.1 Fluxo Principal
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Login     │────►│    Home     │────►│ Novo Pedido │
│             │     │  Dashboard  │     │             │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │                    │
                           │                    ▼
                           │           ┌─────────────────┐
                           │           │  Seleção Rápida │
                           │           │   de Itens      │
                           │           └────────┬────────┘
                           │                    │
                           │                    ▼
                           │           ┌─────────────────┐
                           │           │    Checkout     │
                           │           │ (Pagamento)     │
                           │           └────────┬────────┘
                           │                    │
                           │                    ▼
                           │           ┌─────────────────┐
                           │           │   Confirmação   │
                           │           └─────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  Lista Pedidos  │
                  │   (Monitora)    │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ Atualizar Status│
                  └─────────────────┘
```

---

### 3.2 Tela 1: Login

**Layout:**
```
┌──────────────────────────────────────────────────┐
│                                                  │
│         ┌────────────────────────┐               │
│         │                        │               │
│         │     LOGO SISTEMA       │               │
│         │                        │               │
│         └────────────────────────┘               │
│                                                  │
│         ACESSO FUNCIONÁRIO                       │
│                                                  │
│         Usuário:                                 │
│         ┌────────────────────────┐               │
│         │                        │               │
│         └────────────────────────┘               │
│                                                  │
│         Senha:                                   │
│         ┌────────────────────────┐               │
│         │ ••••••••••             │               │
│         └────────────────────────┘               │
│                                                  │
│         ┌────────────────────────┐               │
│         │      ENTRAR            │               │
│         └────────────────────────┘               │
│                                                  │
│         [Esqueci minha senha]                    │
│                                                  │
│                                                  │
│         [← Voltar ao Kiosk]                      │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

### 3.3 Tela 2: Dashboard (Home Staff)

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│ [☰] Menu  |  PAINEL BALCÃO  |  João Silva [Sair]            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │  📋         │  │  ⏳        │  │  ✅         │           │
│  │  Pedidos    │  │  Em         │  │  Prontos    │           │
│  │  do Dia     │  │  Preparo    │  │  Hoje       │           │
│  │             │  │             │  │             │           │
│  │    142      │  │     8       │  │    134      │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                              │
│  ┌──────────────────────────────────────────────┐            │
│  │        PRÓXIMOS PEDIDOS ESPERANDO            │            │
│  ├──────────────────────────────────────────────┤            │
│  │ #043  |  Mesa 10  |  R$ 85,00  |  [Ver] [✓] │           │
│  │ #044  |  Balcão   |  R$ 32,50  |  [Ver] [✓] │           │
│  │ #045  |  Totem    |  R$ 125,00 |  [Ver] [✓] │           │
│  └──────────────────────────────────────────────┘            │
│                                                              │
│  ┌──────────────────────────────────────────────┐            │
│  │         PEDIDOS EM PREPARO                   │            │
│  ├──────────────────────────────────────────────┤            │
│  │ #038  |  5 min atrás  |  2x Combo  | [Pronto]│          │
│  │ #039  |  3 min atrás  |  Hambúrguer| [Pronto]│          │
│  │ #040  |  1 min atrás  |  Pizza     | [Pronto]│          │
│  └──────────────────────────────────────────────┘            │
│                                                              │
│  ┌────────────────────┐                                      │
│  │  NOVO PEDIDO       │                                      │
│  │   (BALCÃO)         │                                      │
│  └────────────────────┘                                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Elementos:**
- Cards com métricas do dia
- Listas de pedidos com ações rápidas
- Destaque para botão "Novo Pedido"

---

### 3.4 Tela 3: Novo Pedido (Seleção Rápida)

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│ [< Voltar]  NOVO PEDIDO - BALCÃO          [🛒 Carrinho: 3]   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Cliente: [________________]  Mesa/Local: [Balcão ▾]         │
│                                                              │
│  ┌─────────────────────────────────────────┐                 │
│  │ 🔍 Buscar item por nome ou código...    │                │
│  └─────────────────────────────────────────┘                 │
│                                                              │
│  [Hambúrgueres] [Combos] [Bebidas] [Acompanhamentos] [+]     │
│                                                              │
│  COMBOS MAIS VENDIDOS:                                       │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐                   │
│  │ Combo     │ │ Combo     │ │ Combo     │                   │
│  │ Clássico  │ │ Família   │ │ Kids      │                   │
│  │ R$ 25,00  │ │ R$ 55,00  │ │ R$ 18,00  │                   │
│  │   [+]     │ │   [+]     │ │   [+]     │                   │
│  └───────────┘ └───────────┘ └───────────┘                   │
│                                                              │
│  HAMBÚRGUERES:                                               │
│  ┌─────────────────────────────────────────┐                 │
│  │ Hambúrguer Clássico    R$ 18,00  [QTD] [+]│               │
│  │ Hambúrguer Bacon       R$ 22,00  [QTD] [+]│               │
│  │ Hambúrguer Gourmet     R$ 28,00  [QTD] [+]│               │
│  └─────────────────────────────────────────┘                 │
│                                                              │
│  ━━━━━━━━━━━━━━ CARRINHO ━━━━━━━━━━━━━━                      │
│  2x Combo Clássico                R$ 50,00                   │
│  1x Refri Extra                   R$  6,00                   │
│  ───────────────────────────────────────                     │
│  TOTAL                            R$ 56,00                   │
│                                                              │
│  [Finalizar Pedido]                                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Características:**
- Busca rápida por nome ou código de barras
- Atalhos para itens mais vendidos
- Carrinho lateral sempre visível
- Adicionar quantidade rapidamente

---

### 3.5 Tela 4: Finalizar Pedido (Checkout)

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│ [< Voltar]           FINALIZAR PEDIDO                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  RESUMO DO PEDIDO:                                           │
│  ┌───────────────────────────────────────────┐               │
│  │ 2x Combo Clássico              R$ 50,00   │               │
│  │ 1x Refrigerante 500ml          R$  6,00   │               │
│  └───────────────────────────────────────────┘               │
│                                                              │
│  Subtotal:                        R$ 56,00                   │
│  Taxa de serviço (10%):           R$  5,60                   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                     │
│  TOTAL A PAGAR:                   R$ 61,60                   │
│                                                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                     │
│                                                              │
│  FORMA DE PAGAMENTO: (MVP: informacional)                    │
│  ◉ Dinheiro                                                  │
│  ○ Cartão de Crédito                                         │
│  ○ Cartão de Débito                                          │
│  ○ PIX                                                       │
│                                                              │
│  Se Dinheiro, valor recebido:                                │
│  ┌─────────────┐                                             │
│  │ R$ 70,00    │  → Troco: R$ 8,40                           │
│  └─────────────┘                                             │
│                                                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                     │
│                                                              │
│  Observações:                                                │
│  ┌────────────────────────────────────────┐                  │
│  │ Cliente pediu sem sal na batata...     │                  │
│  └────────────────────────────────────────┘                  │
│                                                              │
│  ┌────────────────────────┐                                  │
│  │  CONFIRMAR PEDIDO      │                                  │
│  └────────────────────────┘                                  │
│                                                              │
│  [Cancelar]                                                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

### 3.6 Tela 5: Lista de Pedidos (Monitoramento)

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│ [☰]  PEDIDOS EM ANDAMENTO        [Atualizar] [Hoje ▾]       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Filtros: [Todos] [Pendentes] [Preparando] [Prontos]         │
│                                                              │
│  ┌────────────────────────────────────────────────────┐      │
│  │ #042  |  14:35  |  Totem     |  PRONTO  ✅       │     │
│  │ Total: R$ 77,50  |  2 itens                        │      │
│  │ [Ver Detalhes] [Entregar]                          │      │
│  └────────────────────────────────────────────────────┘      │
│                                                              │
│  ┌────────────────────────────────────────────────────┐      │
│  │ #043  |  14:38  |  Mesa 10   |  PREPARANDO ⏳   │      │
│  │ Total: R$ 85,00  |  5 itens                        │      │
│  │ [Ver Detalhes] [Marcar Pronto]                     │      │
│  └────────────────────────────────────────────────────┘      │
│                                                              │
│  ┌────────────────────────────────────────────────────┐      │
│  │ #044  |  14:40  |  Balcão    |  CONFIRMADO ⏸    │      │
│  │ Total: R$ 32,50  |  1 item                         │      │
│  │ [Ver Detalhes] [Iniciar Preparo]                   │      │
│  └────────────────────────────────────────────────────┘      │
│                                                              │
│  ┌────────────────────────────────────────────────────┐      │
│  │ #045  |  14:42  |  Totem     |  PENDENTE ⏰      │     │
│  │ Total: R$ 125,00  |  8 itens                       │      │
│  │ [Ver Detalhes] [Confirmar]                         │      │
│  └────────────────────────────────────────────────────┘      │
│                                                              │
│                                                              │
│  Mostrando 4 de 142 pedidos                                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Características:**
- Atualização em tempo real (WebSocket)
- Cores/badges por status
- Filtros rápidos
- Ações inline

---

## 4. ADMIN - Interface do Gerente

### 4.1 Fluxo Principal
```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Login     │────►│  Dashboard   │────►│  Relatórios  │
│   Admin     │     │   Admin      │     │              │
└─────────────┘     └──────┬───────┘     └──────────────┘
                           │
                           ├──────────────┐
                           │              │
                           ▼              ▼
                  ┌──────────────┐  ┌──────────────┐
                  │   Cardápio   │  │   Usuários   │
                  │   (CRUD)     │  │   (CRUD)     │
                  └──────┬───────┘  └──────────────┘
                         │
                  ┌──────┴───────┐
                  │              │
                  ▼              ▼
          ┌──────────────┐  ┌──────────────┐
          │   Combos     │  │  Adicionais  │
          │   (CRUD)     │  │   (CRUD)     │
          └──────────────┘  └──────────────┘
```

---

### 4.2 Tela 1: Dashboard Admin

**Layout:**
```
┌────────────────────────────────────────────────────────────────┐
│ [☰] Menu  |  PAINEL ADMINISTRATIVO  |  Admin [Sair]           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  RESUMO DO DIA (06/03/2026):                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  💰         │  │  📦         │  │  ⏱️        │             │
│  │  Faturamento│  │  Pedidos    │  │  Ticket     │             │
│  │             │  │             │  │  Médio      │             │
│  │  R$ 8.450   │  │    142      │  │  R$ 59,50   │             │
│  │  ↑ +12%     │  │  ↑ +8%      │  │  ↓ -2%      │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                │
│  ┌──────────────────────────────────────────────┐              │
│  │         GRÁFICO: VENDAS DA SEMANA            │              │
│  │                                              │              │
│  │    █                                         │              │
│  │    █     █                                   │              │
│  │    █     █     █                             │              │
│  │    █ █   █     █  █                          │              │
│  │  ▄ █ █ █ █ ▄ ▄ █  █  ▄                       │              │
│  │ Seg Ter Qua Qui Sex Sab Dom                  │              │
│  └──────────────────────────────────────────────┘              │
│                                                                │
│  ITENS MAIS VENDIDOS HOJE:                                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ 1. Combo Clássico                  82 vendas           │    │
│  │ 2. Hambúrguer Bacon                45 vendas           │    │
│  │ 3. Refrigerante 500ml              134 vendas          │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                │
│  AÇÕES RÁPIDAS:                                                │
│  [Gerenciar Cardápio] [Relatórios] [Usuários] [Configurações]  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

### 4.3 Tela 2: Gerenciar Cardápio

**Layout:**
```
┌────────────────────────────────────────────────────────────────┐
│ [☰]  GERENCIAR CARDÁPIO               [+ Novo Item]           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Filtros: [Categoria ▾] [Disponível ▾] [Buscar...]            │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  HAMBÚRGUERES (12 itens)                     [+]       │   │
│  ├────────────────────────────────────────────────────────┤   │
│  │  [IMG] Hambúrguer Clássico       R$ 18,00    ✅ Ativo  │   │
│  │        [Editar] [Duplicar] [Desativar]                 │   │
│  ├────────────────────────────────────────────────────────┤   │
│  │  [IMG] Hambúrguer Bacon          R$ 22,00    ✅ Ativo  │   │
│  │        [Editar] [Duplicar] [Desativar]                 │   │
│  ├────────────────────────────────────────────────────────┤   │
│  │  [IMG] Hambúrguer Vegano         R$ 20,00    ❌ Indisp.│   │
│  │        [Editar] [Duplicar] [Marcar Disponível]         │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  COMBOS (5 itens)                            [+]       │   │
│  ├────────────────────────────────────────────────────────┤   │
│  │  [IMG] Combo Clássico            R$ 25,00    ✅ Ativo  │   │
│  │        [Editar] [Ver Regras] [Desativar]               │   │
│  ├────────────────────────────────────────────────────────┤   │
│  │  [IMG] Combo Família             R$ 55,00    ✅ Ativo  │   │
│  │        [Editar] [Ver Regras] [Desativar]               │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

### 4.4 Tela 3: Editar Item do Cardápio

**Layout:**
```
┌────────────────────────────────────────────────────────────────┐
│ [< Voltar]  EDITAR ITEM: HAMBÚRGUER CLÁSSICO                  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  INFORMAÇÕES BÁSICAS:                                          │
│  Nome:        [Hambúrguer Clássico________________]            │
│  Categoria:   [Hambúrgueres ▾]                                 │
│  Preço:       [R$ 18,00]                                       │
│  Descrição:   [Pão artesanal, carne 180g, alface...]          │
│                                                                │
│  IMAGEM:                                                       │
│  ┌──────────────┐                                             │
│  │   [Preview]  │  [Escolher Arquivo] [Remover]               │
│  └──────────────┘                                             │
│                                                                │
│  STATUS:                                                       │
│  ☑ Ativo (visível no cardápio)                                 │
│  ☑ Disponível para venda                                       │
│                                                                │
│  ADICIONAIS PERMITIDOS:                                        │
│  ☑ Bacon Extra (R$ 3,50)                                       │
│  ☑ Queijo Extra (R$ 2,50)                                      │
│  ☑ Ovo (R$ 2,00)                                               │
│  ☐ Cheddar (R$ 3,00)                                           │
│  [+ Adicionar Novo]                                            │
│                                                                │
│  INFORMAÇÕES ADICIONAIS:                                       │
│  Tempo de preparo: [8] minutos                                 │
│  Calorias:         [650] kcal                                  │
│  Alergênicos:      [Glúten, Lactose_____________]             │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐                           │
│  │   SALVAR     │  │   CANCELAR   │                           │
│  └──────────────┘  └──────────────┘                           │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

### 4.5 Tela 4: Gerenciar Combos

**Layout:**
```
┌────────────────────────────────────────────────────────────────┐
│ [< Voltar]  EDITAR COMBO: COMBO CLÁSSICO                      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  INFORMAÇÕES BÁSICAS:                                          │
│  Nome:   [Combo Clássico________________________]              │
│  Preço:  [R$ 25,00]                                            │
│  Descrição: [Hambúrguer + Batata + Refri________]             │
│  Imagem: [Upload...]                                           │
│                                                                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                                │
│  ITENS INCLUSOS:                                               │
│  ┌────────────────────────────────────────────────────┐       │
│  │ 1. Hambúrguer (Escolha 1)     [Editar] [Remover]  │       │
│  │    Opções permitidas: Clássico, Bacon             │       │
│  │ 2. Batata Média (Incluída)    [Editar] [Remover]  │       │
│  │ 3. Refrigerante 500ml         [Editar] [Remover]  │       │
│  └────────────────────────────────────────────────────┘       │
│  [+ Adicionar Item ao Combo]                                   │
│                                                                │
│  REGRAS DE PERSONALIZAÇÃO:                                     │
│  ┌────────────────────────────────────────────────────┐       │
│  │ Regra 1: "Escolha o Hambúrguer"                   │       │
│  │   Tipo: SELECT_ONE                                 │       │
│  │   Categoria permitida: Hambúrgueres               │       │
│  │   Min: 1 | Max: 1                                  │       │
│  │   Taxa extra: R$ 0,00                              │       │
│  │   [Editar Regra] [Remover]                         │       │
│  └────────────────────────────────────────────────────┘       │
│  [+ Adicionar Regra]                                           │
│                                                                │
│  ECONOMIA VS AVULSO:                                           │
│  Total avulso: R$ 32,00                                        │
│  Preço combo:  R$ 25,00                                        │
│  Economia:     R$ 7,00 (22%)                                   │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐                           │
│  │   SALVAR     │  │   CANCELAR   │                           │
│  └──────────────┘  └──────────────┘                           │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

### 4.6 Tela 5: Relatórios

**Layout:**
```
┌────────────────────────────────────────────────────────────────┐
│ [☰]  RELATÓRIOS                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Período: [01/03/2026] a [06/03/2026]  [Aplicar]              │
│                                                                │
│  RESUMO GERAL:                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │ Total Vendas│  │  Pedidos    │  │   Ticket    │           │
│  │             │  │             │  │   Médio     │           │
│  │ R$ 42.350   │  │    712      │  │  R$ 59,48   │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                                │
│  ┌──────────────────────────────────────────────┐             │
│  │  VENDAS POR CATEGORIA                        │             │
│  │  Hambúrgueres:     R$ 15.200  (36%)          │             │
│  │  Combos:           R$ 18.500  (44%)          │             │
│  │  Bebidas:          R$  5.850  (14%)          │             │
│  │  Acompanhamentos:  R$  2.800   (6%)          │             │
│  └──────────────────────────────────────────────┘             │
│                                                                │
│  ┌──────────────────────────────────────────────┐             │
│  │  TOP 10 ITENS MAIS VENDIDOS                  │             │
│  │  1. Combo Clássico             312 vendas    │             │
│  │  2. Hambúrguer Bacon           189 vendas    │             │
│  │  3. Refrigerante 500ml         567 vendas    │             │
│  │  4. Batata Grande              145 vendas    │             │
│  │  5. Combo Família               98 vendas    │             │
│  │  ... (ver mais)                              │             │
│  └──────────────────────────────────────────────┘             │
│                                                                │
│  [Exportar PDF] [Exportar Excel] [Imprimir]                   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 5. Considerações de UX

### 5.1 Design Responsivo

**Kiosk (Totem 21" Touch):**
- Resolução: 1920x1080 (Full HD)
- Orientação: Portrait ou Landscape
- Touch targets: mínimo 80x80px (ideal: 100x100px)
- Font size: 18px+ (24px para títulos)

**Staff (Tablet 10"):**
- Resolução: 1280x800 ou similar
- Orientação: Landscape
- Touch targets: mínimo 60x60px
- Font size: 16px+

**Admin (Desktop):**
- Resolução: 1366x768 ou superior
- Mouse + teclado
- Tabelas densas permitidas
- Font size: 14px+

---

### 5.2 Estados de Interação

1. **Buttons:**
   - Default: cor primária
   - Hover: cor +10% saturação
   - Active: cor +20% saturação
   - Disabled: opacity 50%, cursor not-allowed

2. **Cards/Items:**
   - Default: borda sutil
   - Hover: sombra elevada
   - Selected: borda destacada (cor primária)

3. **Loading:**
   - Skeleton screens para conteúdo dinâmico
   - Spinner para ações (adicionar ao carrinho)
   - Progress bar para checkout

---

### 5.3 Feedback Visual

- **Sucesso**: verde (#10b981) + ✅
- **Erro**: vermelho (#ef4444) + ❌
- **Aviso**: amarelo (#f59e0b) + ⚠️
- **Info**: azul (#3b82f6) + ℹ️

**Toast Notifications:**
- Posição: top-right (desktop) ou top-center (mobile)
- Duração: 3-5 segundos
- Dismiss manual disponível

---

### 5.4 Acessibilidade

- **Contraste**: WCAG AA mínimo (4.5:1 para texto)
- **Navegação por teclado**: Tab order lógico
- **Screen readers**: aria-labels em ícones
- **Focus visible**: outline claro em elementos focados
- **Touch targets**: mínimo 44x44px (WCAG 2.1)

---

## 6. Navegação e Arquitetura de Rotas

### Frontend Routes

```
/                      → Redirect para /kiosk ou /staff (conforme config)
/kiosk                 → Splash Screen (Kiosk)
/kiosk/menu            → Categorias
/kiosk/menu/:category  → Itens da categoria
/kiosk/cart            → Carrinho
/kiosk/confirmation    → Confirmação do pedido

/staff/login           → Login Staff
/staff                 → Dashboard Staff (auth required)
/staff/orders          → Lista de pedidos
/staff/orders/:id      → Detalhes do pedido
/staff/new-order       → Novo pedido

/admin/login           → Login Admin
/admin                 → Dashboard Admin (auth required, role: admin)
/admin/menu            → Gerenciar cardápio
/admin/menu/:id        → Editar item
/admin/combos          → Gerenciar combos
/admin/combos/:id      → Editar combo
/admin/users           → Gerenciar usuários
/admin/reports         → Relatórios
/admin/settings        → Configurações

/404                   → Página não encontrada
```

---

## 7. Protótipos de Alta Fidelidade (Próximo Passo)

Após validação deste wireflow, criar protótipos no Figma com:
- Paleta de cores definida
- Tipografia escolhida
- Componentes shadcn/ui aplicados
- Fluxos interativos (clickable prototype)
- Variações de estado (hover, active, disabled)
