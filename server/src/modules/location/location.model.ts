import { Schema, model, Document, Types } from 'mongoose';

export interface ILocation extends Document {
  userId: Types.ObjectId;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  expiresAt: Date;
}

const LocationSchema = new Schema<ILocation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    // Used for TTL index: automatically delete location after 1 hour of no updates
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// 2dsphere index for proximity queries
LocationSchema.index({ location: '2dsphere' });
// TTL index
LocationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Location = model<ILocation>('Location', LocationSchema);
