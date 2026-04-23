import { api, type ApiResponse } from './api';
import { useAuthStore } from '../store/authStore';

interface GoogleAuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    picture?: string;
  };
  token: string;
}

export const authService = {
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
      console.error('Logout error:', error);
    } finally {
      useAuthStore.getState().logout();
    }
  },

  // Check if token is valid
  async verifyToken(): Promise<boolean> {
    try {
      const response = await api.get<ApiResponse>('/api/users/profile');
      return response.data.success;
    } catch {
      return false;
    }
  },
};

export default authService;