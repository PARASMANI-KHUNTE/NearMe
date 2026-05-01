import { api } from './api';
import { User } from './authService';

export interface FriendRequestUser {
  id?: string;
  _id?: string;
  name: string;
  picture?: string;
  uniqueId?: string;
}

export interface FriendRequest {
  _id: string;
  requesterId: string | FriendRequestUser;
  recipientId: string | FriendRequestUser;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface FriendStatus {
  id: string;
  name: string;
  picture?: string;
  status: 'nearby' | 'offline';
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

  /**
   * Get pending (incoming) friend requests
   */
  static async getPendingRequests(): Promise<FriendRequest[]> {
    try {
      const response = await api.get('/friends/requests');
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get pending requests');
      }
      return response.data.data;
    } catch (error: any) {
      console.error('Get pending requests error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Get pending requests failed');
    }
  }

  static async getFriendsStatuses(): Promise<FriendStatus[]> {
    try {
      const response = await api.get('/location/friends-status');
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get friends statuses');
      }
      return response.data.data;
    } catch (error: any) {
      console.error('Get friends statuses error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Get friends statuses failed');
    }
  }
}
