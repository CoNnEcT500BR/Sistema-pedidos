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
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 px-4 py-8 sm:px-8">
      {/* Logo / Marca */}
      <div className="mb-8 flex flex-col items-center gap-3 text-center sm:mb-10 sm:gap-4">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary-600 shadow-xl sm:h-32 sm:w-32">
          <span className="text-6xl sm:text-7xl" role="img" aria-label="restaurante">🍔</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">{t('Sistema de Pedidos')}</h1>
        <p className="text-lg text-gray-700 sm:text-xl">{t('Peça agora, rápido e fácil')}</p>
      </div>

      <div className="w-full max-w-xl rounded-3xl border border-gray-200 bg-white p-3 shadow-2xl">
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setSelectedLanguage('pt');
              setLanguage('pt');
            }}
            aria-pressed={selectedLanguage === 'pt'}
            className={`touch-target rounded-2xl border px-5 py-4 text-left transition-colors ${selectedLanguage === 'pt' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Idioma</p>
            <p className="mt-1 text-lg font-black text-gray-900 sm:text-xl">Português</p>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedLanguage('en');
              setLanguage('en');
            }}
            aria-pressed={selectedLanguage === 'en'}
            className={`touch-target rounded-2xl border px-5 py-4 text-left transition-colors ${selectedLanguage === 'en' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Language</p>
            <p className="mt-1 text-lg font-black text-gray-900 sm:text-xl">English</p>
          </button>
        </div>

        <button
          type="button"
          onClick={startOrder}
          className="touch-target mt-3 w-full rounded-2xl bg-primary-700 px-6 py-4 text-center text-lg font-bold text-white transition-colors hover:bg-primary-800"
        >
          {t('Começar pedido')}
        </button>
      </div>

      <p className="mt-8 text-sm text-gray-700">{t('Escolha o idioma para continuar')}</p>
    </div>
  );
}
