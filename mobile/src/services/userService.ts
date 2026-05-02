import { api } from './api';
import { User } from './authService';
import { logger } from '../utils/logger';

export interface UpdateSettingsRequest {
  radius?: number;
  locationSharingEnabled?: boolean;
  invisibleMode?: boolean;
}

export class UserService {
  /**
   * Get current user's profile
   */
  static async getProfile(): Promise<User> {
    try {
      const response = await api.get('/users/profile');
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get profile');
      }
      return response.data.data;
    } catch (error: any) {
      logger.error('Get profile error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Get profile failed');
    }
  }

  /**
   * Update user settings
   */
  static async updateSettings(settings: UpdateSettingsRequest): Promise<User> {
    try {
      const response = await api.patch('/users/settings', settings);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update settings');
      }
      return response.data.data;
    } catch (error: any) {
      logger.error('Update settings error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Update settings failed');
    }
  }

  /**
   * Search users by name or email
   */
  static async searchUsers(query: string): Promise<User[]> {
    try {
      const response = await api.get('/users/search', { params: { q: query } });
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to search users');
      }
      return response.data.data;
    } catch (error: any) {
      logger.error('Search users error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Search users failed');
    }
  }

  /**
   * Get shareable profile (NearMe ID)
   */
  static async getShareProfile(): Promise<{ uniqueId: string }> {
    try {
      const response = await api.get('/users/share');
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get share profile');
      }
      return response.data.data;
    } catch (error: any) {
      logger.error('Get share profile error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Get share profile failed');
    }
  }
}
