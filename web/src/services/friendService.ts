import { api, type ApiResponse } from './api';
import type { Friend, User } from '../types';

interface FriendRequest {
  id: string;
  from: User;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export const friendService = {
  async getFriends(): Promise<Friend[]> {
    const response = await api.get<ApiResponse<Friend[]>>('/api/friends');
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    return [];
  },

  async getPendingRequests(): Promise<FriendRequest[]> {
    const response = await api.get<ApiResponse<FriendRequest[]>>('/api/friends/requests');
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    return [];
  },

  async sendRequest(userId: string): Promise<void> {
    const response = await api.post<ApiResponse>(`/api/friends/request`, { userId });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to send request');
    }
  },

  async acceptRequest(requestId: string): Promise<void> {
    const response = await api.post<ApiResponse>(`/api/friends/request/${requestId}/accept`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to accept request');
    }
  },

  async rejectRequest(requestId: string): Promise<void> {
    const response = await api.post<ApiResponse>(`/api/friends/request/${requestId}/reject`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to reject request');
    }
  },

  async removeFriend(friendId: string): Promise<void> {
    const response = await api.delete<ApiResponse>(`/api/friends/${friendId}`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to remove friend');
    }
  },

  async searchUsers(query: string): Promise<User[]> {
    const response = await api.get<ApiResponse<User[]>>('/api/friends/search', {
      params: { q: query },
    });
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    return [];
  },
};

export default friendService;
