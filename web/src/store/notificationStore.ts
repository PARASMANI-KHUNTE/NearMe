import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { NotificationState } from '../types';

interface NotificationStore extends NotificationState {
  muteNotifications: boolean;
  setMuteNotifications: (muted: boolean) => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      notifications: [],
      muteNotifications: false,

      setNotifications: (notifications) => set({ notifications }),
      addNotification: (notification) => set((state) => ({
        notifications: [notification, ...state.notifications]
      })),
      markAsRead: (id) => set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
      })),
      setMuteNotifications: (muteNotifications) => set({ muteNotifications }),
    }),
    { name: 'notification-storage' }
  )
);