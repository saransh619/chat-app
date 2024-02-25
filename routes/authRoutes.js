import express from 'express';
import authController from '../controllers/authController.js';

const router = express.Router();

router.get('/signup', (req, res) => {
  res.render('signup', { error: null });
});

router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

export default router;
