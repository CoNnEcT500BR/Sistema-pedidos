import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/auth.store';

type StaffMode = 'classic' | 'touch';
const STAFF_MODE_STORAGE_KEY = 'staff.mode.v1';

function getStaffPathByMode(mode: StaffMode): string {
  return mode === 'touch' ? '/staff/touch' : '/staff/classic';
}

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<StaffMode>(() => {
    const stored = localStorage.getItem(STAFF_MODE_STORAGE_KEY);
    return stored === 'touch' ? 'touch' : 'classic';
  });
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });

  useEffect(() => {
    if (isAuthenticated) {
      navigate(getStaffPathByMode(mode), { replace: true });
    }
  }, [isAuthenticated, mode, navigate]);

  function validate() {
    const errors = { email: '', password: '' };
    if (!email.trim()) errors.email = 'Email obrigatório.';
    if (!password) errors.password = 'Senha obrigatória.';
    setFieldErrors(errors);
    return !errors.email && !errors.password;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    if (!validate()) return;
    try {
      await login(email.trim(), password);
      localStorage.setItem(STAFF_MODE_STORAGE_KEY, mode);
      navigate(getStaffPathByMode(mode), { replace: true });
    } catch {
      // error is set in the store
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🍔</div>
          <h1 className="text-2xl font-bold text-gray-900">Área dos Funcionários</h1>
          <p className="text-gray-500 text-sm mt-1">Faça login para continuar</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border text-base focus:outline-none focus:ring-2 focus:ring-primary-500
                ${fieldErrors.email ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'}`}
              placeholder="seu@email.com"
            />
            {fieldErrors.email && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border text-base focus:outline-none focus:ring-2 focus:ring-primary-500
                ${fieldErrors.password ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'}`}
              placeholder="••••••••"
            />
            {fieldErrors.password && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
            )}
          </div>

          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">Tela de atendimento</p>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setMode('classic')}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors
                  ${mode === 'classic' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Completa
              </button>
              <button
                type="button"
                onClick={() => setMode('touch')}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors
                  ${mode === 'touch' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Touch
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-500 hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed
              text-white font-semibold py-3 rounded-xl text-base transition-colors mt-2"
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
