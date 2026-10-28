import { Router } from 'express';
import { requireAuth } from '../../shared/middlewares/auth.middleware';
import { NotificationController } from './notification.controller';

const router = Router();

router.use(requireAuth);

// Get user's notifications
router.get('/', NotificationController.getNotifications);

// Get unread count (must be before /:id routes)
router.get('/unread-count', NotificationController.getUnreadCount);

// Mark notification as read
router.patch('/:id/read', NotificationController.markAsRead);

// Mark all as read
router.patch('/read-all', NotificationController.markAllAsRead);

export default router;