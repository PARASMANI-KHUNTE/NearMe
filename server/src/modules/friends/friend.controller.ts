import { Response } from 'express';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import { FriendService } from './friend.service';
import { NotificationService } from '../notifications/notification.service';
import { User } from '../users/user.model';
import { emitToUser } from '../../shared/socket/socket';

export class FriendController {
  static async sendRequest(req: AuthRequest, res: Response): Promise<void> {
    try {
      const requesterId = req.user._id.toString();
      const { recipientId } = req.body;

      if (!recipientId) {
        res.status(400).json({ success: false, message: 'recipientId is required' });
        return;
      }

      const request = await FriendService.sendRequest(requesterId, recipientId);

      // Get requester info for notification
      const requester = await User.findById(requesterId).select('name picture');

      // Send notification to recipient via socket
      emitToUser(recipientId, 'friend_request', {
        id: request._id.toString(),
        from: {
          id: requesterId,
          name: requester?.name || 'Someone',
          picture: requester?.picture,
        },
      });

      res.status(201).json({
        success: true,
        data: request,
        message: 'Friend request sent',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error sending friend request',
      });
    }
  }

  static async acceptRequest(req: AuthRequest, res: Response): Promise<void> {
    try {
      const recipientId = req.user._id.toString();
      const requestId = req.params.requestId as string;

      const request = await FriendService.respondToRequest(recipientId, requestId, 'accepted');

      // Get recipient info for notification
      const recipient = await User.findById(recipientId).select('name picture');

      // Notify the requester via socket
      emitToUser(request.requesterId.toString(), 'request_accepted', {
        id: request._id.toString(),
        user: {
          id: recipientId,
          name: recipient?.name || 'Someone',
          picture: recipient?.picture,
        },
      });

      res.status(200).json({
        success: true,
        data: request,
        message: 'Friend request accepted',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error accepting friend request',
      });
    }
  }

  static async rejectRequest(req: AuthRequest, res: Response): Promise<void> {
    try {
      const recipientId = req.user._id.toString();
      const requestId = req.params.requestId as string;

      const request = await FriendService.respondToRequest(recipientId, requestId, 'rejected');

      res.status(200).json({
        success: true,
        data: request,
        message: 'Friend request rejected',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error rejecting friend request',
      });
    }
  }

  static async listFriends(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user._id.toString();
      const friends = await FriendService.listFriends(userId);

      res.status(200).json({
        success: true,
        data: friends,
        message: 'Friends listed successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching friends list',
      });
    }
  }

  static async listPendingRequests(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user._id.toString();
      const requests = await FriendService.getPendingRequests(userId);

      res.status(200).json({
        success: true,
        data: requests,
        message: 'Pending requests retrieved',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching pending requests',
      });
    }
  }
}
