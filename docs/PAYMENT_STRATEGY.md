# Estratégia de Pagamento Futuro - Sistema de Pedidos

Observacao de contexto (16/03/2026): o projeto segue sem integracao de gateway no runtime atual. Este documento permanece como referencia de evolucao.

## 1. Visão Geral

O sistema atual (MVP) **não implementará integração de pagamento**, mas deve ser **arquitetado para facilitar integração futura** sem refatoração massiva.

### Princípios de Design

1. **Separação de responsabilidades**: Lógica de pagamento isolada em módulo próprio
2. **Interfaces abstratas**: Usar contratos (interfaces) que podem ser implementados por múltiplos gateways
3. **Estado de pedido independente**: Pedido existe independente do pagamento
4. **Auditoria completa**: Rastreabilidade de tentativas, sucessos e falhas

---

## 2. Arquitetura Preparada para Pagamento

### 2.1 Camadas de Abstração

```
┌─────────────────────────────────────────────────────┐
│              INTERFACE DO USUÁRIO                   │
│         (Kiosk, Staff, Admin)                       │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│          SERVICE LAYER (Pedidos)                    │
│   - createOrder()                                   │
│   - updateOrderStatus()                             │
│   - calculateTotal()                                │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│      PAYMENT SERVICE (Abstração)                    │
│   - processPayment()                                │
│   - refundPayment()                                 │
│   - checkPaymentStatus()                            │
└──────────────────┬──────────────────────────────────┘
                   │
         ┌─────────┴──────────┬──────────────┐
         ▼                    ▼              ▼
┌────────────────┐  ┌─────────────────┐  ┌──────────┐
│ Manual Payment │  │  PIX Provider   │  │  Card    │
│   (MVP)        │  │  (Futuro)       │  │ Gateway  │
└────────────────┘  └─────────────────┘  └──────────┘
```

---

## 3. Modelo de Dados (Preparação)

### 3.1 Entidade: Payment (Adicionar no Futuro)

```prisma
model Payment {
  id            Int       @id @default(autoincrement())
  orderId       Int       @unique
  order         Order     @relation(fields: [orderId], references: [id])

  // Valor
  amount        Decimal   @db.Decimal(10, 2)
  currency      String    @default("BRL")

  // Método e Status
  method        PaymentMethod
  status        PaymentStatus

  // Dados do Gateway
  gatewayProvider  String?  // "mercadopago", "pagseguro", "stripe", etc.
  gatewayTxId      String?  // Transaction ID do gateway
  gatewayResponse  Json?    // Resposta completa (opcional)

  // PIX (se aplicável)
  pixQrCode        String?
  pixQrCodeBase64  String?
  pixCopyPaste     String?

  // Cartão (se aplicável)
  cardLast4        String?
  cardBrand        String?  // "visa", "mastercard", etc.

  // Auditoria
  paidAt           DateTime?
  refundedAt       DateTime?
  failedAt         DateTime?
  errorMessage     String?

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([orderId])
  @@index([status])
  @@index([method])
}

enum PaymentMethod {
  CASH          // Dinheiro (manual)
  CREDIT_CARD   // Cartão de crédito
  DEBIT_CARD    // Cartão de débito
  PIX           // PIX
  VOUCHER       // Vale-refeição
  OTHER         // Outros
}

enum PaymentStatus {
  PENDING       // Aguardando pagamento
  PROCESSING    // Processando
  APPROVED      // Aprovado
  FAILED        // Falhou
  REFUNDED      // Reembolsado
  CANCELLED     // Cancelado
}
```

### 3.2 Relacionamento com Order

**Atualizar Order:**

```prisma
model Order {
  // ... campos existentes

  // Campo atual (MVP): apenas informacional
  paymentMethodInfo  String?  // "Dinheiro", "Cartão", etc.

  // Futuro: relação com Payment
  payment            Payment?

  // Campos auxiliares de pagamento
  isPaid             Boolean  @default(false)
  paidAt             DateTime?
}
```

---

## 4. Interfaces e Contratos (Backend)

### 4.1 Interface: IPaymentProvider

