import { create } from 'zustand';
import { socketService, SocketNotification } from '../services/socketService';

type AppNotification = SocketNotification & { read: boolean };

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;

  // Actions
  addNotification: (notification: SocketNotification) => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
  initializeSocketListeners: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification: SocketNotification) => {
    set((state) => ({
      notifications: [{ ...notification, read: false }, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));

    // Optional: Show local notification or alert
    // You can integrate with expo-notifications here
    console.log('New notification:', notification.content);
  },

  markAsRead: (id: string) => {
    set((state) => {
      const updatedNotifications = state.notifications.map(n =>
        n._id === id ? { ...n, read: true } : n
      );
      const newUnreadCount = updatedNotifications.filter(n => !n.read).length;
      return {
        notifications: updatedNotifications,
        unreadCount: newUnreadCount,
      };
    });
  },

  clearNotifications: () => {
    set({ notifications: [], unreadCount: 0 });
  },

  initializeSocketListeners: () => {
    // Subscribe to socket events
    socketService.subscribe('proximity_alert', (data: SocketNotification) => {
      get().addNotification(data);
    });

    socketService.subscribe('friend_request', (data: SocketNotification) => {
      get().addNotification(data);
    });

    socketService.subscribe('meet_request', (data: SocketNotification) => {
      get().addNotification(data);
    });
  },
}));
