import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useFriendStore } from '../store/friendStore';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const SOCKET_URL = env.socketUrl;

let socket: Socket | null = null;
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

export const connectSocket = () => {
  const token = useAuthStore.getState().token;
  if (!token || socket?.connected) return;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
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

  // Proximity alert - friend is nearby
  socket.on('proximity_alert', (data: { id?: string; _id?: string; friendId: string; friendName?: string; message?: string; content?: string; createdAt?: string }) => {
    logger.info('Proximity alert:', data);
    useNotificationStore.getState().addNotification({
      id: data.id || data._id || `proximity-${Date.now()}`,
      type: 'proximity_alert',
      message: data.content || data.message || `${data.friendName || 'A friend'} is nearby`,
      read: false,
      createdAt: data.createdAt || new Date().toISOString(),
    });
  });

  // Friend request received
  socket.on('friend_request', (data: FriendRequestSocketPayload) => {
    logger.info('Friend request:', data);
    const metadata = data.metadata || {};
    const from = metadata.from;
    const requestId = metadata.requestId || data._id || data.id;
    const requesterId = from?.id || from?._id || data.senderId;

    if (!requestId || !requesterId || !from?.name) {
      logger.warn('Friend request payload missing required fields');
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
  });

  // Friend request accepted
  socket.on('request_accepted', (data: { id: string; user: { id: string; name: string; picture?: string } }) => {
    logger.info('Request accepted:', data);
    useFriendStore.getState().addFriend({
      id: data.user.id,
      name: data.user.name,
      picture: data.user.picture,
      status: 'offline',
    });
  });

  // Location update from friend
  socket.on('friend_nearby', (data: { friendId: string; status: 'nearby' | 'offline' }) => {
    logger.info('Friend nearby status:', data);
    const friends = useFriendStore.getState().friends;
    const updatedFriends = friends.map(f =>
      f.id === data.friendId ? { ...f, status: data.status as 'nearby' | 'offline' } : f
    );
    useFriendStore.getState().setFriends(updatedFriends);
  });
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const emitLocation = (latitude: number, longitude: number, radius: number) => {
  if (socket?.connected) {
    socket.emit('location_update', { latitude, longitude, radius });
  }
};

export const emitFriendRequest = (userId: string) => {
  if (socket?.connected) {
    socket.emit('send_friend_request', { userId });
  }
};
