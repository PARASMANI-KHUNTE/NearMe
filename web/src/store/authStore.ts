import { create } from 'zustand';
import type { AuthState, User } from '../types';

export const useAuthStore = create<AuthState>((set) => ({
  token: sessionStorage.getItem('token') || null,
  user: JSON.parse(sessionStorage.getItem('user') || 'null') as User | null,
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
