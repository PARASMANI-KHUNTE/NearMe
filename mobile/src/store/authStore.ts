import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthService } from '../services/authService';
import { useNotificationStore } from './notificationStore';
import { logger } from '../utils/logger';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (idToken: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (data: { email: string; password: string; name: string }) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
}

// AsyncStorage - works without native build
const storage = {
  getItem: async (name: string) => {
    try {
      const value = await AsyncStorage.getItem(name);
      return value;
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string) => {
    try {
      await AsyncStorage.setItem(name, value);
    } catch (e) {
      logger.warn('[Storage] setItem failed:', name);
    }
  },
  removeItem: async (name: string) => {
    try {
      await AsyncStorage.removeItem(name);
    } catch {
      logger.warn('[Storage] removeItem failed:', name);
    }
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (idToken: string) => {
        logger.debug('[AuthStore] login start');
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await AuthService.loginWithGoogle(idToken);
          logger.info('[AuthStore] login success', { hasUser: !!user, hasToken: !!token });
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.message || 'Login failed',
          });
          logger.warn('[AuthStore] login failed', error?.message || error);
          throw error;
        }
      },

      loginWithEmail: async (email: string, password: string) => {
        logger.debug('[AuthStore] email login start', { email });
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await AuthService.login(email, password);
          logger.info('[AuthStore] email login success', { hasUser: !!user, hasToken: !!token });
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.message || 'Login failed',
          });
          logger.warn('[AuthStore] email login failed', error?.message || error);
          throw error;
        }
      },

      registerWithEmail: async (data: { email: string; password: string; name: string }) => {
        logger.debug('[AuthStore] register start', { email: data.email });
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await AuthService.register(data);
          logger.info('[AuthStore] register success', { hasUser: !!user, hasToken: !!token });
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.message || 'Registration failed',
          });
          logger.warn('[AuthStore] register failed', error?.message || error);
          throw error;
        }
      },

      logout: async () => {
        logger.debug('[AuthStore] logout start');
        set({ isLoading: true });
        try {
          await AuthService.logout();
          useNotificationStore.getState().clearNotifications();
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
          logger.info('[AuthStore] logout success');
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Logout failed',
          });
          logger.warn('[AuthStore] logout failed', error?.message || error);
        }
      },

      setUser: (user) => set({ user }),

      clearError: () => set({ error: null }),

      checkAuth: async () => {
        logger.debug('[AuthStore] checkAuth start');
        set({ isLoading: true });
        try {
          const token = await AuthService.getStoredToken();
          const user = await AuthService.getStoredUser();
          logger.debug('[Auth] checkAuth - token:', !!token, 'user:', !!user);

          if (token && user) {
            const verifiedUser = await AuthService.verifyToken();
            if (verifiedUser) {
              logger.info('[AuthStore] checkAuth verified with server');
              set({
                user: verifiedUser,
                token,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });
            } else {
              logger.info('[AuthStore] checkAuth token invalid, clearing auth');
              await AuthService.logout();
              set({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
              });
            }
          } else {
            logger.info('[AuthStore] checkAuth unauthenticated path');
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error: any) {
          logger.error('[AuthStore] checkAuth failed', error?.message || error);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.message || 'Auth check failed',
          });
        }
      },

      forgotPassword: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          await AuthService.forgotPassword(email);
          set({ isLoading: false });
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },

      resetPassword: async (token: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token: newToken } = await AuthService.resetPassword(token, password);
          set({
            user,
            token: newToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => storage),
      // Only persist token/user, not isAuthenticated (derive from presence of token)
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
);
