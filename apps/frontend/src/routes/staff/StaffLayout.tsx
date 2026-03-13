import { LogOut, ReceiptText, User } from 'lucide-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useI18n } from '@/i18n';

const STAFF_MODE_STORAGE_KEY = 'staff.mode.v1';

export function StaffLayout() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const isTouchMode = location.pathname.startsWith('/staff/touch');

  function handleLogout() {
    logout();
    navigate('/staff/login', { replace: true });
  }

  function handleNavigateMode(mode: 'classic' | 'touch') {
    localStorage.setItem(STAFF_MODE_STORAGE_KEY, mode);
    navigate(mode === 'touch' ? '/staff/touch' : '/staff/classic');
  }

  return (
    <div className="flex h-screen flex-col bg-stone-100 overflow-hidden">
      <header className="border-b border-stone-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
              <ReceiptText size={22} />
            </div>
            <div>
              <p className="text-lg font-bold text-stone-900">
                {isTouchMode ? t('Registrar pedido (Touch)') : t('Registrar pedido')}
              </p>
              <p className="text-sm text-stone-600">
                {isTouchMode
                  ? t('Tela sem rolagem com etapas de itens e pagamento')
                  : t('Balcão e confirmação de pagamento')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-3">
            <LanguageToggle className="inline-flex rounded-xl border border-stone-200 bg-stone-50 p-1" />

            <div className="inline-flex rounded-xl border border-stone-200 bg-stone-50 p-1">
              <button
                type="button"
                onClick={() => handleNavigateMode('classic')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors lg:text-sm ${!isTouchMode ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
              >
                {t('Completa')}
              </button>
              <button
                type="button"
                onClick={() => handleNavigateMode('touch')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors lg:text-sm ${isTouchMode ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
              >
                {t('Touch')}
              </button>
            </div>

            <div className="hidden rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2 sm:flex sm:items-center sm:gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 shrink-0">
                <User size={17} className="text-primary-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-stone-900 truncate">
                  {user?.name ?? user?.email ?? t('Atendente')}
                </p>
                <p className="text-xs text-stone-600 truncate">{t('Sessão ativa')}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700 transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            >
              <LogOut size={16} />
              {t('Sair da conta')}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
