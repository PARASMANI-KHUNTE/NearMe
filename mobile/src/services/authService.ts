import { api } from './api';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import {
  clearStoredAuth,
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
} from './authStorage';

export interface User {
  id: string;
  _id?: string;
  googleId?: string;
  email: string;
  name: string;
  picture?: string;
  settings: {
    radius: number;
    locationSharingEnabled: boolean;
    invisibleMode?: boolean;
  };
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
  message: string;
}

const getApiUrl = (path: string): string => {
  const baseUrl = env.API_BASE_URL.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
};

const parseJsonResponse = async <T>(response: Response): Promise<T> => {
  const text = await response.text();

  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Invalid JSON response from server (${response.status})`);
  }
};

const postGoogleLoginWithFetch = async (idToken: string): Promise<AuthResponse> => {
  const url = getApiUrl('/auth/google');

  logger.info('[AuthService] loginWithGoogle fetch request', {
    url,
    hasIdToken: !!idToken,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ idToken }),
  });

  const data = await parseJsonResponse<AuthResponse>(response);

  logger.info('[AuthService] loginWithGoogle fetch response', {
    status: response.status,
    success: data.success,
  });

  if (!response.ok || !data.success) {
    throw new Error(data.message || `Google login failed (${response.status})`);
  }

  return data;
};

export class AuthService {
  /**
   * Authenticate user with Google idToken
   * Sends idToken to backend /auth/google, receives JWT and user data
   */
  static async loginWithGoogle(idToken: string): Promise<{ user: User; token: string }> {
    try {
      logger.info('[AuthService] loginWithGoogle request', {
        apiBaseUrl: env.API_BASE_URL,
        hasIdToken: !!idToken,
      });

      const response = await postGoogleLoginWithFetch(idToken);

      if (!response.success) {
        throw new Error(response.message || 'Authentication failed');
      }

      const { user, token } = response.data;

      // Store token securely
      await setStoredToken(token);

      // Store user data (non-sensitive, can be in secure store or async storage)
      await setStoredUser(user);

      return { user, token };
    } catch (error: any) {
      logger.error('Google login error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
    }
  }

  /**
   * Register with email and password
   */
  static async register(data: { email: string; password: string; name: string }): Promise<{ user: User; token: string }> {
    try {
      const response = await api.post<AuthResponse>('/auth/register', data);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Registration failed');
      }

      const { user, token } = response.data.data;

      await setStoredToken(token);
      await setStoredUser(user);

      return { user, token };
    } catch (error: any) {
      logger.error('Registration error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Registration failed');
    }
  }

  /**
   * Login with email and password
   */
  static async login(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      const response = await api.post<AuthResponse>('/auth/login', { email, password });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Authentication failed');
      }

      const { user, token } = response.data.data;

      await setStoredToken(token);
      await setStoredUser(user);

      return { user, token };
    } catch (error: any) {
      logger.error('Email login error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
    }
  }

  /**
   * Logout user by clearing stored token and user data
   */
  static async logout(): Promise<void> {
    try {
      await clearStoredAuth();
    } catch (error) {
      logger.error('Logout error:', error);
    }
  }

  /**
   * Get stored token (for checking auth state)
   */
  static async getStoredToken(): Promise<string | null> {
    try {
      return await getStoredToken();
    } catch (error) {
      logger.error('Error retrieving token:', error);
      return null;
    }
  }

  /**
   * Get stored user data
   */
  static async getStoredUser(): Promise<User | null> {
    try {
      return await getStoredUser();
    } catch (error) {
      logger.error('Error retrieving user:', error);
      return null;
    }
  }

  /**
   * Request password reset token
   */
  static async forgotPassword(email: string): Promise<void> {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      if (!response.data.success) {
        throw new Error(response.data.message || 'Request failed');
      }
    } catch (error: any) {
      logger.error('Forgot password error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Request failed');
    }
  }

/**
    * Reset password with token
    */
  static async resetPassword(token: string, password: string): Promise<{ user: User; token: string }> {
    try {
      const response = await api.post<AuthResponse>('/auth/reset-password', { token, password });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Reset failed');
      }

      const { user, token: newToken } = response.data.data;

      await setStoredToken(newToken);
      await setStoredUser(user);

      return { user, token: newToken };
    } catch (error: any) {
      logger.error('Reset password error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Reset failed');
    }
  }

  /**
   * Verify token with server
   */
  static async verifyToken(): Promise<User | null> {
    try {
      const response = await api.get('/users/me');
      if (!response.data.success) {
        return null;
      }
      return response.data.data;
    } catch {
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    const token = await this.getStoredToken();
    return !!token;
  }
}
