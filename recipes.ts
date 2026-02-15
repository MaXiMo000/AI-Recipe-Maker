import { Router, RequestHandler } from 'express';
import { recipeController } from './recipeController';
import { authenticateToken, optionalAuth } from './auth';
import { aiGenerationLimiter, standardLimiter } from './rateLimiter';
import { checkAiDailyLimit } from './aiDailyLimit';

const auth = authenticateToken as RequestHandler;
const router = Router();

// Generate recipes (auth + per-user daily AI limit + per-IP rate limit)
router.post(
  '/generate',
  auth,
  (req, res, next) => { void checkAiDailyLimit(req as import('./auth').AuthRequest, res, next).catch(next); },
  aiGenerationLimiter,
  recipeController.generateRecipe
);

router.post(
  '/modify/:id',
  auth,
  (req, res, next) => { void checkAiDailyLimit(req as import('./auth').AuthRequest, res, next).catch(next); },
  aiGenerationLimiter,
  recipeController.modifyRecipe
);

router.post(
  '/suggestions',
  auth,
  standardLimiter,
  recipeController.getSuggestions
);

// CRUD operations
router.get(
  '/',
  optionalAuth as RequestHandler,
  standardLimiter,
  recipeController.getRecipes
);

// Must be before /:id so "favorites" is not treated as recipe id
router.get(
  '/favorites/list',
  auth,
  recipeController.getFavorites
);

router.get(
  '/:id',
  optionalAuth as RequestHandler,
  recipeController.getRecipeById
);

router.post(
  '/',
  auth,
  standardLimiter,
  recipeController.createRecipe
);

router.put(
  '/:id',
  auth,
  recipeController.updateRecipe
);

router.delete(
  '/:id',
  auth,
  recipeController.deleteRecipe
);

// Favorites
router.post(
  '/:id/favorite',
  auth,
  recipeController.addToFavorites
);

router.delete(
  '/:id/favorite',
  auth,
  recipeController.removeFromFavorites
);

export default router;
