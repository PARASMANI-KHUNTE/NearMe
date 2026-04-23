import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Friend {
  id: string;
  name: string;
  status: 'offline' | 'nearby';
}

interface Notification {
  id: string;
  message: string;
  read: boolean;
}

type ThemeMode = 'day' | 'night';

interface AppState {
  user: User | null;
  token: string | null;
  friends: Friend[];
  notifications: Notification[];
  radius: number; // in meters (500, 1000, 2000)
  shareLocation: boolean;
  invisibleMode: boolean;
  themeMode: ThemeMode;

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setFriends: (friends: Friend[]) => void;
  setNotifications: (notifications: Notification[]) => void;
  setRadius: (radius: number) => void;
  setShareLocation: (share: boolean) => void;
  setInvisibleMode: (invisible: boolean) => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
  logout: () => void;
}

// Custom storage for SecureStore
const secureStorage = {
  getItem: async (name: string) => {
    if (Platform.OS === 'web') {
      const value = localStorage.getItem(name);
      return value ? JSON.parse(value) : null;
    }
    const value = await SecureStore.getItemAsync(name);
    return value ? JSON.parse(value) : null;
  },
  setItem: async (name: string, value: any) => {
    if (Platform.OS === 'web') {
      localStorage.setItem(name, JSON.stringify(value));
    } else {
      await SecureStore.setItemAsync(name, JSON.stringify(value));
    }
  },
  removeItem: async (name: string) => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(name);
    } else {
      await SecureStore.deleteItemAsync(name);
    }
  },
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      friends: [],
      notifications: [],
      radius: 1000, // Default 1km
      shareLocation: true,
      invisibleMode: false,
      themeMode: 'night',

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setFriends: (friends) => set({ friends }),
      setNotifications: (notifications) => set({ notifications }),
      setRadius: (radius) => set({ radius }),
      setShareLocation: (share) => set({ shareLocation: share }),
      setInvisibleMode: (invisible) => set({ invisibleMode: invisible }),
      setThemeMode: (mode) => set({ themeMode: mode }),
      toggleThemeMode: () => set((state) => ({
        themeMode: state.themeMode === 'night' ? 'day' : 'night',
      })),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => secureStorage),
      // Persist all except friends and notifications (they can be loaded on demand)
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        radius: state.radius,
        shareLocation: state.shareLocation,
        invisibleMode: state.invisibleMode,
        themeMode: state.themeMode,
      }),
    }
  )
);
