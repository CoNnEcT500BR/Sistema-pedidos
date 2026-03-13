import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService, type AuthUser } from '../services/auth.service';
import { translateStatic } from '@/i18n';

interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await authService.login(email, password);
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch {
          authService.logout();
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: translateStatic('Email ou senha inválidos.'),
          });
          throw new Error('Login failed');
        }
      },

      logout: () => {
        authService.logout();
        set({ user: null, token: null, isAuthenticated: false, error: null });
      },

      checkAuth: async () => {
        const token = authService.getToken();
        if (!token) {
          set({ isAuthenticated: false, user: null, token: null });
          return;
        }
        try {
          const user = await authService.me();
          set({ user, token, isAuthenticated: true });
        } catch {
          authService.logout();
          set({ user: null, token: null, isAuthenticated: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'staff-auth-v1',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
