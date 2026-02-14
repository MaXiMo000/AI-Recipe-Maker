import { Router, RequestHandler } from 'express';
import { authenticateToken } from './auth';
import { standardLimiter } from './rateLimiter';
import { nutritionController } from './nutritionController';

const auth = authenticateToken as RequestHandler;
const nutritionRouter = Router();
const searchRouter = Router();

nutritionRouter.post('/analyze', auth, standardLimiter, nutritionController.analyze);
nutritionRouter.get('/daily-summary', auth, nutritionController.dailySummary);
nutritionRouter.post('/calculate', auth, nutritionController.calculate);

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
