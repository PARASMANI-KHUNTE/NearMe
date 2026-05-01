import { api } from './api';

export type NotificationType = 'friend_request' | 'friend_accepted' | 'proximity_alert' | 'meet_request';

export interface Notification {
  _id: string;
  recipientId: string;
  senderId?: string;
  type: NotificationType;
  content: string;
  metadata?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export class NotificationService {
  /**
   * Get user's notifications
   */
  static async getNotifications(): Promise<Notification[]> {
    try {
      const response = await api.get('/notifications');
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get notifications');
      }
      return response.data.data;
    } catch (error: any) {
      console.error('Get notifications error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Get notifications failed');
    }
  }

  /**
   * Mark a single notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      const response = await api.patch(`/notifications/${notificationId}/read`);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to mark as read');
      }
    } catch (error: any) {
      console.error('Mark as read error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Mark as read failed');
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(): Promise<void> {
    try {
      const response = await api.patch('/notifications/read-all');
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to mark all as read');
      }
    } catch (error: any) {
      console.error('Mark all as read error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Mark all as read failed');
    }
  }
}
