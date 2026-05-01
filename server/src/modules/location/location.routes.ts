import { Router } from 'express';
import { z } from 'zod';
import { LocationController } from './location.controller';
import { requireAuth } from '../../shared/middlewares/auth.middleware';
import { validateRequest } from '../../shared/middlewares/validateRequest';

const router = Router();

// Zod validation schemas
const updateLocationSchema = z.object({
  longitude: z.number().min(-180).max(180),
  latitude: z.number().min(-90).max(90),
});

const nearbyQuerySchema = z.object({
  lat: z.string().regex(/^-?\d+(\.\d+)?$/).transform(Number),
  lng: z.string().regex(/^-?\d+(\.\d+)?$/).transform(Number),
  radius: z.string().regex(/^\d+$/).transform(Number).optional(),
});

// POST /api/location/update - Update user location
router.post('/update', requireAuth, validateRequest(updateLocationSchema, 'body'), LocationController.updateLocation);

// GET /api/location/nearby - Get nearby friends (1m to 5km radius)
router.get('/nearby', requireAuth, validateRequest(nearbyQuerySchema, 'query'), LocationController.getNearbyUsers);

// GET /api/location/friends-status - Get friends location status
router.get('/friends-status', requireAuth, LocationController.getFriendsLocationStatus);

export default router;