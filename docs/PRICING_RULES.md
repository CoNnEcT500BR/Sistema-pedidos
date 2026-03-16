# Regras de Precificacao - Estado Atual

Atualizado em 16/03/2026 com base no comportamento do backend.

## 1. Principios Atuais

- O total do pedido e calculado no backend, nunca confiando no total enviado pelo cliente.
- Precos de itens e addons sao salvos como snapshot no pedido (itemPrice e addonPrice).
- Mudancas futuras no cardapio nao alteram pedidos ja criados.

## 2. Formula Base

Total bruto do pedido:
- soma de (itemPrice * quantity) de cada OrderItem
- mais soma de (addonPrice * quantity) de cada OrderItemAddon

Total final:
- finalPrice = totalPrice - discount
- no estado atual, discount existe no modelo e default e 0

## 3. Regras por tipo de adicional

Tipos suportados:
- EXTRA
- SUBSTITUTION
- REMOVAL
- SIZE_CHANGE

Comportamento esperado:
- EXTRA: normalmente aumenta preco
- SUBSTITUTION: pode ser zero ou ajuste positivo/negativo conforme cadastro
- REMOVAL: normalmente zero
- SIZE_CHANGE: usado para aumento/diminuicao de tamanho em bebida/acompanhamento

## 4. Compatibilidade de addons no dominio

- A aplicacao de addon depende de permissao em MenuItemAddon.
- Regras de escopo sao validadas no backend.
- BURGER_BUILD bloqueia EXTRA e SIZE_CHANGE.
- SIZE_CHANGE e direcionado para DRINK, SIDE e COMBO.

## 5. Precisao monetaria atual

- O schema atual usa Float para valores monetarios.
- Isso atende ao MVP, mas existe risco teorico de arredondamento em cenarios extremos.

Recomendacao futura:
- Migrar para Decimal (ou centavos inteiros) em uma fase de hardening.

## 6. Cobertura de validacao

- Scripts E2E validam calculo de total em fluxos criticos.
- Script dedicado de SIZE_CHANGE valida valores esperados para bebida e batata.

## 7. Referencias de codigo

- apps/server/src/modules/orders/orders.calculator.ts
- apps/server/src/modules/orders/orders.service.ts
- apps/server/prisma/schema.prisma
