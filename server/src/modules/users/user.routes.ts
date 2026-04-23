import { Router } from 'express';
import { UserController } from './user.controller';
import { requireAuth } from '../../shared/middlewares/auth.middleware';

const router = Router();

// Retrieve profile
router.get('/profile', requireAuth, UserController.getProfile);

// Update user settings
router.patch('/settings', requireAuth, UserController.updateSettings);

// Search users by uniqueId
router.get('/search', requireAuth, UserController.searchUsers);

// Get shareable profile link
router.get('/share', requireAuth, UserController.getShareProfile);

export default router;
