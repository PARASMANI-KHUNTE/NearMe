import { Notification, NotificationType } from './notification.model';
import { emitToUser } from '../../shared/socket/socket';

export class NotificationService {
  static async createAndEmit(
    recipientId: string,
    type: NotificationType,
    content: string,
    metadata?: any,
    senderId?: string
  ): Promise<void> {
    // 1. Save to database
    const notification = await Notification.create({
      recipientId,
      senderId,
      type,
      content,
      metadata,
    });

    // 2. Emit via WebSocket
    emitToUser(recipientId, type, {
      _id: notification._id,
      type: notification.type,
      content: notification.content,
      metadata: notification.metadata,
      senderId: notification.senderId,
      createdAt: notification.createdAt,
    });
  }
}
