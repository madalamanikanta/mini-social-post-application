import express from 'express';
import multer from 'multer';
import { attachUser, protect } from '../middleware/authMiddleware.js';
import {
  getPosts,
  createPost,
  getPostById,
  toggleLike,
  getComments,
  addComment,
  deleteComment,
  updatePost,
  deletePost,
  sharePost,
} from '../controllers/postController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', attachUser, getPosts);
router.post('/', protect, upload.single('image'), createPost);
router.get('/:id', attachUser, getPostById);
router.get('/:id/comments', attachUser, getComments);
router.patch('/:id/like', protect, toggleLike);
router.patch('/:id/share', protect, sharePost);
router.post('/:id/comments', protect, addComment);
router.put('/:id', protect, upload.single('image'), updatePost);
router.delete('/:id', protect, deletePost);
router.delete('/:id/comments/:commentId', protect, deleteComment);

export default router;
