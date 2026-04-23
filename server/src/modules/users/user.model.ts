import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  googleId?: string;
  uniqueId: string;
  email: string;
  password?: string;
  name: string;
  picture?: string;
  settings: {
    radius: number;
    locationSharingEnabled: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    googleId: { type: String, unique: true, sparse: true },
    uniqueId: { type: String, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, select: false },
    name: { type: String, required: true },
    picture: { type: String },
    settings: {
      radius: { type: Number, default: 5000 },
      locationSharingEnabled: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export const User = model<IUser>('User', UserSchema);
