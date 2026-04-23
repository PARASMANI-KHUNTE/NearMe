import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { User } from '../../modules/users/user.model';
import { getJwtSecret } from '../config/env';

dotenv.config();

export interface AuthRequest extends Request {
  user?: any;
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Unauthorized - No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = getJwtSecret();
    
    const decoded = jwt.verify(token, jwtSecret) as { id: string };
    const user = await User.findById(decoded.id).select('-__v');

    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized - User not found' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Missing required environment variable:')) {
      res.status(500).json({ success: false, message: 'Server misconfigured' });
      return;
    }
    res.status(401).json({ success: false, message: 'Unauthorized - Invalid token' });
  }
};
