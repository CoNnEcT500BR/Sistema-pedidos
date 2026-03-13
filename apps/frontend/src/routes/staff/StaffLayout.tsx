import { LogOut, ReceiptText, User } from 'lucide-react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/auth.store';

export function StaffLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  function handleLogout() {
    logout();
    navigate('/staff/login', { replace: true });
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
              <p className="text-lg font-bold text-stone-900">Registrar pedido</p>
              <p className="text-sm text-stone-600">Balcão e confirmação de pagamento</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2 sm:flex sm:items-center sm:gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 shrink-0">
                <User size={17} className="text-primary-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-stone-900 truncate">
                  {user?.name ?? user?.email ?? 'Atendente'}
                </p>
                <p className="text-xs text-stone-600 truncate">Sessão ativa</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700 transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            >
              <LogOut size={16} />
              Sair da conta
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
