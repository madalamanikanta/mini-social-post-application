import express from 'express';
import authRouter from './auth.js';
import postsRouter from './posts.js';
import usersRouter from './users.js';
import { getStatus } from '../controllers/rootController.js';

const router = express.Router();

router.get('/', getStatus);
router.use('/auth', authRouter);
router.use('/posts', postsRouter);
router.use('/users', usersRouter);

export default router;
