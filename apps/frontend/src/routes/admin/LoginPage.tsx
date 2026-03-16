import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { LanguageToggle } from '@/components/LanguageToggle';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useI18n } from '@/i18n';

export function LoginPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { login, logout, user, isAuthenticated, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [roleError, setRoleError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;

    if (user?.role === 'ADMIN') {
      navigate('/admin/dashboard', { replace: true });
      return;
    }

    navigate('/staff/classic', { replace: true });
  }, [isAuthenticated, navigate, user?.role]);

  function validate() {
    const next = { email: '', password: '' };
    if (!email.trim()) next.email = t('Email obrigatório.');
    if (!password) next.password = t('Senha obrigatória.');
    setFieldErrors(next);
    return !next.email && !next.password;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    clearError();
    setRoleError('');

    if (!validate()) return;

    try {
      await login(email.trim(), password);
      const currentUser = useAuthStore.getState().user;
      if (currentUser?.role !== 'ADMIN') {
        logout();
        setRoleError(t('Esta área é exclusiva para administradores.'));
        return;
      }

      navigate('/admin/dashboard', { replace: true });
    } catch {
      return;
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.14),_transparent_32%),linear-gradient(180deg,#fff7ed_0%,#fff 55%)] px-4 py-10">
      <LanguageToggle className="fixed right-4 top-4 z-[120] inline-flex rounded-xl border border-amber-200 bg-white/95 p-1 shadow-md backdrop-blur" />

      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center gap-10 lg:grid lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden lg:block">
          <div className="max-w-xl space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full border border-amber-200 bg-white/90 px-4 py-2 text-sm font-semibold text-amber-900 shadow-sm">
              <ShieldCheck size={18} />
              {t('Painel administrativo')}
            </div>
            <div className="space-y-4">
              <h1 className="text-5xl font-black tracking-tight text-stone-900">
                {t('Controle operação, cardápio e equipe em um único lugar.')}
              </h1>
              <p className="max-w-lg text-lg leading-8 text-stone-600">
                {t('Acesse indicadores, organize o catálogo e mantenha o atendimento alinhado com o ritmo da operação.')}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-stone-200 bg-white/90 p-5 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">{t('Visão do dia')}</p>
                <p className="mt-3 text-3xl font-bold text-stone-900">{t('Pedidos, vendas e gargalos')}</p>
              </div>
              <div className="rounded-3xl border border-stone-200 bg-stone-900 p-5 text-white shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">{t('Ações rápidas')}</p>
                <p className="mt-3 text-3xl font-bold">{t('Editar cardápio sem sair da operação')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full rounded-[2rem] border border-stone-200 bg-white/95 p-8 shadow-[0_30px_80px_rgba(28,25,23,0.12)] backdrop-blur">
          <div className="mb-8 text-center lg:text-left">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-100 text-amber-700 lg:mx-0">
              <ShieldCheck size={28} />
            </div>
            <h2 className="text-3xl font-black tracking-tight text-stone-900">{t('Entrar no Admin')}</h2>
            <p className="mt-2 text-sm text-stone-500">{t('Use uma conta com permissão de administrador para continuar.')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="admin-email" className="mb-1 block text-sm font-medium text-stone-700">
                {t('Email')}
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t('seu@email.com')}
                className={`w-full rounded-2xl border px-4 py-3 text-base text-stone-900 outline-none transition focus:ring-2 focus:ring-amber-400 ${
                  fieldErrors.email ? 'border-red-400 focus:border-red-400' : 'border-stone-300'
                }`}
              />
              {fieldErrors.email ? <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p> : null}
            </div>

            <div>
              <label htmlFor="admin-password" className="mb-1 block text-sm font-medium text-stone-700">
                {t('Senha')}
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className={`w-full rounded-2xl border px-4 py-3 text-base text-stone-900 outline-none transition focus:ring-2 focus:ring-amber-400 ${
                  fieldErrors.password ? 'border-red-400 focus:border-red-400' : 'border-stone-300'
                }`}
              />
              {fieldErrors.password ? <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p> : null}
            </div>

            {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
            {roleError ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{roleError}</div> : null}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-2xl bg-stone-900 px-4 py-3 text-base font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? t('Entrando...') : t('Entrar no Admin')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
