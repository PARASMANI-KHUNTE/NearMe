import { FriendRequest, IFriendRequest } from './friend-request.model';
import { User, IUser } from '../users/user.model';

export class FriendService {
  static async sendRequest(requesterId: string, recipientId: string): Promise<IFriendRequest> {
    if (requesterId === recipientId) {
      throw new Error('You cannot send a friend request to yourself');
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      throw new Error('Recipient not found');
    }

    // Check if request already exists (either direction)
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { requesterId, recipientId },
        { requesterId: recipientId, recipientId: requesterId },
      ],
    });

    if (existingRequest) {
      throw new Error(`A friend request already exists with status: ${existingRequest.status}`);
    }

    const newRequest = await FriendRequest.create({
      requesterId,
      recipientId,
    });

    return newRequest;
  }

  static async respondToRequest(
    recipientId: string,
    requestId: string,
    status: 'accepted' | 'rejected'
  ): Promise<IFriendRequest> {
    const request = await FriendRequest.findOne({ _id: requestId, recipientId, status: 'pending' });

    if (!request) {
      throw new Error('Pending request not found');
    }

    request.status = status;
    await request.save();

    return request;
  }

  static async listFriends(userId: string): Promise<IUser[]> {
    // Find all accepted requests
    const requests = await FriendRequest.find({
      $or: [{ requesterId: userId }, { recipientId: userId }],
      status: 'accepted',
    }).populate('requesterId', 'name email picture settings')
      .populate('recipientId', 'name email picture settings')
      .exec();

    // Extract the actual friend object from the request
    const friends = requests.map((req: any) => {
      // populate returns the object or ID
      if (req.requesterId._id.toString() === userId) {
        return req.recipientId;
      }
      return req.requesterId;
    });

    return friends;
  }

  static async getPendingRequests(userId: string): Promise<IFriendRequest[]> {
    return FriendRequest.find({
      recipientId: userId,
      status: 'pending',
    }).populate('requesterId', 'name picture uniqueId').exec();
  }

  static async removeFriend(userId: string, friendId: string): Promise<void> {
    if (userId === friendId) {
      throw new Error('You cannot remove yourself as a friend');
    }

    const result = await FriendRequest.findOneAndDelete({
      $or: [
        { requesterId: userId, recipientId: friendId },
        { requesterId: friendId, recipientId: userId },
      ],
      status: 'accepted',
    });

    if (!result) {
      throw new Error('Friend not found');
    }
  }

  static async updateProximityConsent(
    userId: string,
    friendId: string,
    enabled: boolean
  ): Promise<{ proximityEnabled: boolean }> {
    const request = await FriendRequest.findOne({
      $or: [
        { requesterId: userId, recipientId: friendId },
        { requesterId: friendId, recipientId: userId },
      ],
      status: 'accepted',
    });

    if (!request) {
      throw new Error('Friend relationship not found');
    }

    if (request.requesterId.toString() === userId) {
      request.requesterProximityConsent = enabled;
    } else {
      request.recipientProximityConsent = enabled;
    }

    await request.save();

    return { proximityEnabled: request.requesterProximityConsent && request.recipientProximityConsent };
  }
}
