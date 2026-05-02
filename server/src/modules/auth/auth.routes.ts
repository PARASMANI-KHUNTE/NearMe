import { Request, Router } from 'express';
import { z } from 'zod';
import { AuthController } from './auth.controller';
import { requireAuth } from '../../shared/middlewares/auth.middleware';
import { validateRequest } from '../../shared/middlewares/validateRequest';
import rateLimit from 'express-rate-limit';

const router = Router();

const getClientIp = (req: Request): string => {
  const forwardedFor = req.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string') {
    return forwardedFor.split(',')[0]?.trim() || req.ip || 'unknown';
  }

  return req.ip || 'unknown';
};

// Strict rate limiter for auth endpoints (prevents brute force)
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // only 5 attempts per 15 minutes
  keyGenerator: getClientIp,
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Zod validation schemas
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least 1 number'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/),
});

// Routes
// POST /api/auth/register - Register new user
router.post('/register', authRateLimiter, validateRequest(registerSchema, 'body'), AuthController.register);

// POST /api/auth/login - Login user
router.post('/login', authRateLimiter, validateRequest(loginSchema, 'body'), AuthController.login);

// POST /api/auth/google - Google OAuth login
router.post('/google', authRateLimiter, AuthController.googleLogin);

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', authRateLimiter, validateRequest(forgotPasswordSchema, 'body'), AuthController.forgotPassword);

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', authRateLimiter, validateRequest(resetPasswordSchema, 'body'), AuthController.resetPassword);

// POST /api/auth/logout - Logout user
router.post('/logout', requireAuth, AuthController.logout);

export default router;
