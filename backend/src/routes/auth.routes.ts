import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/auth.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many attempts. Try again in 5 minutes.' },
});

router.post('/register', authLimiter, authController.register); // Public — always creates Coach role
router.post('/setup', authController.setupFirstAdmin);       // Public — blocked after first user exists
router.get('/setup-status', authController.getSetupStatus); // Public — check if first-time setup needed
router.post('/login', authLimiter, authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.put('/reset-password/:resetToken', authController.resetPassword);
router.put('/update-password', protect, authController.updatePassword);

export default router;
