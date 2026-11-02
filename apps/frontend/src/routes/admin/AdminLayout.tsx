import {
  BarChart3,
  Bike,
  Boxes,
  BookOpenText,
  ClipboardList,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Package2,
  ShieldCheck,
  Shapes,
  Users,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { LanguageToggle } from '@/components/LanguageToggle';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useRealtimeConnectionStatus } from '@/hooks/useRealtimeConnectionStatus';
import { useI18n } from '@/i18n';

const navigation = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/menu', label: 'Cardápio', icon: BookOpenText },
  { to: '/admin/categories', label: 'Categorias', icon: Shapes },
  { to: '/admin/ingredients', label: 'Ingredientes', icon: Shapes },
  { to: '/admin/inventory', label: 'Estoque', icon: Boxes },
  { to: '/admin/combos', label: 'Combos', icon: Package2 },
  { to: '/admin/orders', label: 'Pedidos', icon: ListOrdered },
  { to: '/admin/delivery', label: 'Delivery', icon: Bike },
  { to: '/admin/users', label: 'Equipe', icon: Users },
  { to: '/admin/audit', label: 'Auditoria', icon: ClipboardList },
  { to: '/admin/reports', label: 'Relatórios', icon: BarChart3 },
] as const;

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const previousPathRef = useRef(location.pathname);
  const { t } = useI18n();
  const { user, logout } = useAuthStore();
  const { isEnabled } = useFeatureFlags('ADMIN');
  const realtimeStatus = useRealtimeConnectionStatus();

  useEffect(() => {
    if (previousPathRef.current !== location.pathname) {
      mainRef.current?.focus();
      previousPathRef.current = location.pathname;
    }
  }, [location.pathname]);

  const visibleNavigation = navigation.filter((item) => {
    if (item.to === '/admin/delivery') {
      return isEnabled('admin.delivery.v1', true);
    }

    return true;
  });

  const realtimeBadge =
    realtimeStatus === 'connected'
      ? {
          dotClass: 'bg-emerald-500',
          label: t('Tempo real conectado'),
          wrapperClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        }
      : realtimeStatus === 'reconnecting'
        ? {
            dotClass: 'bg-amber-500 animate-pulse',
            label: t('Reconectando tempo real'),
            wrapperClass: 'border-amber-200 bg-amber-50 text-amber-700',
          }
        : {
            dotClass: 'bg-stone-400',
            label: t('Tempo real desconectado'),
            wrapperClass: 'border-stone-200 bg-white text-stone-600',
          };

  function handleLogout() {
    logout();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="min-h-dvh min-w-0 bg-stone-100 text-stone-900 xl:grid xl:grid-cols-[17rem_minmax(0,1fr)]">
      <a
        href="#admin-main"
        className="sr-only z-50 rounded-lg bg-white px-4 py-3 font-semibold text-stone-900 focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:ring-2 focus:ring-amber-700"
      >
        {t('Pular para o conteúdo principal')}
      </a>
      <aside className="min-w-0 border-b border-stone-200 bg-white xl:sticky xl:top-0 xl:h-dvh xl:overflow-y-auto xl:border-b-0 xl:border-r">
        <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-5 sm:py-4 xl:flex-col xl:items-stretch xl:px-6 xl:py-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 sm:h-12 sm:w-12">
              <ShieldCheck size={22} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">{t('Admin')}</p>
              <p className="truncate text-base font-bold text-stone-900 sm:text-lg">{t('Central de Operações')}</p>
            </div>
          </div>
          <LanguageToggle className="inline-flex shrink-0 rounded-xl border border-stone-200 bg-stone-50 p-1" />
        </div>

        <nav
          aria-label={t('Navegação administrativa')}
          className="grid grid-cols-2 gap-1.5 px-3 pb-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-1 xl:gap-1 xl:px-4 xl:pb-4"
        >
          {visibleNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `touch-target flex min-w-0 items-center gap-2 rounded-xl px-2.5 py-2.5 text-xs font-semibold leading-tight transition sm:gap-3 sm:px-3 sm:text-sm xl:rounded-2xl xl:px-4 xl:py-3 ${
                    isActive
                      ? 'bg-stone-900 text-white shadow-sm'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`
                }
              >
                <Icon size={18} className="shrink-0" aria-hidden="true" />
                <span className="min-w-0 truncate">{t(item.label)}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="mx-3 mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-3 sm:mx-4 xl:mb-5 xl:flex-col xl:items-stretch xl:rounded-3xl xl:p-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-stone-900">{user?.name ?? user?.email ?? t('Administrador')}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-stone-500">{t('Sessão ativa')}</p>
          </div>
          <div
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${realtimeBadge.wrapperClass} xl:mt-4`}
            title={t('Status da conexão em tempo real do painel administrativo')}
            role="status"
            aria-live="polite"
          >
            <span className={`h-2 w-2 shrink-0 rounded-full ${realtimeBadge.dotClass}`} aria-hidden="true" />
            {realtimeBadge.label}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="touch-target inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 xl:mt-4 xl:w-full xl:rounded-2xl xl:px-4"
          >
            <LogOut size={16} aria-hidden="true" />
            <span>{t('Sair da conta')}</span>
          </button>
        </div>
      </aside>

      <main
        id="admin-main"
        ref={mainRef}
        tabIndex={-1}
        className="min-h-[60dvh] min-w-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,245,244,0.92))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-800 xl:min-h-dvh"
      >
        <Outlet />
      </main>
    </div>
  );
}
