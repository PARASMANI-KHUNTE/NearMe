// @ts-nocheck
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { FriendService } from './friend.service';
import { FriendRequest } from './friend-request.model';
import { User } from '../users/user.model';

// Mock dependencies
jest.mock('./friend-request.model');
jest.mock('../users/user.model');

describe('FriendService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('sendRequest', () => {
    test('should send friend request successfully', async () => {
      const requesterId = 'user1';
      const recipientId = 'user2';

      const mockRecipient = {
        _id: recipientId,
        name: 'Recipient User',
        email: 'recipient@example.com',
      };

      const mockRequest = {
        _id: 'request123',
        requesterId,
        recipientId,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (User.findById as jest.Mock).mockResolvedValue(mockRecipient);
      (FriendRequest.findOne as jest.Mock).mockResolvedValue(null);
      (FriendRequest.create as jest.Mock).mockResolvedValue(mockRequest);

      const result = await FriendService.sendRequest(requesterId, recipientId);

      expect(result).toEqual(mockRequest);
      expect(User.findById).toHaveBeenCalledWith(recipientId);
      expect(FriendRequest.findOne).toHaveBeenCalled();
      expect(FriendRequest.create).toHaveBeenCalledWith({
        requesterId,
        recipientId,
      });
    });

    test('should throw error when sending request to self', async () => {
      const userId = 'user1';

      await expect(FriendService.sendRequest(userId, userId)).rejects.toThrow(
        'You cannot send a friend request to yourself'
      );
    });

    test('should throw error when recipient not found', async () => {
      const requesterId = 'user1';
      const recipientId = 'nonexistent';

      (User.findById as jest.Mock).mockResolvedValue(null);

      await expect(FriendService.sendRequest(requesterId, recipientId)).rejects.toThrow(
        'Recipient not found'
      );
    });

    test('should throw error when request already exists', async () => {
      const requesterId = 'user1';
      const recipientId = 'user2';

      const mockExistingRequest = {
        _id: 'existing123',
        requesterId,
        recipientId,
        status: 'pending',
      };

      (User.findById as jest.Mock).mockResolvedValue({ _id: recipientId });
      (FriendRequest.findOne as jest.Mock).mockResolvedValue(mockExistingRequest);

      await expect(FriendService.sendRequest(requesterId, recipientId)).rejects.toThrow(
        'A friend request already exists with status: pending'
      );
    });
  });

  describe('respondToRequest', () => {
    test('should accept friend request successfully', async () => {
      const recipientId = 'user2';
      const requestId = 'request123';

      const mockRequest = {
        _id: requestId,
        requesterId: 'user1',
        recipientId,
        status: 'pending',
        save: jest.fn().mockResolvedValue(undefined),
      };

      (FriendRequest.findOne as jest.Mock).mockResolvedValue(mockRequest);

      const result = await FriendService.respondToRequest(recipientId, requestId, 'accepted');

      expect(result.status).toBe('accepted');
      expect(mockRequest.save).toHaveBeenCalled();
    });

    test('should reject friend request successfully', async () => {
      const recipientId = 'user2';
      const requestId = 'request123';

      const mockRequest = {
        _id: requestId,
        requesterId: 'user1',
        recipientId,
        status: 'pending',
        save: jest.fn().mockResolvedValue(undefined),
      };

      (FriendRequest.findOne as jest.Mock).mockResolvedValue(mockRequest);

      const result = await FriendService.respondToRequest(recipientId, requestId, 'rejected');

      expect(result.status).toBe('rejected');
      expect(mockRequest.save).toHaveBeenCalled();
    });

    test('should throw error when request not found', async () => {
      const recipientId = 'user2';
      const requestId = 'nonexistent';

      (FriendRequest.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        FriendService.respondToRequest(recipientId, requestId, 'accepted')
      ).rejects.toThrow('Pending request not found');
    });

    test('should throw error when user is not the recipient', async () => {
      const wrongUserId = 'user3';
      const requestId = 'request123';

      (FriendRequest.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        FriendService.respondToRequest(wrongUserId, requestId, 'accepted')
      ).rejects.toThrow('Pending request not found');
    });
  });

  describe('listFriends', () => {
    test('should list all friends successfully', async () => {
      const userId = 'user1';

      const mockRequests = [
        {
          requesterId: { _id: 'user1', name: 'User 1', email: 'user1@example.com' },
          recipientId: { _id: 'user2', name: 'User 2', email: 'user2@example.com' },
        },
        {
          requesterId: { _id: 'user3', name: 'User 3', email: 'user3@example.com' },
          recipientId: { _id: 'user1', name: 'User 1', email: 'user1@example.com' },
        },
      ];

      (FriendRequest.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockRequests),
      } as any);

      const result = await FriendService.listFriends(userId);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockRequests[0].recipientId);
      expect(result[1]).toEqual(mockRequests[1].requesterId);
    });

    test('should return empty array when no friends', async () => {
      const userId = 'user1';

      (FriendRequest.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      } as any);

      const result = await FriendService.listFriends(userId);

      expect(result).toEqual([]);
    });
  });

  describe('getPendingRequests', () => {
    test('should get pending requests for user', async () => {
      const userId = 'user1';

      const mockRequests = [
        {
          _id: 'request1',
          requesterId: {
            _id: 'user2',
            name: 'User 2',
            picture: 'https://example.com/pic.jpg',
            uniqueId: 'ABC123',
          },
          status: 'pending',
        },
        {
          _id: 'request2',
          requesterId: {
            _id: 'user3',
            name: 'User 3',
            picture: 'https://example.com/pic2.jpg',
            uniqueId: 'XYZ789',
          },
          status: 'pending',
        },
      ];

      (FriendRequest.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockRequests),
      } as any);

      const result = await FriendService.getPendingRequests(userId);

      expect(result).toHaveLength(2);
      expect(FriendRequest.find).toHaveBeenCalledWith({
        recipientId: userId,
        status: 'pending',
      });
    });

    test('should return empty array when no pending requests', async () => {
      const userId = 'user1';

      (FriendRequest.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      } as any);

      const result = await FriendService.getPendingRequests(userId);

      expect(result).toEqual([]);
    });
  });

  describe('removeFriend', () => {
    test('should remove a friend successfully', async () => {
      const userId = 'user1';
      const friendId = 'user2';

      (FriendRequest.findOneAndDelete as jest.Mock).mockResolvedValue({ _id: 'req123' });

      await expect(FriendService.removeFriend(userId, friendId)).resolves.toBeUndefined();
      expect(FriendRequest.findOneAndDelete).toHaveBeenCalledWith({
        $or: [
          { requesterId: userId, recipientId: friendId },
          { requesterId: friendId, recipientId: userId },
        ],
        status: 'accepted',
      });
    });

    test('should throw error when removing self', async () => {
      const userId = 'user1';

      await expect(FriendService.removeFriend(userId, userId)).rejects.toThrow(
        'You cannot remove yourself as a friend'
      );
    });

    test('should throw error when friendship not found', async () => {
      const userId = 'user1';
      const friendId = 'user2';

      (FriendRequest.findOneAndDelete as jest.Mock).mockResolvedValue(null);

      await expect(FriendService.removeFriend(userId, friendId)).rejects.toThrow(
        'Friend not found'
      );
    });
  });
});
