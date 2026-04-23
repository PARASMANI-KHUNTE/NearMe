import { Schema, model, Document, Types } from 'mongoose';

export type NotificationType = 'friend_request' | 'friend_accepted' | 'proximity_alert' | 'meet_request';

export interface INotification extends Document {
  recipientId: Types.ObjectId;
  senderId?: Types.ObjectId;
  type: NotificationType;
  content: string;
  metadata?: Record<string, any>; // e.g., distance in meters
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: ['friend_request', 'friend_accepted', 'proximity_alert', 'meet_request'],
      required: true,
    },
    content: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index to quickly fetch user's notifications
NotificationSchema.index({ recipientId: 1, createdAt: -1 });

export const Notification = model<INotification>('Notification', NotificationSchema);
