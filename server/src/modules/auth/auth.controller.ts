// AuthController handles HTTP requests for authentication
import { Request, Response } from 'express';
import { AuthService } from './auth.service';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name } = req.body;
      
      if (!email || !password || !name) {
        res.status(400).json({ success: false, message: 'Email, password and name are required' });
        return;
      }

      const { user, token } = await AuthService.register({ email, password, name });

      res.status(201).json({
        success: true,
        data: { user, token },
        message: 'User registered successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Registration failed',
      });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ success: false, message: 'Email and password are required' });
        return;
      }

      const { user, token } = await AuthService.login(email, password);

      res.status(200).json({
        success: true,
        data: { user, token },
        message: 'Login successful',
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message || 'Login failed',
      });
    }
  }

  static async googleLogin(req: Request, res: Response): Promise<void> {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        res.status(400).json({ success: false, message: 'idToken is required' });
        return;
      }

      const { user, token } = await AuthService.verifyGoogleTokenAndLogin(idToken);

      res.status(200).json({
        success: true,
        data: { user, token },
        message: 'Login successful',
      });
    } catch (error: any) {
      console.error('Google login error:', error);
      res.status(401).json({
        success: false,
        message: error.message || 'Authentication failed',
      });
    }
  }

  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ success: false, message: 'Email is required' });
        return;
      }

      const result = await AuthService.forgotPassword(email);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        res.status(400).json({ success: false, message: 'Token and password are required' });
        return;
      }

      const { user, token: newToken } = await AuthService.resetPassword(token, password);
      res.status(200).json({
        success: true,
        data: { user, token: newToken },
        message: 'Password reset successful',
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
