import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackKioskEvent } from '@/features/telemetry/telemetry.service';

const INACTIVITY_TIMEOUT_MS = 120_000; // 2 minutos

export function SplashScreen() {
  const navigate = useNavigate();

  function startOrder() {
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
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 px-8"
      onClick={startOrder}
      onKeyDown={(e) => e.key === 'Enter' && startOrder()}
      role="button"
      tabIndex={0}
      aria-label="Toque para fazer pedido"
    >
      {/* Logo / Marca */}
      <div className="mb-10 flex flex-col items-center gap-4">
        <div className="flex h-32 w-32 items-center justify-center rounded-3xl bg-primary-500 shadow-xl">
          <span className="text-7xl" role="img" aria-label="restaurante">🍔</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-gray-900">Sistema de Pedidos</h1>
        <p className="text-xl text-gray-500">Peça agora, rápido e fácil</p>
      </div>

      {/* CTA principal */}
      <div className="animate-pulse rounded-3xl bg-primary-500 px-10 py-7 shadow-2xl">
        <span className="text-2xl font-black tracking-wide text-white">
          TOQUE AQUI PARA PEDIR
        </span>
      </div>

      <p className="mt-8 text-sm text-gray-400">Toque em qualquer lugar para começar</p>
    </div>
  );
}
