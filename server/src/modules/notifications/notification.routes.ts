import { Router, Response } from 'express';
import { Notification } from './notification.model';
import { requireAuth, AuthRequest } from '../../shared/middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

// Get user's notifications
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({ recipientId: userId })
      .populate('senderId', 'name email picture')
      .sort({ createdAt: -1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      data: notifications,
      message: 'Notifications retrieved successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching notifications',
    });
  }
});

export default router;