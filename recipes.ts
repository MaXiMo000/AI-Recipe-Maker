import { Router, RequestHandler } from 'express';
import { recipeController } from './recipeController';
import { authenticateToken, optionalAuth } from './auth';
import { aiGenerationLimiter, standardLimiter } from './rateLimiter';

const auth = authenticateToken as RequestHandler;
const router = Router();

// Generate recipes (requires auth + rate limiting)
router.post(
  '/generate',
  auth,
  aiGenerationLimiter,
  recipeController.generateRecipe
);

router.post(
  '/modify/:id',
  auth,
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

router.get(
  '/favorites/list',
  auth,
  recipeController.getFavorites
);

export default router;
