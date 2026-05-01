import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

interface UserSettings {
  radius?: number;
  locationSharingEnabled?: boolean;
  invisibleMode?: boolean;
}

interface AppState {
  user: User | null;
  token: string | null;
  friends: Friend[];
  notifications: Notification[];
  radius: number;
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
  syncPreferences: (settings?: UserSettings | null) => void;
  toggleThemeMode: () => void;
  logout: () => void;
}

// Simple AsyncStorage wrapper
const storage = {
  getItem: async (name: string) => {
    try {
      return await AsyncStorage.getItem(name);
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

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      friends: [],
      notifications: [],
      radius: 5000, // Default 5km
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
      syncPreferences: (settings) => set((state) => ({
        radius: settings?.radius ?? state.radius,
        shareLocation: settings?.locationSharingEnabled ?? state.shareLocation,
        invisibleMode: settings?.invisibleMode ?? state.invisibleMode,
      })),
      toggleThemeMode: () => set((state) => ({
        themeMode: state.themeMode === 'night' ? 'day' : 'night',
      })),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => storage),
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
