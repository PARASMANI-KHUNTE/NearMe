import { io, Socket } from 'socket.io-client';
import { env } from '../config/env';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';

export type NotificationType = 'friend_request' | 'proximity_alert' | 'meet_request';

export interface SocketNotification {
  _id: string;
  type: NotificationType;
  content: string;
  metadata?: any;
  senderId?: string;
  createdAt: string;
}

class SocketService {
  private socket: Socket | null = null;
  private eventCallbacks: Map<string, ((data: any) => void)[]> = new Map();

  /**
   * Connect to socket server with JWT authentication
   */
  async connect(): Promise<void> {
    if (this.socket?.connected) {
      return;
    }

    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!token) {
        throw new Error('No auth token available');
      }

      this.socket = io(env.SOCKET_URL, {
        auth: {
          token,
        },
        transports: ['websocket'],
      });

      this.socket.on('connect', () => {
        console.log('Socket connected');
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      // Listen to notification events
      this.socket.on('proximity_alert', (data: SocketNotification) => {
        this.emitEvent('proximity_alert', data);
      });

      this.socket.on('friend_request', (data: SocketNotification) => {
        this.emitEvent('friend_request', data);
      });

      this.socket.on('meet_request', (data: SocketNotification) => {
        this.emitEvent('meet_request', data);
      });

    } catch (error) {
      console.error('Socket connect error:', error);
      throw error;
    }
  }

  /**
   * Disconnect from socket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.eventCallbacks.clear();
    }
  }

  /**
   * Subscribe to socket events
   */
  subscribe(event: string, callback: (data: any) => void): void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event)!.push(callback);
  }

  /**
   * Unsubscribe from socket events
   */
  unsubscribe(event: string, callback: (data: any) => void): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to subscribers
   */
  private emitEvent(event: string, data: any): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  /**
   * Check if socket is connected
   */
  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();