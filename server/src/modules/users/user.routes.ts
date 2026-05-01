import { Router } from 'express';
import { z } from 'zod';
import { UserController } from './user.controller';
import { requireAuth } from '../../shared/middlewares/auth.middleware';
import { validateRequest } from '../../shared/middlewares/validateRequest';

const router = Router();

const updateSettingsSchema = z.object({
  radius: z.number().min(1).max(5000).optional(),
  locationSharingEnabled: z.boolean().optional(),
  shareLocation: z.boolean().optional(),
  invisibleMode: z.boolean().optional(),
});

const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(100),
});

// Retrieve profile
router.get('/profile', requireAuth, UserController.getProfile);

// Alias: /users/me → same as /users/profile (for mobile compatibility)
router.get('/me', requireAuth, UserController.getProfile);

// Update user settings
router.patch('/settings', requireAuth, validateRequest(updateSettingsSchema, 'body'), UserController.updateSettings);

// Search users by uniqueId
router.get('/search', requireAuth, validateRequest(searchQuerySchema, 'query'), UserController.searchUsers);

// Get shareable profile link
router.get('/share', requireAuth, UserController.getShareProfile);

export default router;
