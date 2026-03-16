import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { trackKioskEvent } from '@/features/telemetry/telemetry.service';
import { useI18n } from '@/i18n';

const AUTO_REDIRECT_MS = 30_000; // 30s

export function ConfirmationPage() {
  const { t } = useI18n();
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    trackKioskEvent('screen_view', { screen: 'confirmation', orderNumber });

    timerRef.current = setTimeout(() => {
      navigate('/kiosk');
    }, AUTO_REDIRECT_MS);
    return () => clearTimeout(timerRef.current);
  }, [navigate, orderNumber]);

  function handleNewOrder() {
    clearTimeout(timerRef.current);
    navigate('/kiosk');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-6 text-center">
      {/* Ícone de sucesso */}
      <div className="mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-accent-500 shadow-xl">
        <span className="text-6xl text-white">✓</span>
      </div>

      {/* Número do pedido */}
      <h1 className="mb-2 text-2xl font-bold text-gray-700">{t('Pedido realizado com sucesso!')}</h1>
      <p className="mb-6 text-base text-gray-500">{t('Anote seu número e aguarde a chamada')}</p>

      <div className="mb-8 flex flex-col items-center rounded-3xl bg-white px-12 py-8 shadow-2xl">
        <span className="text-sm font-semibold uppercase tracking-widest text-gray-400">
          {t('Número do Pedido')}
        </span>
        <span className="mt-1 text-8xl font-black tabular-nums text-primary-600">
          {orderNumber}
        </span>
      </div>

      <p className="mb-10 text-lg font-semibold text-gray-600">
        {t('Aguarde a chamada do seu número no painel')}
      </p>

      <button
        onClick={handleNewOrder}
        className="rounded-2xl bg-primary-500 px-10 py-5 text-xl font-bold text-white shadow-lg transition hover:bg-primary-600 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-300"
      >
        {t('Fazer Novo Pedido')}
      </button>

      <p className="mt-6 text-sm text-gray-400">
        {t('Redirecionando automaticamente em {seconds}s...', {
          seconds: AUTO_REDIRECT_MS / 1000,
        })}
      </p>
    </div>
  );
}
