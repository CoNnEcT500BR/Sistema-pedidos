import { apiClient } from '@/services/api.service';

export interface AuthUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
  name?: string | null;
}

interface LoginResponse {
  user: AuthUser;
  token: string;
}

interface ApiResponse<T> {
  data?: T;
  user?: AuthUser;
  token?: string;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await apiClient.post<LoginResponse>('/api/auth/login', { email, password });
    const { user, token } = res.data;
    localStorage.setItem('auth_token', token);
    return { user, token };
  },

  async me(): Promise<AuthUser> {
    const res = await apiClient.get<ApiResponse<AuthUser>>('/api/auth/me');
    // Backend returns { user: {...} } directly
    const payload = res.data as unknown as { user: AuthUser };
    return payload.user;
  },

  logout(): void {
    localStorage.removeItem('auth_token');
  },

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },
};
