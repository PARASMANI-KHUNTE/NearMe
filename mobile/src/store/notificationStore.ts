import { create } from 'zustand';
import { socketService, SocketNotification, RawFriendRequestSocketPayload } from '../services/socketService';
import { NotificationService } from '../services/notificationService';

type AppNotification = SocketNotification & { read: boolean };

const normalizeFriendRequestNotification = (
  payload: SocketNotification | RawFriendRequestSocketPayload
): SocketNotification => {
  if ('content' in payload && 'createdAt' in payload) {
    return payload;
  }

  return {
    _id: payload.id,
    type: 'friend_request',
    content: `${payload.from?.name || 'Someone'} sent you a friend request`,
    metadata: payload.from ? { from: payload.from } : undefined,
    senderId: payload.from?.id,
    createdAt: new Date().toISOString(),
  };
};

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  hasInitializedSocketListeners: boolean;

  // Actions
  fetchNotifications: () => Promise<void>;
  addNotification: (notification: SocketNotification) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => void;
  initializeSocketListeners: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  hasInitializedSocketListeners: false,

  fetchNotifications: async () => {
    try {
      set({ isLoading: true });
      const data = await NotificationService.getNotifications();
      const mapped = data.map(n => ({
        ...n,
        read: n.read || false
      })) as AppNotification[];
      
      set({ 
        notifications: mapped,
        unreadCount: mapped.filter(n => !n.read).length,
        isLoading: false
      });
    } catch (err) {
      console.error('Fetch notifications error:', err);
      set({ isLoading: false });
    }
  },

  addNotification: (notification: SocketNotification) => {
    set((state) => ({
      notifications: [{ ...notification, read: false }, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));

    console.log('New notification:', notification.content);
  },

  markAsRead: async (id: string) => {
    const original = get().notifications;
    // Optimistic
    set((state) => {
      const updated = state.notifications.map(n =>
        n._id === id ? { ...n, read: true } : n
      );
      return {
        notifications: updated,
        unreadCount: updated.filter(n => !n.read).length,
      };
    });

    try {
      await NotificationService.markAsRead(id);
    } catch (err) {
      set({ notifications: original, unreadCount: original.filter(n => !n.read).length });
    }
  },

  markAllAsRead: async () => {
    const original = get().notifications;
    // Optimistic
    set((state) => {
      const updated = state.notifications.map(n => ({ ...n, read: true }));
      return {
        notifications: updated,
        unreadCount: 0,
      };
    });

    try {
      await NotificationService.markAllAsRead();
    } catch (err) {
      set({ notifications: original, unreadCount: original.filter(n => !n.read).length });
    }
  },

  clearNotifications: () => {
    socketService.clearSubscriptions();
    set({ notifications: [], unreadCount: 0, hasInitializedSocketListeners: false });
  },

  initializeSocketListeners: () => {
    if (get().hasInitializedSocketListeners) {
      return;
    }

    // Subscribe to socket events
    const genericHandler = (data: unknown) => {
      get().addNotification(data as SocketNotification);
    };
    const friendRequestHandler = (data: unknown) => {
      get().addNotification(
        normalizeFriendRequestNotification(data as SocketNotification | RawFriendRequestSocketPayload)
      );
    };

    socketService.subscribe('proximity_alert', genericHandler);
    socketService.subscribe('friend_request', friendRequestHandler);
    socketService.subscribe('meet_request', genericHandler);
    set({ hasInitializedSocketListeners: true });
  },
}));
