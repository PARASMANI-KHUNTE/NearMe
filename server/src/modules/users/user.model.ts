import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  googleId?: string;
  uniqueId: string;
  email: string;
  password?: string;
  name: string;
  picture?: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  settings: {
    radius: number;
    locationSharingEnabled: boolean;
    invisibleMode: boolean;
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
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date },
    settings: {
      radius: { type: Number, default: 5000, min: 1, max: 5000 },
      locationSharingEnabled: { type: Boolean, default: true },
      invisibleMode: { type: Boolean, default: false },
    },
  },
  { 
    timestamps: true,
    toJSON: {
      transform: (_: any, ret: any) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: (_: any, ret: any) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const User = model<IUser>('User', UserSchema);
