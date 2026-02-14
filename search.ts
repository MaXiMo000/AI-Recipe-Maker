import { Router } from 'express';
import { optionalAuth } from './auth';
import { standardLimiter } from './rateLimiter';
import { searchController } from './searchController';

const router = Router();

router.get('/recipes', optionalAuth, standardLimiter, searchController.searchRecipes);
router.get('/ingredients', standardLimiter, searchController.searchIngredients);
router.get('/similar', optionalAuth, standardLimiter, searchController.similar);

export default router;
