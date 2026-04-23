import { io, Socket } from 'socket.io-client';
import { env } from '../config/env';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useFriendStore } from '../store/friendStore';

type SocketCallback = (data: unknown) => void;

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
      console.log('Socket connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    // Real-time events
    socket.on('proximity_alert', (data: { 
      id: string; 
      friendId: string; 
      friendName: string; 
      message: string;
      distance?: number;
    }) => {
      console.log('Proximity alert:', data);
      
      useNotificationStore.getState().addNotification({
        id: data.id,
        type: 'proximity_alert',
        message: `${data.friendName} is nearby! ${data.message || ''}`,
        read: false,
        createdAt: new Date().toISOString(),
      });
      
      // Notify listeners
      this.emitLocal('proximity_alert', data);
    });

    socket.on('friend_request', (data: { 
      id: string; 
      from: { id: string; name: string; picture?: string };
    }) => {
      console.log('Friend request received:', data);
      
      useFriendStore.getState().setRequests([
        ...useFriendStore.getState().requests,
        { 
          id: data.from.id, 
          name: data.from.name, 
          picture: data.from.picture, 
          status: 'offline' as const 
        },
      ]);
      
      this.emitLocal('friend_request', data);
    });

    socket.on('request_accepted', (data: { 
      id: string; 
      user: { id: string; name: string; picture?: string };
    }) => {
      console.log('Request accepted:', data);
      
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
      console.log('Friend nearby status:', data);
      
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
