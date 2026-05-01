import { api } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

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

export class AuthService {
  /**
   * Authenticate user with Google idToken
   * Sends idToken to backend /auth/google, receives JWT and user data
   */
  static async loginWithGoogle(idToken: string): Promise<{ user: User; token: string }> {
    try {
      const response = await api.post<AuthResponse>('/auth/google', { idToken });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Authentication failed');
      }

      const { user, token } = response.data.data;

      // Store token securely
      await AsyncStorage.setItem(TOKEN_KEY, token);

      // Store user data (non-sensitive, can be in secure store or async storage)
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

      return { user, token };
    } catch (error: any) {
      console.error('Google login error:', error);
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

      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

      return { user, token };
    } catch (error: any) {
      console.error('Registration error:', error);
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

      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

      return { user, token };
    } catch (error: any) {
      console.error('Email login error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
    }
  }

  /**
   * Logout user by clearing stored token and user data
   */
  static async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  /**
   * Get stored token (for checking auth state)
   */
  static async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  }

  /**
   * Get stored user data
   */
  static async getStoredUser(): Promise<User | null> {
    try {
      const userJson = await AsyncStorage.getItem(USER_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error retrieving user:', error);
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
      console.error('Forgot password error:', error);
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

      await AsyncStorage.setItem(TOKEN_KEY, newToken);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

      return { user, token: newToken };
    } catch (error: any) {
      console.error('Reset password error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Reset failed');
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
