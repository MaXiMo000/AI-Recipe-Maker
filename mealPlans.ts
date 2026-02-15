import { Router, RequestHandler } from 'express';
import { authenticateToken } from './auth';
import { aiGenerationLimiter, standardLimiter } from './rateLimiter';
import { checkAiDailyLimit } from './aiDailyLimit';
import { mealPlanController } from './mealPlanController';

const auth = authenticateToken as RequestHandler;
const router = Router();

router.post('/generate', auth, (req, res, next) => { void checkAiDailyLimit(req as import('./auth').AuthRequest, res, next).catch(next); }, aiGenerationLimiter, mealPlanController.generate);
router.get('/', auth, standardLimiter, mealPlanController.list);

// :id/shopping-list before :id so "shopping-list" is not captured as id
router.get('/:id/shopping-list', auth, mealPlanController.getShoppingList);
router.get('/:id', auth, mealPlanController.getById);
router.put('/:id', auth, mealPlanController.update);
router.delete('/:id', auth, mealPlanController.delete);

export default router;
