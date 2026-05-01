import { api, type ApiResponse } from './api';
import type { User } from '../types';

interface UserSettings {
  radius?: number;
  locationSharingEnabled?: boolean;
  invisibleMode?: boolean;
}

export const userService = {
  async getProfile(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/api/users/profile');
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to get profile');
  },

  async updateSettings(settings: UserSettings): Promise<User> {
    const response = await api.patch<ApiResponse<User>>('/api/users/settings', settings);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to update settings');
  },

  async searchUsers(query: string): Promise<User[]> {
    const response = await api.get<ApiResponse<User[]>>('/api/users/search', {
      params: { q: query },
    });
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    return [];
  },
};

export default userService;
