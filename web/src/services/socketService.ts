import { io, Socket } from 'socket.io-client';
import { env } from '../config/env';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useFriendStore } from '../store/friendStore';
import { logger } from '../utils/logger';

type SocketCallback = (data: unknown) => void;
type FriendRequestSocketPayload = {
  _id?: string;
  id?: string;
  type?: string;
  content?: string;
  metadata?: {
    requestId?: string;
    from?: { id?: string; _id?: string; name?: string; picture?: string };
  };
  senderId?: string;
  createdAt?: string;
};

let socket: Socket | null = null;
const eventListeners = new Map<string, Set<SocketCallback>>();

export const socketService = {
  connect(): void {
    const token = useAuthStore.getState().token;
    if (!token || socket?.connected) return;

    socket = io(env.socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    socket.on('connect', () => {
      logger.info('Socket connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      logger.info('Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      logger.error('Socket connection error:', error.message);
    });

    // Real-time events
    socket.on('proximity_alert', (data: {
      id?: string;
      _id?: string;
      friendId: string;
      friendName?: string;
      message?: string;
      content?: string;
      distance?: number;
      createdAt?: string;
    }) => {
      logger.info('Proximity alert:', data);

      useNotificationStore.getState().addNotification({
        id: data.id || data._id || `proximity-${Date.now()}`,
        type: 'proximity_alert',
        message: data.content || data.message || `${data.friendName || 'A friend'} is nearby`,
        read: false,
        createdAt: data.createdAt || new Date().toISOString(),
      });

      // Notify listeners
      this.emitLocal('proximity_alert', data);
    });

    socket.on('friend_request', (data: FriendRequestSocketPayload) => {
      logger.info('Friend request received:', data);

      const metadata = data.metadata || {};
      const from = metadata.from;
      const requestId = metadata.requestId || data._id || data.id;
      const requesterId = from?.id || from?._id || data.senderId;

      if (!requestId || !requesterId || !from?.name) {
        logger.warn('Friend request payload missing required fields, emitting raw data');
        this.emitLocal('friend_request', data);
        return;
      }

      useFriendStore.getState().setRequests([
        ...useFriendStore.getState().requests,
        {
          _id: requestId,
          requesterId: {
            _id: requesterId,
            name: from.name,
            picture: from.picture,
          },
          status: 'pending',
        },
      ]);

      this.emitLocal('friend_request', data);
    });

    socket.on('request_accepted', (data: {
      id: string;
      user: { id: string; name: string; picture?: string };
    }) => {
      logger.info('Request accepted:', data);

      useFriendStore.getState().addFriend({
        id: data.user.id,
        name: data.user.name,
        picture: data.user.picture,
        status: 'offline',
      });

      this.emitLocal('request_accepted', data);
    });

    socket.on('friend_nearby', (data: {
      friendId: string;
      status: 'nearby' | 'offline';
    }) => {
      logger.info('Friend nearby status:', data);

      const friends = useFriendStore.getState().friends;
      const updatedFriends = friends.map(f =>
        f.id === data.friendId ? { ...f, status: data.status } : f
      );
      useFriendStore.getState().setFriends(updatedFriends);

      this.emitLocal('friend_nearby', data);
    });
  },

  disconnect(): void {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  emitToServer(event: string, data?: unknown): void {
    if (socket?.connected) {
      socket.emit(event, data);
    }
  },

  // Subscribe to events
  subscribe(event: string, callback: SocketCallback): () => void {
    if (!eventListeners.has(event)) {
      eventListeners.set(event, new Set());
    }
    eventListeners.get(event)!.add(callback);

    return () => {
      eventListeners.get(event)?.delete(callback);
    };
  },

  // Internal emit for updating stores
  emitLocal(event: string, data: unknown): void {
    const listeners = eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  },

  // Check if connected
  isConnected(): boolean {
    return socket?.connected || false;
  },

  // Send location update
  sendLocation(latitude: number, longitude: number, radius: number): void {
    this.emitToServer('location_update', { latitude, longitude, radius });
  },
};

export default socketService;
