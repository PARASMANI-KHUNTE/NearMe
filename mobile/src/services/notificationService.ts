import { api } from './api';

export type NotificationType = 'friend_request' | 'proximity_alert' | 'meet_request';

export interface Notification {
  _id: string;
  recipientId: string;
  senderId?: string;
  type: NotificationType;
  content: string;
  metadata?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

// Note: Backend may not have GET /notifications endpoint yet
// This assumes it exists for fetching notification history
export class NotificationService {
  /**
   * Get user's notifications
   * Note: This assumes backend has GET /notifications endpoint
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
}