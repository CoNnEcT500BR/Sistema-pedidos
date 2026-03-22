import {
  BarChart3,
  Bike,
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
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

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
  { to: '/admin/combos', label: 'Combos', icon: Package2 },
  { to: '/admin/orders', label: 'Pedidos', icon: ListOrdered },
  { to: '/admin/delivery', label: 'Delivery', icon: Bike },
  { to: '/admin/users', label: 'Equipe', icon: Users },
  { to: '/admin/audit', label: 'Auditoria', icon: ClipboardList },
  { to: '/admin/reports', label: 'Relatórios', icon: BarChart3 },
] as const;

export function AdminLayout() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user, logout } = useAuthStore();
  const { isEnabled } = useFeatureFlags('ADMIN');
  const realtimeStatus = useRealtimeConnectionStatus();

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
    <div className="min-h-screen bg-stone-100 text-stone-900 lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="border-b border-stone-200 bg-white lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3 px-5 py-5 lg:flex-col lg:items-stretch lg:px-6 lg:py-7">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">{t('Admin')}</p>
              <p className="text-lg font-bold text-stone-900">{t('Central de Operações')}</p>
            </div>
          </div>
          <LanguageToggle className="inline-flex rounded-xl border border-stone-200 bg-stone-50 p-1" />
        </div>

        <nav className="grid gap-1 px-3 pb-4 lg:px-4">
          {visibleNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-stone-900 text-white shadow-sm'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`
                }
              >
                <Icon size={18} />
                {t(item.label)}
              </NavLink>
            );
          })}
        </nav>

        <div className="mx-4 mb-5 rounded-3xl border border-stone-200 bg-stone-50 p-4">
          <p className="text-sm font-semibold text-stone-900">{user?.name ?? user?.email ?? t('Administrador')}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-stone-500">{t('Sessão ativa')}</p>
          <div
            className={`mt-4 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${realtimeBadge.wrapperClass}`}
            title={t('Status da conexão em tempo real do painel administrativo')}
          >
            <span className={`h-2 w-2 rounded-full ${realtimeBadge.dotClass}`} />
            {realtimeBadge.label}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={16} />
            {t('Sair da conta')}
          </button>
        </div>
      </aside>

      <main className="min-h-screen bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,245,244,0.92))]">
        <Outlet />
      </main>
    </div>
  );
}
