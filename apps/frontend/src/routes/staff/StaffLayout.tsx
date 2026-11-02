import { LogOut, ReceiptText, User } from 'lucide-react';
import { useEffect, useRef } from 'react';
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
  const mainRef = useRef<HTMLElement>(null);
  const previousPathRef = useRef(location.pathname);

  useEffect(() => {
    if (previousPathRef.current !== location.pathname) {
      mainRef.current?.focus();
      previousPathRef.current = location.pathname;
    }
  }, [location.pathname]);

  function handleLogout() {
    logout();
    navigate('/staff/login', { replace: true });
  }

  function handleNavigateMode(mode: 'classic' | 'touch') {
    localStorage.setItem(STAFF_MODE_STORAGE_KEY, mode);
    navigate(mode === 'touch' ? '/staff/touch' : '/staff/classic');
  }

  return (
    <div className={`flex min-h-dvh min-w-0 flex-col overflow-x-hidden bg-stone-100 ${isTouchMode ? 'xl:h-dvh xl:overflow-hidden' : ''}`}>
      <header className="shrink-0 border-b border-stone-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1800px] flex-wrap items-center justify-between gap-3 px-3 py-3 sm:gap-4 sm:px-5 sm:py-4 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-primary-800 sm:h-12 sm:w-12">
              <ReceiptText size={20} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              {isTouchMode ? (
                <h1 className="truncate text-base font-bold text-stone-900 sm:text-lg">
                  {t('Registrar pedido (Touch)')}
                </h1>
              ) : (
                <p className="truncate text-base font-bold text-stone-900 sm:text-lg">
                  {t('Registrar pedido')}
                </p>
              )}
              <p className="hidden text-sm text-stone-600 sm:block">
                {isTouchMode
                  ? t('Tela sem rolagem com etapas de itens e pagamento')
                  : t('Balcão e confirmação de pagamento')}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 lg:gap-3">
            <LanguageToggle className="inline-flex rounded-xl border border-stone-200 bg-stone-50 p-1" />

            <div className="inline-flex rounded-xl border border-stone-200 bg-stone-50 p-1">
              <button
                type="button"
                onClick={() => handleNavigateMode('classic')}
                aria-pressed={!isTouchMode}
                className={`touch-target rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors sm:px-3 lg:text-sm ${!isTouchMode ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-700 hover:text-stone-900'}`}
              >
                {t('Completa')}
              </button>
              <button
                type="button"
                onClick={() => handleNavigateMode('touch')}
                aria-pressed={isTouchMode}
                className={`touch-target rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors sm:px-3 lg:text-sm ${isTouchMode ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-700 hover:text-stone-900'}`}
              >
                {t('Touch')}
              </button>
            </div>

            <div className="hidden max-w-48 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2 md:flex md:items-center md:gap-3">
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
              type="button"
              aria-label={t('Sair da conta')}
              className="touch-target inline-flex items-center gap-2 rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-semibold text-stone-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 sm:px-4"
            >
              <LogOut size={16} aria-hidden="true" />
              <span className="hidden sm:inline">{t('Sair da conta')}</span>
            </button>
          </div>
        </div>
      </header>

      <main
        ref={mainRef}
        id="staff-main"
        tabIndex={-1}
        className={`min-h-0 flex-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-900 ${isTouchMode ? 'xl:overflow-hidden' : ''}`}
      >
        <Outlet />
      </main>
    </div>
  );
}
