// AuthService handles authentication logic including Google OAuth and Password Reset
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User, IUser } from '../users/user.model';
import { getJwtSecret, getJwtExpiresIn, getGoogleClientIds, getJwtRefreshExpiresIn } from '../../shared/config';
import { EmailService } from '../../shared/services/email.service';
import { redisClient } from '../../shared/redis/connection';
import { logger } from '../../shared/logger/logger';

const client = new OAuth2Client();

const generateUniqueId = (): string => {
  const bytes = crypto.randomBytes(4);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(bytes[i] % chars.length);
  }
  return result;
};

export class AuthService {
  static async register(userData: Partial<IUser>): Promise<{ user: IUser; token: string; refreshToken: string }> {
    const { email, password, name } = userData;
    if (!email || !password || !name) {
      throw new Error('Email, password and name are required');
    }

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

    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      uniqueId,
      isEmailVerified: false,
      emailVerificationToken: verificationCode,
      emailVerificationExpires: verificationExpires,
    });

    const token = this.generateToken(user._id.toString());
    const refreshToken = this.generateRefreshToken(user._id.toString());

    await this.storeRefreshToken(user._id.toString(), refreshToken);

    // Dispatch verification email asynchronously
    EmailService.sendVerificationEmail(email, name, verificationCode).catch((err) => {
      logger.error(err, `Failed to send verification email to ${email}`);
    });

    // Remove password from returned user object
    const userObj = user.toObject();
    delete (userObj as any).password;

    return { user: userObj as IUser, token, refreshToken };
  }

  static async login(email: string, password: string): Promise<{ user: IUser; token: string; refreshToken: string }> {
    // Find user and include password for verification
    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password) {
      throw new Error('Invalid email or password');
    }

    if (!user.isEmailVerified) {
      throw new Error('Please verify your email address before logging in');
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const token = this.generateToken(user._id.toString());
    const refreshToken = this.generateRefreshToken(user._id.toString());

    await this.storeRefreshToken(user._id.toString(), refreshToken);

    const userObj = user.toObject();
    delete (userObj as any).password;

    return { user: userObj as IUser, token, refreshToken };
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

  static async resetPassword(token: string, password: string): Promise<{ user: IUser; token: string; refreshToken: string }> {
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
    const newRefreshToken = this.generateRefreshToken(user._id.toString());

    await this.storeRefreshToken(user._id.toString(), newRefreshToken);

    const userObj = user.toObject();
    delete (userObj as any).password;

    return { user: userObj as IUser, token: newToken, refreshToken: newRefreshToken };
  }

  static async verifyGoogleTokenAndLogin(idToken: string): Promise<{ user: IUser; token: string; refreshToken: string }> {
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

      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
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
        isEmailVerified: true,
      });
    }

    const token = this.generateToken(user._id.toString());
    const refreshToken = this.generateRefreshToken(user._id.toString());

    await this.storeRefreshToken(user._id.toString(), refreshToken);

    // Convert to plain object like other auth methods
    const userObj = typeof (user as any).toObject === 'function'
      ? (user as any).toObject()
      : user;

    return { user: userObj as IUser, token, refreshToken };
  }

  private static generateToken(userId: string): string {
    return jwt.sign({ id: userId, type: 'access' }, getJwtSecret(), {
      expiresIn: getJwtExpiresIn() as any,
    });
  }

  private static generateRefreshToken(userId: string): string {
    return jwt.sign({ id: userId, type: 'refresh' }, getJwtSecret(), {
      expiresIn: getJwtRefreshExpiresIn() as any,
    });
  }

  private static async storeRefreshToken(userId: string, token: string): Promise<void> {
    try {
      const key = `refresh_token:${userId}`;
      const expirySeconds = 7 * 24 * 60 * 60; // 7 days
      await redisClient.set(key, token, { EX: expirySeconds });
    } catch {
      // Redis not available, skip storing refresh token
      logger.warn('Redis not available, refresh token not stored');
    }
  }

  static async refreshAccessToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    try {
      const decoded = jwt.verify(refreshToken, getJwtSecret()) as { id: string; type: string };
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      try {
        const storedToken = await redisClient.get(`refresh_token:${decoded.id}`);
        if (storedToken && storedToken !== refreshToken) {
          throw new Error('Refresh token is invalid or has been revoked');
        }
      } catch {
        // Redis not available, skip validation
      }

      // Generate new access token
      const newToken = this.generateToken(decoded.id);
      
      // Rotate refresh token (generate new one and invalidate old)
      const newRefreshToken = this.generateRefreshToken(decoded.id);
      await this.storeRefreshToken(decoded.id, newRefreshToken);

      return { token: newToken, refreshToken: newRefreshToken };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token has expired');
      }
      throw new Error('Invalid refresh token');
    }
  }

  static async logout(token: string, refreshToken?: string): Promise<void> {
    let userId: string | null = null;
    try {
      const decoded = jwt.decode(token) as { id: string; exp: number } | null;
      if (decoded && decoded.id && decoded.exp) {
        userId = decoded.id;
        const remainingTime = decoded.exp - Math.floor(Date.now() / 1000);
        if (remainingTime > 0) {
          const key = `blacklist:${token}`;
          await redisClient.set(key, '1', { EX: remainingTime });
        }
      }
    } catch {
      // Ignore decoding errors
    }

    // Remove refresh token if provided
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, getJwtSecret()) as { id: string };
        await redisClient.del(`refresh_token:${decoded.id}`);
        if (!userId) {
          userId = decoded.id;
        }
      } catch {
        // Token might already be invalid or Redis not available
      }
    }

    // Always remove the stored refresh token for this user
    if (userId) {
      try {
        await redisClient.del(`refresh_token:${userId}`);
      } catch {
        // Redis not available
      }
    }
  }

  static async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const result = await redisClient.get(`blacklist:${token}`);
      return result !== null;
    } catch {
      // Redis not available, assume token is not blacklisted
      return false;
    }
  }

  static async verifyEmail(email: string, code: string): Promise<IUser> {
    const user = await User.findOne({ email }).select('+emailVerificationToken +emailVerificationExpires');
    if (!user) {
      throw new Error('User not found');
    }

    if (user.isEmailVerified) {
      throw new Error('Email is already verified');
    }

    if (!user.emailVerificationToken || user.emailVerificationToken !== code) {
      throw new Error('Invalid verification code');
    }

    if (!user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
      throw new Error('Verification code has expired');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    const userObj = user.toObject();
    delete (userObj as any).password;
    return userObj as IUser;
  }

  static async resendVerificationCode(email: string): Promise<void> {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }

    if (user.isEmailVerified) {
      throw new Error('Email is already verified');
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.emailVerificationToken = verificationCode;
    user.emailVerificationExpires = verificationExpires;
    await user.save();

    await EmailService.sendVerificationEmail(email, user.name, verificationCode);
  }
}
