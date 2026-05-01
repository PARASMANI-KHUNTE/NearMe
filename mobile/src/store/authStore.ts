import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthService } from '../services/authService';

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
      console.log('[Storage] setItem failed:', name);
    }
  },
  removeItem: async (name: string) => {
    try {
      await AsyncStorage.removeItem(name);
    } catch {
      console.log('[Storage] removeItem failed:', name);
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
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await AuthService.loginWithGoogle(idToken);
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
          throw error;
        }
      },

      loginWithEmail: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await AuthService.login(email, password);
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
          throw error;
        }
      },

      registerWithEmail: async (data: { email: string; password: string; name: string }) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await AuthService.register(data);
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
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await AuthService.logout();
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Logout failed',
          });
        }
      },

      setUser: (user) => set({ user }),

      clearError: () => set({ error: null }),

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const token = await AuthService.getStoredToken();
          const user = await AuthService.getStoredUser();

          console.log('[Auth] checkAuth - token:', !!token, 'user:', !!user);

          if (token && user) {
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error: any) {
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
        token: state.token,
      }),
    }
  )
);
