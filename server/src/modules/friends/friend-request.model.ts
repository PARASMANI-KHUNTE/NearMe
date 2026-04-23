import { Schema, model, Document, Types } from 'mongoose';

export type RequestStatus = 'pending' | 'accepted' | 'rejected';

export interface IFriendRequest extends Document {
  requesterId: Types.ObjectId;
  recipientId: Types.ObjectId;
  status: RequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

const FriendRequestSchema = new Schema<IFriendRequest>(
  {
    requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Prevent duplicate requests between same users
FriendRequestSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });

export const FriendRequest = model<IFriendRequest>('FriendRequest', FriendRequestSchema);
