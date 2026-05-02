import { api, type ApiResponse } from './api';
import { useAuthStore } from '../store/authStore';
import { logger } from '../utils/logger';

interface GoogleAuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    picture?: string;
  };
  token: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

export const authService = {
  async register(data: RegisterRequest): Promise<GoogleAuthResponse> {
    const response = await api.post<ApiResponse<GoogleAuthResponse>>('/api/auth/register', data);

    if (response.data.success && response.data.data) {
      const { token, user } = response.data.data;
      useAuthStore.getState().setToken(token);
      useAuthStore.getState().setUser(user);
      return { token, user };
    }

    throw new Error(response.data.message || 'Registration failed');
  },

  async login(data: LoginRequest): Promise<GoogleAuthResponse> {
    const response = await api.post<ApiResponse<GoogleAuthResponse>>('/api/auth/login', data);

    if (response.data.success && response.data.data) {
      const { token, user } = response.data.data;
      useAuthStore.getState().setToken(token);
      useAuthStore.getState().setUser(user);
      return { token, user };
    }

    throw new Error(response.data.message || 'Login failed');
  },

  async loginWithGoogle(idToken: string): Promise<GoogleAuthResponse> {
    const response = await api.post<ApiResponse<GoogleAuthResponse>>('/api/auth/google', { idToken });

    if (response.data.success && response.data.data) {
      const { token, user } = response.data.data;

      // Store auth data
      useAuthStore.getState().setToken(token);
      useAuthStore.getState().setUser(user);

      return { token, user };
    }

    throw new Error(response.data.message || 'Login failed');
  },

  async logout(): Promise<void> {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      logger.error('Logout error:', error);
    } finally {
      useAuthStore.getState().logout();
    }
  },

  async verifyToken(): Promise<boolean> {
    try {
      const response = await api.get<ApiResponse>('/api/users/profile');
      return response.data.success;
    } catch {
      return false;
    }
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await api.post<ApiResponse<{ message: string }>>('/api/auth/forgot-password', { email });

    if (response.data.success) {
      return { message: response.data.message || 'If an account exists, a reset token has been sent.' };
    }

    throw new Error(response.data.message || 'Request failed');
  },

  async resetPassword(token: string, password: string): Promise<GoogleAuthResponse> {
    const response = await api.post<ApiResponse<GoogleAuthResponse>>('/api/auth/reset-password', { token, password });

    if (response.data.success && response.data.data) {
      const { token: newToken, user } = response.data.data;
      useAuthStore.getState().setToken(newToken);
      useAuthStore.getState().setUser(user);
      return { token: newToken, user };
    }

    throw new Error(response.data.message || 'Password reset failed');
  },
};

export default authService;
