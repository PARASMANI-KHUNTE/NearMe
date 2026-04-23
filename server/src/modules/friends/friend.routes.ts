import { Router } from 'express';
import { FriendController } from './friend.controller';
import { requireAuth } from '../../shared/middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.post('/request', FriendController.sendRequest);
router.get('/requests', FriendController.listPendingRequests);
router.post('/request/:requestId/accept', FriendController.acceptRequest);
router.post('/request/:requestId/reject', FriendController.rejectRequest);
router.get('/', FriendController.listFriends);

export default router;
