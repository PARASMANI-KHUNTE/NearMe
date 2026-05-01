import { api, type ApiResponse } from './api';
import type { Notification } from '../types';

interface ServerNotification {
  id?: string;
  _id?: string;
  type: Notification['type'];
  content?: string;
  message?: string;
  read?: boolean;
  createdAt?: string;
  senderId?: Notification['from'];
}

const createFallbackId = () =>
  globalThis.crypto?.randomUUID?.() || `notification-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const normalizeNotification = (notification: ServerNotification): Notification => ({
  id: notification.id || notification._id || createFallbackId(),
  type: notification.type,
  message: notification.message || notification.content || 'New notification',
  read: Boolean(notification.read),
  createdAt: notification.createdAt || new Date().toISOString(),
  from: notification.senderId,
});

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    const response = await api.get<ApiResponse<ServerNotification[]>>('/api/notifications');
    
    if (response.data.success && response.data.data) {
      return response.data.data.map(normalizeNotification);
    }
    
    return [];
  },

  async markAsRead(notificationId: string): Promise<void> {
    const response = await api.patch<ApiResponse>(`/api/notifications/${notificationId}/read`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to mark as read');
    }
  },

  async markAllAsRead(): Promise<void> {
    const response = await api.patch<ApiResponse>('/api/notifications/read-all');
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to mark all as read');
    }
  },

  // Get unread count
  async getUnreadCount(): Promise<number> {
    const response = await api.get<ApiResponse<{ count: number }>>('/api/notifications/unread-count');

    if (response.data.success && response.data.data) {
      return response.data.data.count;
    }

    return 0;
  },
};

export default notificationService;
