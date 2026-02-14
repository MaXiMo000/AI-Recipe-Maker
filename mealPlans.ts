import { Router } from 'express';
import { authenticateToken } from './auth';
import { aiGenerationLimiter, standardLimiter } from './rateLimiter';
import { mealPlanController } from './mealPlanController';

const router = Router();

router.post('/generate', authenticateToken, aiGenerationLimiter, mealPlanController.generate);
router.get('/', authenticateToken, standardLimiter, mealPlanController.list);

// :id/shopping-list before :id so "shopping-list" is not captured as id
router.get('/:id/shopping-list', authenticateToken, mealPlanController.getShoppingList);
router.get('/:id', authenticateToken, mealPlanController.getById);
router.put('/:id', authenticateToken, mealPlanController.update);
router.delete('/:id', authenticateToken, mealPlanController.delete);

export default router;
