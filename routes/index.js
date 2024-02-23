import express from 'express';
import authController from '../controllers/authController.js';
import chatController from '../controllers/chatController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import multer from 'multer';

const router = express.Router();

// Auth Routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.use(authMiddleware.verifyToken);

// Chat Routes
router.post('/send', chatController.sendMessage);
router.get('/messages', chatController.getMessages);
router.put('/edit/:messageId', chatController.editMessage);
router.delete('/delete/:messageId', chatController.deleteMessage);
router.post('/upload', chatController.uploadFile);

export default router;