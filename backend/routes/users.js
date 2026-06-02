import express from 'express';
import multer from 'multer';
import { protect, attachUser } from '../middleware/authMiddleware.js';
import { getUserProfile, getCurrentUser, updateCurrentUser, deleteCurrentUser, searchUsers, followUser, unfollowUser, getFollowers, getFollowing } from '../controllers/userController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/search', searchUsers);
router.get('/me', protect, getCurrentUser);
router.put('/me', protect, upload.single('avatar'), updateCurrentUser);
router.delete('/me', protect, deleteCurrentUser);
router.post('/:username/follow', protect, followUser);
router.delete('/:username/follow', protect, unfollowUser);
router.get('/:username/followers', getFollowers);
router.get('/:username/following', getFollowing);
router.get('/:username', attachUser, getUserProfile);

export default router;
