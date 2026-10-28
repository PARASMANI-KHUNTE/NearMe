import { create } from 'zustand';
import type { AuthState, User } from '../types';

const safeParseUser = (): User | null => {
  try {
    const raw = sessionStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    sessionStorage.removeItem('user');
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  token: sessionStorage.getItem('token') || null,
  user: safeParseUser(),
  isAuthenticated: !!sessionStorage.getItem('token'),

  setToken: (token) => {
    if (token) {
      sessionStorage.setItem('token', token);
      set({ token, isAuthenticated: true });
    } else {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      set({ token: null, isAuthenticated: false, user: null });
    }
  },

  setUser: (user) => {
    if (user) {
      sessionStorage.setItem('user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('user');
    }
    set({ user });
  },

  logout: () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
