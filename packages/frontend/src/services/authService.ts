import { api } from './api';
import { AuthResponse, LoginCredentials, User } from '@restaurant-reservation/shared';

export const authService = {
  async login(credentials: LoginCredentials): Promise<{ data: AuthResponse }> {
    const response = await api.post<{ success: boolean; data: AuthResponse }>(
      '/api/v1/auth/login',
      credentials
    );
    return { data: response.data.data };
  },

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }): Promise<{ data: AuthResponse }> {
    const response = await api.post<{ success: boolean; data: AuthResponse }>(
      '/api/v1/auth/register',
      data
    );
    return { data: response.data.data };
  },

  async getCurrentUser(): Promise<{ data: User }> {
    const response = await api.get<{ success: boolean; data: User }>('/api/v1/users/me');
    return { data: response.data.data };
  },

  async logout(): Promise<void> {
    await api.post('/api/v1/auth/logout');
    localStorage.removeItem('token');
  },
};

