import { Response } from 'express';
import { Notification } from './notification.model';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import { logger } from '../../shared/logger/logger';

export class NotificationController {
  /**
   * Get user's notifications
   */
  static async getNotifications(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user._id;
      const notifications = await Notification.find({ recipientId: userId })
        .populate('senderId', 'name email picture')
        .sort({ createdAt: -1 })
        .select('-__v');

      res.status(200).json({
        success: true,
        data: notifications,
        message: 'Notifications retrieved successfully',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error fetching notifications';
      logger.error({ error }, 'Failed to fetch notifications');
      res.status(500).json({ success: false, message });
    }
  }

  /**
   * Mark a single notification as read
   */
  static async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user._id;
      const { id } = req.params;

      const notification = await Notification.findOneAndUpdate(
        { _id: id, recipientId: userId },
        { read: true },
        { returnDocument: 'after' }
      );

      res.status(200).json({
        success: true,
        data: notification,
        message: 'Notification marked as read',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error marking notification as read';
      logger.error({ error }, 'Failed to mark notification as read');
      res.status(500).json({ success: false, message });
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user._id;
      const count = await Notification.countDocuments({ recipientId: userId, read: false });

      res.status(200).json({
        success: true,
        data: { count },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error fetching unread count';
      logger.error({ error }, 'Failed to get unread count');
      res.status(500).json({ success: false, message });
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user._id;

      await Notification.updateMany(
        { recipientId: userId, read: false },
        { read: true }
      );

      res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error marking all as read';
      logger.error({ error }, 'Failed to mark all as read');
      res.status(500).json({ success: false, message });
    }
  }
}
