import { Router, RequestHandler } from 'express';
import { optionalAuth } from './auth';
import { standardLimiter } from './rateLimiter';
import { searchController } from './searchController';

const optionalAuthHandler = optionalAuth as RequestHandler;
const router = Router();

router.get('/recipes', optionalAuthHandler, standardLimiter, searchController.searchRecipes);
router.get('/ingredients', standardLimiter, searchController.searchIngredients);
router.get('/similar', optionalAuthHandler, standardLimiter, searchController.similar);

export default router;
