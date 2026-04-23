import { Router } from 'express';
import { LocationController } from './location.controller';
import { requireAuth } from '../../shared/middlewares/auth.middleware';

const router = Router();

router.post('/update', requireAuth, LocationController.updateLocation);
router.get('/nearby', requireAuth, LocationController.getNearbyUsers);

export default router;
