import express from 'express';
import chatController from '../controllers/chatController.js';
import verifyToken from '../middlewares/authMiddleware.js';

const router = express.Router();

// Apply the verifyToken middleware to all routes in this router
router.use(verifyToken);

router.get('/', chatController.index);

export default router;
