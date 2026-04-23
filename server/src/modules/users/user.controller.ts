import { Response } from 'express';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import { UserService } from './user.service';
import { User } from './user.model';

export class UserController {
  static async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user._id;
      const user = await UserService.getProfile(userId);
      
      res.status(200).json({
        success: true,
        data: user,
        message: 'Profile retrieved successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching profile',
      });
    }
  }

  static async updateSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user._id;
      const { radius, locationSharingEnabled } = req.body;

      const updatedUser = await UserService.updateSettings(userId, {
        radius,
        locationSharingEnabled,
      });

      res.status(200).json({
        success: true,
        data: updatedUser,
        message: 'Settings updated successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error updating settings',
      });
    }
  }

  static async searchUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Search query is required',
        });
        return;
      }

      const users = await UserService.searchUsers(q);

      res.status(200).json({
        success: true,
        data: users,
        message: 'Users found',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error searching users',
      });
    }
  }

  static async getShareProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await User.findById(req.user._id).select('uniqueId name picture');
      
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          uniqueId: user.uniqueId,
          shareUrl: `nearme://add/${user.uniqueId}`,
          name: user.name,
          picture: user.picture,
        },
        message: 'Share profile data',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error getting share profile',
      });
    }
  }
}
