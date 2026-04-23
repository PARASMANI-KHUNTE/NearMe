import { api } from './api';
import { User } from './authService';

export interface FriendRequest {
  _id: string;
  requesterId: string;
  recipientId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export class FriendService {
  /**
   * Send friend request to another user
   */
  static async sendRequest(recipientId: string): Promise<FriendRequest> {
    try {
      const response = await api.post('/friends/request', { recipientId });
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to send friend request');
      }
      return response.data.data;
    } catch (error: any) {
      console.error('Send friend request error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Send friend request failed');
    }
  }

  /**
   * Accept friend request
   */
  static async acceptRequest(requestId: string): Promise<FriendRequest> {
    try {
      const response = await api.post(`/friends/request/${requestId}/accept`);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to accept friend request');
      }
      return response.data.data;
    } catch (error: any) {
      console.error('Accept friend request error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Accept friend request failed');
    }
  }

  /**
   * Reject friend request
   */
  static async rejectRequest(requestId: string): Promise<FriendRequest> {
    try {
      const response = await api.post(`/friends/request/${requestId}/reject`);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to reject friend request');
      }
      return response.data.data;
    } catch (error: any) {
      console.error('Reject friend request error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Reject friend request failed');
    }
  }

  /**
   * Get list of friends
   */
  static async getFriends(): Promise<User[]> {
    try {
      const response = await api.get('/friends');
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get friends');
      }
      return response.data.data;
    } catch (error: any) {
      console.error('Get friends error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Get friends failed');
    }
  }
}