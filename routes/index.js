import express from 'express';
import authRoutes from './authRoutes.js';
import chatRoutes from './chatRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/chat', chatRoutes);

export default router;
