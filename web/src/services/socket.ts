import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useFriendStore } from '../store/friendStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

let socket: Socket | null = null;

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
    console.log('Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  // Proximity alert - friend is nearby
  socket.on('proximity_alert', (data: { id: string; friendId: string; friendName: string; message: string }) => {
    console.log('Proximity alert:', data);
    useNotificationStore.getState().addNotification({
      id: data.id,
      type: 'proximity_alert',
      message: data.message,
      read: false,
      createdAt: new Date().toISOString(),
    });
  });

  // Friend request received
  socket.on('friend_request', (data: { id: string; from: { id: string; name: string; picture?: string } }) => {
    console.log('Friend request:', data);
    useFriendStore.getState().setRequests([
      ...useFriendStore.getState().requests,
      { id: data.from.id, name: data.from.name, picture: data.from.picture, status: 'offline' },
    ]);
  });

  // Friend request accepted
  socket.on('request_accepted', (data: { id: string; user: { id: string; name: string; picture?: string } }) => {
    console.log('Request accepted:', data);
    useFriendStore.getState().addFriend({
      id: data.user.id,
      name: data.user.name,
      picture: data.user.picture,
      status: 'offline',
    });
  });

  // Location update from friend
  socket.on('friend_nearby', (data: { friendId: string; status: 'nearby' | 'offline' }) => {
    console.log('Friend nearby status:', data);
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