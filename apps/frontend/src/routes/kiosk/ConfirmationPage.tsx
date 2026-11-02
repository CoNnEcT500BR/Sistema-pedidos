import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { trackKioskEvent } from '@/features/telemetry/telemetry.service';
import { useI18n } from '@/i18n';

const AUTO_REDIRECT_MS = 30_000; // 30s

interface ConfirmationState {
  fulfillmentType?: 'PICKUP' | 'DELIVERY';
  paymentMethod?: string;
  finalPrice?: number;
  deliveryZoneName?: string | null;
}

export function ConfirmationPage() {
  const { t } = useI18n();
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const confirmationState = location.state as ConfirmationState | null;
  const isDelivery = confirmationState?.fulfillmentType === 'DELIVERY';
  const [autoRedirectEnabled, setAutoRedirectEnabled] = useState(true);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const paymentLabel =
    confirmationState?.paymentMethod === 'CASH_ON_DELIVERY'
      ? t('Dinheiro')
      : confirmationState?.paymentMethod === 'CARD_ON_DELIVERY'
        ? t('Cartão na entrega')
        : confirmationState?.paymentMethod === 'PIX_ON_DELIVERY'
          ? t('Pix na entrega')
          : t('Pagamento no balcão');
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    trackKioskEvent('screen_view', { screen: 'confirmation', orderNumber });
    headingRef.current?.focus();
  }, [orderNumber]);

  useEffect(() => {
    if (!isDelivery && autoRedirectEnabled) {
      timerRef.current = setTimeout(() => {
        navigate('/kiosk');
      }, AUTO_REDIRECT_MS);
    }
    return () => clearTimeout(timerRef.current);
  }, [autoRedirectEnabled, isDelivery, navigate]);

  function handleNewOrder() {
    clearTimeout(timerRef.current);
    navigate('/kiosk');
  }

  function handleStayOnConfirmation() {
    clearTimeout(timerRef.current);
    setAutoRedirectEnabled(false);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-6 text-center">
      {/* Ícone de sucesso */}
      <div className="mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-accent-700 shadow-xl">
        <span className="text-6xl text-white">✓</span>
      </div>

      {/* Número do pedido */}
      <h1
        ref={headingRef}
        tabIndex={-1}
        aria-label={
          orderNumber
            ? t('Pedido realizado com sucesso! Número do pedido {number}.', { number: orderNumber })
            : t('Pedido realizado com sucesso!')
        }
        className="mb-2 rounded text-2xl font-bold text-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-700 focus:ring-offset-2"
      >
        {t('Pedido realizado com sucesso!')}
      </h1>
      <p className="mb-6 text-base text-gray-700">
        {isDelivery
          ? t('Pedido de delivery recebido. Guarde o número para referência e aguarde nosso contato.')
          : t('Anote seu número e aguarde a chamada')}
      </p>

      <div className="mb-8 flex flex-col items-center rounded-3xl bg-white px-12 py-8 shadow-2xl">
        <span className="text-sm font-semibold uppercase tracking-widest text-gray-600">
          {t('Número do Pedido')}
        </span>
        <span className="mt-1 text-8xl font-black tabular-nums text-primary-600">
          {orderNumber}
        </span>
      </div>

      {isDelivery ? (
        <div className="mb-10 space-y-2 text-base font-semibold text-gray-700">
          <p>{t('Entrega própria para')}: {confirmationState?.deliveryZoneName}</p>
          <p>{t('Pagamento no recebimento')}: {paymentLabel}</p>
          {confirmationState?.finalPrice !== undefined && (
            <p>{t('Total')}: R$ {confirmationState.finalPrice.toFixed(2).replace('.', ',')}</p>
          )}
        </div>
      ) : (
        <p className="mb-10 text-lg font-semibold text-gray-600">
          {t('Aguarde a chamada do seu número no painel')}
        </p>
      )}

      <button
        onClick={handleNewOrder}
        className="touch-target rounded-2xl bg-primary-700 px-10 py-5 text-xl font-bold text-white shadow-lg transition hover:bg-primary-800 active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-700"
      >
        {t('Fazer Novo Pedido')}
      </button>

      {!isDelivery && autoRedirectEnabled && (
        <div className="mt-4 flex flex-col items-center gap-2">
          <p className="text-sm text-gray-700">{t('A tela retornará ao início automaticamente.')}</p>
          <button
            type="button"
            onClick={handleStayOnConfirmation}
            className="min-h-11 rounded-xl border border-gray-500 px-4 py-2 text-sm font-semibold text-gray-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-gray-700"
          >
            {t('Permanecer nesta tela')}
          </button>
        </div>
      )}
    </div>
  );
}
