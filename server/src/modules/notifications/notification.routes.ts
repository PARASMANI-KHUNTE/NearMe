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

// Mark notification as read
router.patch('/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipientId: userId },
      { read: true },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: notification,
      message: 'Notification marked as read',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error marking notification as read',
    });
  }
});

// Get unread count
router.get('/unread-count', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const count = await Notification.countDocuments({ recipientId: userId, read: false });

    res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching unread count',
    });
  }
});

// Mark all as read
router.patch('/read-all', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    
    await Notification.updateMany(
      { recipientId: userId, read: false },
      { read: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error marking all as read',
    });
  }
});

export default router;