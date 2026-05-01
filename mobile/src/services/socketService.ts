import { io, Socket } from 'socket.io-client';
import { env } from '../config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';

export type NotificationType = 'friend_request' | 'friend_accepted' | 'proximity_alert' | 'meet_request';

export interface SocketNotification {
  _id: string;
  type: NotificationType;
  content: string;
  metadata?: Record<string, unknown>;
  senderId?: string;
  createdAt: string;
}

export interface RawFriendRequestSocketPayload {
  id: string;
  from?: {
    id: string;
    name?: string;
    picture?: string;
  };
}

class SocketService {
  private socket: Socket | null = null;
  private connectionPromise: Promise<void> | null = null;
  private eventCallbacks: Map<string, ((data: unknown) => void)[]> = new Map();

  /**
   * Connect to socket server with JWT authentication
   */
  async connect(): Promise<void> {
    if (this.socket?.connected) {
      console.log('[Socket] Already connected');
      return;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = (async () => {
      const token = await AsyncStorage.getItem(TOKEN_KEY);

      if (!token) {
        throw new Error('No auth token');
      }

      const socketUrl = env.SOCKET_URL;

      this.socket?.disconnect();

      this.socket = io(socketUrl, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: true,
      });

      await new Promise<void>((resolve, reject) => {
        const socket = this.socket!;

        const cleanup = () => {
          socket.off('connect', handleConnect);
          socket.off('connect_error', handleConnectError);
        };

        const handleConnect = () => {
          console.log('[Socket] Connected via', socket.io.engine.transport.name);
          console.log('[Socket] Connected successfully');
          cleanup();
          resolve();
        };

        const handleConnectError = (error: Error) => {
          console.error('[Socket] Connection error:', error.message);
          if (error.message.includes('Authentication')) {
            console.error('[Socket] Token may be invalid or expired');
          }
          cleanup();
          reject(error);
        };

        socket.once('connect', handleConnect);
        socket.once('connect_error', handleConnectError);

        socket.on('disconnect', (reason) => {
          console.log('[Socket] Disconnected:', reason);
        });

        socket.on('proximity_alert', (data: SocketNotification) => {
          this.emitEvent('proximity_alert', data);
        });

        socket.on('friend_request', (data: SocketNotification | RawFriendRequestSocketPayload) => {
          this.emitEvent('friend_request', data);
        });

        socket.on('meet_request', (data: SocketNotification) => {
          this.emitEvent('meet_request', data);
        });
      });
    })();

    try {
      await this.connectionPromise;
    } catch (error) {
      this.socket?.disconnect();
      this.socket = null;
      console.error('Socket connect error:', error);
      throw error;
    } finally {
      this.connectionPromise = null;
    }
  }

  /**
   * Disconnect from socket server
   */
  disconnect(): void {
    this.connectionPromise = null;
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Subscribe to socket events
   */
  subscribe(event: string, callback: (data: unknown) => void): void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event)!.push(callback);
  }

  /**
   * Unsubscribe from socket events
   */
  unsubscribe(event: string, callback: (data: unknown) => void): void {
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
  private emitEvent(event: string, data: unknown): void {
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