```typescript
// apps/server/src/modules/payment/interfaces/payment-provider.interface.ts

export interface PaymentRequest {
  orderId: number;
  amount: number;
  method: PaymentMethod;
  customer?: {
    name?: string;
    email?: string;
    document?: string;
  };
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  status: PaymentStatus;
  message?: string;
  pixData?: {
    qrCode: string;
    qrCodeBase64: string;
    copyPaste: string;
  };
  errorCode?: string;
}

export interface RefundRequest {
  paymentId: number;
  amount?: number; // partial refund
  reason?: string;
}

export interface RefundResponse {
  success: boolean;
  refundId?: string;
  message?: string;
}

export interface IPaymentProvider {
  /**
   * Processa um pagamento
   */
  processPayment(request: PaymentRequest): Promise<PaymentResponse>;

  /**
   * Verifica status de um pagamento
   */
  checkPaymentStatus(transactionId: string): Promise<PaymentStatus>;

  /**
   * Estorna um pagamento
   */
  refundPayment(request: RefundRequest): Promise<RefundResponse>;

  /**
   * Webhook handler (para notificações assíncronas)
   */
  handleWebhook?(payload: any): Promise<void>;
}
```

---

### 4.2 Implementação: ManualPaymentProvider (MVP)

```typescript
// apps/server/src/modules/payment/providers/manual-payment.provider.ts

export class ManualPaymentProvider implements IPaymentProvider {
  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    // No MVP, apenas registra o pagamento como "manual"
    // Assume que funcionário confirmou recebimento

    return {
      success: true,
      transactionId: `MANUAL_${Date.now()}`,
      status: PaymentStatus.APPROVED,
      message: 'Pagamento manual registrado com sucesso',
    };
  }

  async checkPaymentStatus(transactionId: string): Promise<PaymentStatus> {
    // Sempre retorna APPROVED para pagamentos manuais
    return PaymentStatus.APPROVED;
  }

  async refundPayment(request: RefundRequest): Promise<RefundResponse> {
    // Registra estorno manual (sem integração)
    return {
      success: true,
      refundId: `REFUND_${Date.now()}`,
      message: 'Estorno manual registrado',
    };
  }
}
```

---

### 4.3 Futura Implementação: PIXPaymentProvider

```typescript
// apps/server/src/modules/payment/providers/pix-payment.provider.ts

export class PIXPaymentProvider implements IPaymentProvider {
  private apiClient: MercadoPagoClient; // exemplo

  constructor(config: { apiKey: string; apiSecret: string }) {
    this.apiClient = new MercadoPagoClient(config);
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Gera QR Code PIX via gateway
      const pixResponse = await this.apiClient.createPixPayment({
        transaction_amount: request.amount,
        description: `Pedido #${request.orderId}`,
        payer: {
          email: request.customer?.email,
        },
      });

      return {
        success: true,
        transactionId: pixResponse.id,
        status: PaymentStatus.PENDING,
        pixData: {
          qrCode: pixResponse.qr_code,
          qrCodeBase64: pixResponse.qr_code_base64,
          copyPaste: pixResponse.qr_code,
        },
      };
    } catch (error) {
      return {
        success: false,
        status: PaymentStatus.FAILED,
        message: error.message,
        errorCode: error.code,
      };
    }
  }

  async checkPaymentStatus(transactionId: string): Promise<PaymentStatus> {
    const payment = await this.apiClient.getPayment(transactionId);
    return this.mapGatewayStatus(payment.status);
  }

  async refundPayment(request: RefundRequest): Promise<RefundResponse> {
    // Implementar lógica de estorno via gateway
    // ...
  }

  async handleWebhook(payload: any): Promise<void> {
    // Processa notificações do gateway (pagamento confirmado, etc.)
    const { action, data } = payload;

    if (action === 'payment.updated') {
      const paymentId = data.id;
      const newStatus = await this.checkPaymentStatus(paymentId);

      // Atualizar Payment no banco
      await this.updatePaymentStatus(paymentId, newStatus);

      // Se aprovado, atualizar Order
      if (newStatus === PaymentStatus.APPROVED) {
        await this.markOrderAsPaid(paymentId);
      }
    }
  }

  private mapGatewayStatus(gatewayStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      pending: PaymentStatus.PENDING,
      approved: PaymentStatus.APPROVED,
      rejected: PaymentStatus.FAILED,
      refunded: PaymentStatus.REFUNDED,
      cancelled: PaymentStatus.CANCELLED,
    };
    return statusMap[gatewayStatus] || PaymentStatus.PENDING;
  }
}
```

---

## 5. Payment Service (Orquestração)

```typescript
// apps/server/src/modules/payment/payment.service.ts

