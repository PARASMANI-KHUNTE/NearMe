import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, IUser } from '../users/user.model';
import { getJwtSecret } from '../../shared/config/env';

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

  static async verifyGoogleTokenAndLogin(idToken: string): Promise<{ user: IUser; token: string }> {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: [
        process.env.GOOGLE_CLIENT_ID || '',
        process.env.ANDROID_GOOGLE_CLIENT_ID || '',
        process.env.IOS_GOOGLE_CLIENT_ID || '',
      ].filter(Boolean),
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error('Invalid Google token');
    }

    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ email });

    if (user) {
      // If user exists but doesn't have googleId linked, link it
      if (!user.googleId) {
        user.googleId = googleId;
        if (picture && !user.picture) user.picture = picture;
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
    return { user, token };
  }

  private static generateToken(userId: string): string {
    return jwt.sign({ id: userId }, getJwtSecret(), {
      expiresIn: '30d',
    });
  }
}
