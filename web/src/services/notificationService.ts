import { api, type ApiResponse } from './api';
import type { Notification } from '../types';

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    const response = await api.get<ApiResponse<Notification[]>>('/api/notifications');
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    return [];
  },

  async markAsRead(notificationId: string): Promise<void> {
    const response = await api.put<ApiResponse>(`/api/notifications/${notificationId}/read`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to mark as read');
    }
  },

  async markAllAsRead(): Promise<void> {
    const response = await api.put<ApiResponse>('/api/notifications/read-all');
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to mark all as read');
    }
  },

  async deleteNotification(notificationId: string): Promise<void> {
    const response = await api.delete<ApiResponse>(`/api/notifications/${notificationId}`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete notification');
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