export class PaymentService {
  private providers: Map<string, IPaymentProvider> = new Map();

  constructor(private prisma: PrismaClient) {
    // Registrar providers disponíveis
    this.registerProvider('manual', new ManualPaymentProvider());

    // Futuramente:
    // this.registerProvider('pix', new PIXPaymentProvider(config));
    // this.registerProvider('card', new CardPaymentProvider(config));
  }

  registerProvider(name: string, provider: IPaymentProvider) {
    this.providers.set(name, provider);
  }

  async processPayment(
    orderId: number,
    method: PaymentMethod,
    providerName: string = 'manual',
  ): Promise<PaymentResponse> {
    // Buscar pedido
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Pedido não encontrado');
    }

    if (order.isPaid) {
      throw new Error('Pedido já foi pago');
    }

    // Selecionar provider
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider '${providerName}' não disponível`);
    }

    // Processar pagamento
    const result = await provider.processPayment({
      orderId,
      amount: Number(order.totalAmount),
      method,
      customer: {
        name: order.customerName || undefined,
      },
    });

    // Salvar Payment
    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        amount: order.totalAmount,
        method,
        status: result.status,
        gatewayProvider: providerName,
        gatewayTxId: result.transactionId,
        gatewayResponse: result as any,
        pixQrCode: result.pixData?.qrCode,
        pixQrCodeBase64: result.pixData?.qrCodeBase64,
        pixCopyPaste: result.pixData?.copyPaste,
        paidAt: result.status === PaymentStatus.APPROVED ? new Date() : null,
      },
    });

    // Se aprovado imediatamente, marcar pedido como pago
    if (result.status === PaymentStatus.APPROVED) {
      await this.markOrderAsPaid(orderId);
    }

    return result;
  }

  async markOrderAsPaid(orderId: number) {
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        isPaid: true,
        paidAt: new Date(),
        status: OrderStatus.CONFIRMED, // avança para próximo status
      },
    });

    // Registrar histórico de status
    await this.prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: OrderStatus.CONFIRMED,
        notes: 'Pagamento confirmado',
      },
    });
  }

  async checkPaymentStatus(paymentId: number): Promise<PaymentStatus> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment || !payment.gatewayTxId) {
      return PaymentStatus.PENDING;
    }

    const provider = this.providers.get(payment.gatewayProvider!);
    if (!provider) {
      return payment.status;
    }

    // Consultar status atualizado no gateway
    const newStatus = await provider.checkPaymentStatus(payment.gatewayTxId);

    // Atualizar banco se mudou
    if (newStatus !== payment.status) {
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: newStatus,
          paidAt: newStatus === PaymentStatus.APPROVED ? new Date() : payment.paidAt,
        },
      });

      if (newStatus === PaymentStatus.APPROVED) {
        await this.markOrderAsPaid(payment.orderId);
      }
    }

    return newStatus;
  }
}
```

---

## 6. Rotas API (Preparação)

### 6.1 Rotas Públicas (Kiosk)

```typescript
// POST /api/orders/:id/payment
// Iniciar pagamento para um pedido

interface InitPaymentRequest {
  method: 'CASH' | 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD';
  provider?: string; // default: 'manual'
}

interface InitPaymentResponse {
  success: boolean;
  payment: {
    id: number;
    status: string;
    method: string;
    amount: number;
    pixData?: {
      qrCode: string;
      qrCodeBase64: string;
      copyPaste: string;
    };
  };
}
```

```typescript
// GET /api/payments/:id/status
// Consultar status de um pagamento (para polling)

interface PaymentStatusResponse {
  paymentId: number;
  status: PaymentStatus;
  isPaid: boolean;
}
```

---

### 6.2 Webhooks (Notificações Assíncronas)

```typescript
// POST /api/webhooks/payment/:provider
// Recebe notificações do gateway de pagamento

// Exemplo: Mercado Pago notifica que PIX foi pago
// POST /api/webhooks/payment/mercadopago

async function handlePaymentWebhook(provider: string, payload: any) {
  const paymentProvider = paymentService.getProvider(provider);

  if (!paymentProvider || !paymentProvider.handleWebhook) {
    throw new Error('Provider não suporta webhooks');
  }

  await paymentProvider.handleWebhook(payload);

  return { success: true };
}
```

---

## 7. Frontend: Fluxo de Pagamento

### 7.1 MVP: Pagamento Manual (Informacional)

**Tela de Checkout (Kiosk):**

```tsx
function CheckoutScreen() {
  const { cart, total } = useCartStore();
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');

  const handleConfirmOrder = async () => {
    // Cria pedido sem integração de pagamento
    const order = await createOrder({
      items: cart,
      totalAmount: total,
      paymentMethodInfo: paymentMethod, // apenas informacional
    });

    // Exibe número do pedido
    navigate(`/kiosk/confirmation/${order.orderNumber}`);
  };

  return (
    <div>
      <h2>Forma de Pagamento</h2>
      <p>Informe ao atendente como deseja pagar:</p>

      <RadioGroup value={paymentMethod} onChange={setPaymentMethod}>
        <Radio value="CASH">💵 Dinheiro</Radio>
        <Radio value="CARD">💳 Cartão</Radio>
      </RadioGroup>

      <Button onClick={handleConfirmOrder}>Confirmar Pedido - R$ {total.toFixed(2)}</Button>
    </div>
  );
}
```

---

### 7.2 Futuro: Pagamento PIX

**Tela com QR Code:**

```tsx
function PixPaymentScreen({ orderId }: { orderId: number }) {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    // Iniciar pagamento PIX
    initPixPayment();
  }, []);

  useEffect(() => {
    if (!polling) return;

    // Polling a cada 3 segundos para verificar pagamento
    const interval = setInterval(async () => {
      const status = await checkPaymentStatus(payment.id);

      if (status === 'APPROVED') {
        setPolling(false);
        navigate(`/kiosk/confirmation/${orderId}`);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [polling, payment]);

  const initPixPayment = async () => {
    const result = await fetch(`/api/orders/${orderId}/payment`, {
      method: 'POST',
      body: JSON.stringify({
        method: 'PIX',
        provider: 'mercadopago',
      }),
    });

    const data = await result.json();
    setPayment(data.payment);
  };

  return (
    <div>
      <h2>Pagamento via PIX</h2>
      <p>Escaneie o QR Code para pagar:</p>

      {payment?.pixData && (
        <>
          <img src={payment.pixData.qrCodeBase64} alt="QR Code PIX" />
          <p>Ou copie o código:</p>
          <code>{payment.pixData.copyPaste}</code>
          <Button onClick={() => copyToClipboard(payment.pixData.copyPaste)}>Copiar Código</Button>
        </>
      )}

      <Spinner />
      <p>Aguardando confirmação do pagamento...</p>
    </div>
  );
}
```

---

## 8. Estratégia de Migração (MVP → Produção com Pagamento)

### Fase 1: MVP (Atual)

- ✅ Pedidos funcionam sem pagamento integrado
- ✅ Campo `paymentMethodInfo` apenas informacional
- ✅ Funcionário confirma recebimento manualmente

### Fase 2: Preparação da Infraestrutura

- 📋 Adicionar model `Payment` ao Prisma
- 📋 Criar migrations
- 📋 Implementar `IPaymentProvider` interface
- 📋 Implementar `ManualPaymentProvider`
- 📋 Criar rotas API básicas

### Fase 3: Integração PIX (Primeira Integração Real)

- 📋 Contratar gateway (Mercado Pago, PagSeguro, etc.)
- 📋 Implementar `PIXPaymentProvider`
- 📋 Adicionar fluxo de QR Code no frontend
- 📋 Implementar webhook handler
- 📋 Testar em sandbox
- 📋 Deploy em produção

### Fase 4: Integração Cartão

- 📋 Implementar `CardPaymentProvider`
- 📋 Adicionar formulário de cartão (ou terminal físico)
- 📋 Integrar com POS (se necessário)

### Fase 5: Múltiplas Formas de Pagamento

- 📋 Permitir pagamento parcial (ex: metade dinheiro, metade cartão)
- 📋 Vouchers/vale-refeição
- 📋 Wallet (PicPay, Ame, etc.)

---

## 9. Gateways Recomendados para Brasil

### Comparativo

| Gateway          | PIX | Cartão | Boleto | Taxa Aprox.     | Suporte   | Webhook |
| ---------------- | --- | ------ | ------ | --------------- | --------- | ------- |
| **Mercado Pago** | ✅  | ✅     | ✅     | 3,99% - 4,99%   | Bom       | ✅      |
| **PagSeguro**    | ✅  | ✅     | ✅     | 3,99% - 5,49%   | Médio     | ✅      |
| **Asaas**        | ✅  | ✅     | ✅     | 1,99% - 3,99%   | Excelente | ✅      |
| **Stripe**       | ❌  | ✅     | ❌     | 3,99% + R$ 0,39 | Excelente | ✅      |
| **Pagar.me**     | ✅  | ✅     | ✅     | 3,99% - 4,99%   | Bom       | ✅      |

**Recomendação:**

- **MVP sem internet**: Nenhum gateway (manual apenas)
- **Fase internet local + PIX**: **Asaas** (menor taxa, ótima API) ou **Mercado Pago** (mais conhecido)
- **Fase cartão**: Depende se terá terminal físico (Stone, Cielo) ou web-based

---

## 10. Segurança e Compliance

### 10.1 PCI-DSS (Cartões)

Se implementar pagamento com cartão via web:

- **NUNCA** armazenar dados de cartão completo
- Usar tokenização do gateway
- SSL/TLS obrigatório (HTTPS)
- Recomendado: iframe do gateway (hosted payment page)

### 10.2 LGPD

- Armazenar apenas dados necessários
- Anonimizar/mascarar dados sensíveis em logs
- Política de retenção de dados (ex: apagar pagamentos após 5 anos)

### 10.3 Auditoria

- Logar todas as transações (sucesso e falha)
- Rastrear usuário que processou pagamento (staff)
- Alertas para transações suspeitas (valor muito alto, múltiplas tentativas)

---

## 11. Testes (Preparação)

### 11.1 Testes Unitários

```typescript
describe('PaymentService', () => {
  it('should process manual payment successfully', async () => {
    const result = await paymentService.processPayment(
      orderId: 1,
      method: PaymentMethod.CASH,
      provider: 'manual'
    );

    expect(result.success).toBe(true);
    expect(result.status).toBe(PaymentStatus.APPROVED);
  });

  it('should fail if order is already paid', async () => {
    // ... test
  });
});
```

### 11.2 Testes de Integração

```typescript
describe('PIX Payment Flow', () => {
  it('should generate QR code and wait for payment', async () => {
    // Mock gateway API
    mockGatewayResponse({
      qr_code: 'mock_qr_code',
      qr_code_base64: 'data:image/png;base64,...'
    });

    const result = await paymentService.processPayment(...);

    expect(result.pixData).toBeDefined();
    expect(result.status).toBe(PaymentStatus.PENDING);
  });

  it('should update order when webhook confirms payment', async () => {
    // ... test webhook
  });
});
```

---

## 12. Checklist de Preparação

**Backend:**

- [ ] Criar interface `IPaymentProvider`
- [ ] Implementar `ManualPaymentProvider`
- [ ] Criar `PaymentService` com orquestração
- [ ] Adicionar `Payment` model no Prisma (comentado)
- [ ] Preparar migrations (sem aplicar)
- [ ] Documentar fluxo de webhook

**Frontend:**

- [ ] Criar componentes base (PaymentMethodSelector, PaymentSummary)
- [ ] Preparar estado de pagamento no store
- [ ] Tela de QR Code PIX (hidden/feature flag)
- [ ] Polling service para status

**Infraestrutura:**

- [ ] Documentar requisitos de gateway
- [ ] Planejar custos de transação
- [ ] Definir fluxo de testes (sandbox)
- [ ] Preparar domínio para webhook (ex: https://pedidos.restaurante.com.br/webhooks/payment)

**Segurança:**

- [ ] SSL/TLS configurado
- [ ] Secrets management (API keys)
- [ ] Rate limiting em rotas de pagamento
- [ ] Logs de auditoria

---

## 13. Conclusão

Esta estratégia garante que o MVP seja **simples e funcional** (sem pagamento integrado), mas o código está **pronto para evoluir** sem reescrita quando chegar a hora de integrar gateways reais.

**Vantagens da Abordagem:**

- ✅ MVP mais rápido de desenvolver
- ✅ Validação do negócio sem custo de gateway
- ✅ Arquitetura extensível e testável
- ✅ Facilita trocar de gateway no futuro
- ✅ Reduz débito técnico

**Próximos Passos Pós-MVP:**

1. Operar manualmente por 2-4 semanas
2. Coletar feedback sobre fluxo de pagamento ideal
3. Decidir qual método integrar primeiro (PIX recomendado)
4. Contratar gateway e implementar provider específico
5. Testar em sandbox
6. Deploy gradual (A/B testing ou feature flag)
