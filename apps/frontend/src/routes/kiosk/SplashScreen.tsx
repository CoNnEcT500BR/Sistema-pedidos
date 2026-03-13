import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackKioskEvent } from '@/features/telemetry/telemetry.service';
import { useI18n } from '@/i18n';

const INACTIVITY_TIMEOUT_MS = 120_000; // 2 minutos

export function SplashScreen() {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useI18n();
  const [selectedLanguage, setSelectedLanguage] = useState<'pt' | 'en'>(language);

  function startOrder() {
    setLanguage(selectedLanguage);
    trackKioskEvent('new_order_started');
    navigate('/kiosk/menu');
  }

  // Reinicializa o timer a cada interação
  useEffect(() => {
    trackKioskEvent('screen_view', { screen: 'splash' });

    let timer: ReturnType<typeof setTimeout>;

    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        // Já estamos na splash; não faz nada
      }, INACTIVITY_TIMEOUT_MS);
    };

    reset();
    window.addEventListener('pointerdown', reset);
    window.addEventListener('keydown', reset);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', reset);
      window.removeEventListener('keydown', reset);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 px-8">
      {/* Logo / Marca */}
      <div className="mb-10 flex flex-col items-center gap-4">
        <div className="flex h-32 w-32 items-center justify-center rounded-3xl bg-primary-500 shadow-xl">
          <span className="text-7xl" role="img" aria-label="restaurante">🍔</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-gray-900">{t('Sistema de Pedidos')}</h1>
        <p className="text-xl text-gray-500">{t('Peça agora, rápido e fácil')}</p>
      </div>

      <div className="w-full max-w-xl rounded-3xl border border-gray-200 bg-white p-3 shadow-2xl">
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setSelectedLanguage('pt');
              setLanguage('pt');
            }}
            className={`rounded-2xl border px-5 py-4 text-left transition-colors ${selectedLanguage === 'pt' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Idioma</p>
            <p className="mt-1 text-xl font-black text-gray-900">Portugues</p>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedLanguage('en');
              setLanguage('en');
            }}
            className={`rounded-2xl border px-5 py-4 text-left transition-colors ${selectedLanguage === 'en' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Language</p>
            <p className="mt-1 text-xl font-black text-gray-900">English</p>
          </button>
        </div>

        <button
          type="button"
          onClick={startOrder}
          className="mt-3 w-full rounded-2xl bg-primary-500 px-6 py-4 text-center text-lg font-bold text-white transition-colors hover:bg-primary-600"
        >
          {t('Começar pedido')}
        </button>
      </div>

      <p className="mt-8 text-sm text-gray-400">{t('Escolha o idioma para continuar')}</p>
    </div>
  );
}
