import { Router } from 'express';
import { authenticateToken } from './auth';
import { standardLimiter } from './rateLimiter';
import { nutritionController } from './nutritionController';

const nutritionRouter = Router();
const searchRouter = Router();

nutritionRouter.post('/analyze', authenticateToken, standardLimiter, nutritionController.analyze);
nutritionRouter.get('/daily-summary', authenticateToken, nutritionController.dailySummary);
nutritionRouter.post('/calculate', authenticateToken, nutritionController.calculate);

// Search routes
searchRouter.get('/recipes', standardLimiter, (_req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

searchRouter.get('/ingredients', standardLimiter, (_req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

searchRouter.get('/similar', standardLimiter, (_req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

export { nutritionRouter as default, searchRouter };
