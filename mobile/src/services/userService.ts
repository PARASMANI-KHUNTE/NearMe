import { api } from './api';
import { User } from './authService';

export interface UpdateSettingsRequest {
  radius?: number;
  locationSharingEnabled?: boolean;
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
      console.error('Get profile error:', error);
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
      console.error('Update settings error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Update settings failed');
    }
  }
}