// AuthService handles authentication logic including Google OAuth and Password Reset
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User, IUser } from '../users/user.model';
import { getJwtSecret, getJwtExpiresIn, getGoogleClientIds } from '../../shared/config';
import { EmailService } from '../../shared/services/email.service';

const client = new OAuth2Client();

const generateUniqueId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export class AuthService {
  static async register(userData: Partial<IUser>): Promise<{ user: IUser; token: string }> {
    const { email, password, name } = userData;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Generate unique ID
    let uniqueId = generateUniqueId();
    while (await User.findOne({ uniqueId })) {
      uniqueId = generateUniqueId();
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password!, 10);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      uniqueId,
    });

    const token = this.generateToken(user._id.toString());

    // Remove password from returned user object
    const userObj = user.toObject();
    delete (userObj as any).password;

    return { user: userObj as IUser, token };
  }

  static async login(email: string, password: string): Promise<{ user: IUser; token: string }> {
    // Find user and include password for verification
    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password) {
      throw new Error('Invalid email or password');
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const token = this.generateToken(user._id.toString());

    const userObj = user.toObject();
    delete (userObj as any).password;

    return { user: userObj as IUser, token };
  }

  static async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await User.findOne({ email });
    if (!user) {
      return { message: 'If an account exists with that email, a password reset link has been sent' };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    // Send email
    await EmailService.sendPasswordResetEmail(email, user.name, resetToken);

    return { message: 'If an account exists with that email, a password reset link has been sent' };
  }

  static async resetPassword(token: string, password: string): Promise<{ user: IUser; token: string }> {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+password');

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    // Update password
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const newToken = this.generateToken(user._id.toString());

    const userObj = user.toObject();
    delete (userObj as any).password;

    return { user: userObj as IUser, token: newToken };
  }

  static async verifyGoogleTokenAndLogin(idToken: string): Promise<{ user: IUser; token: string }> {
    const googleClientIds = getGoogleClientIds();
    const audience = [
      googleClientIds.web,
      googleClientIds.android,
      googleClientIds.ios,
    ].filter((id): id is string => !!id);

    const ticket = await client.verifyIdToken({
      idToken,
      audience,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error('Invalid Google token');
    }

    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ email });

    if (user) {
      let shouldSave = false;

      if (!user.googleId) {
        user.googleId = googleId;
        shouldSave = true;
      }

      if (picture && user.picture !== picture) {
        user.picture = picture;
        shouldSave = true;
      }

      if (name && user.name !== name) {
        user.name = name;
        shouldSave = true;
      }

      if (shouldSave) {
        await user.save();
      }
    } else {
      // Generate unique ID for new user
      let uniqueId = generateUniqueId();
      while (await User.findOne({ uniqueId })) {
        uniqueId = generateUniqueId();
      }

      // Create new user
      user = await User.create({
        googleId,
        email,
        name: name || 'User',
        picture,
        uniqueId,
      });
    }

    const token = this.generateToken(user._id.toString());

    // Convert to plain object like other auth methods
    const userObj = typeof (user as any).toObject === 'function'
      ? (user as any).toObject()
      : user;

    return { user: userObj as IUser, token };
  }

  private static generateToken(userId: string): string {
    return jwt.sign({ id: userId }, getJwtSecret(), {
      expiresIn: getJwtExpiresIn() as any,
    });
  }
}
