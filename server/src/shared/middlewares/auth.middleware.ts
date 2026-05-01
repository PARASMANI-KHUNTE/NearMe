import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../../modules/users/user.model';
import { getJwtSecret } from '../config';

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
    res.status(401).json({ success: false, message: 'Unauthorized - Invalid token' });
  }
};

// Alias for routes that use authenticateToken naming
export const authenticateToken = requireAuth;
