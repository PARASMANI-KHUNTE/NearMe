import { io, Socket } from 'socket.io-client';
import { useAppStore } from '../store/useAppStore';

const SOCKET_URL = 'http://localhost:3000'; // Replace with backend IP
let socket: Socket | null = null;

export const initiateSocket = () => {
  const token = useAppStore.getState().token;
  if (!token || socket) return;

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  // Ex: Proximity Alerts
  socket.on('proximityAlert', (data) => {
    console.log('Proximity Alert:', data);
    const setNotifications = useAppStore.getState().setNotifications;
    const notifications = useAppStore.getState().notifications;
    setNotifications([
      { id: Date.now().toString(), message: data.message, read: false },
      ...notifications,
    ]);
  });

  // Additional events like friend requests
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const emitLocation = (latitude: number, longitude: number, radius: number) => {
  if (socket?.connected && useAppStore.getState().shareLocation) {
    socket.emit('locationUpdate', { latitude, longitude, radius });
  }
};
