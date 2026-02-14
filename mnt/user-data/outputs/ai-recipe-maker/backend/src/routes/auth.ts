import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { authLimiter, standardLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/logout', authenticateToken, authController.logout);
router.get('/me', authenticateToken, authController.getCurrentUser);
router.put('/profile', authenticateToken, standardLimiter, authController.updateProfile);

export default router;
