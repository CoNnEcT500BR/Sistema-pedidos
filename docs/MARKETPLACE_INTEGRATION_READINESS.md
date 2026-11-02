# Preparacao para marketplaces: iFood e 99Food

## Estado atual

O sistema ainda nao esta conectado ao iFood nem ao 99Food. Nao ha chamadas de API, webhooks, credenciais ou sincronizacao de catalogo ativos. O delivery proprio e independente dessas plataformas.

Os pedidos agora reservam `salesChannel` (com `INTERNAL` como origem padrao) e `externalOrderId`. A combinacao desses campos e unica, permitindo que a futura importacao trate reenvios do mesmo pedido sem duplicar a venda.

## Requisitos para iniciar a integracao

Antes de habilitar qualquer conector, obter e validar:

- conta de parceiro/loja habilitada em cada plataforma e acesso aos respectivos ambientes de homologacao;
- documentacao oficial vigente, credenciais, identificadores da loja e regras de renovacao de tokens;
- decisoes sobre catalogo, precos, disponibilidade, adicionais, cancelamento e origem autoritativa de cada dado;
- definicao de quem entrega cada pedido: equipe propria ou logistica da plataforma;
- regras de aceite, timeout, reprocessamento e conciliacao de pedidos.

## Desenho de implementacao

Cada plataforma deve ter um adaptador isolado no backend que converta os eventos oficiais para o modelo interno de pedido. O adaptador nao deve ser implementado antes de conferir os contratos oficiais de autenticacao, assinatura, eventos e estados.

Requisitos minimos do futuro fluxo:

1. Manter segredos somente no servidor ou em um cofre de segredos; nunca retornar credenciais ao frontend.
2. Verificar assinatura e proteger contra repeticao nos webhooks usando o contrato oficial de cada plataforma.
3. Deduplicar por `salesChannel` e `externalOrderId`, e tornar cada evento idempotente.
4. Mapear produtos, adicionais, precos, estoque, cancelamentos e estados sem confiar em valores enviados pelo cliente.
5. Registrar resultado e tentativas sem persistir payloads sensiveis desnecessarios; permitir retry seguro e reconciliacao.
6. Separar entregas realizadas pela plataforma das entregas atribuidas aos entregadores proprios.
7. Testar em homologacao antes de liberar o conector para pedidos reais.

## Proximo passo

Com as contas e o acesso oficial disponiveis, validar os contratos de iFood e 99Food separadamente, definir o mapeamento do catalogo e implementar primeiro o recebimento idempotente de pedidos em homologacao. Ate la, as referencias de marketplace no modelo sao apenas preparacao e nao indicam integracao ativa.
