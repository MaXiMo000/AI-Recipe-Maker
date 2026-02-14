import { Router } from 'express';
import { recipeController } from './recipeController';
import { authenticateToken, optionalAuth } from './auth';
import { aiGenerationLimiter, standardLimiter } from './rateLimiter';

const router = Router();

// Generate recipes (requires auth + rate limiting)
router.post(
  '/generate',
  authenticateToken,
  aiGenerationLimiter,
  recipeController.generateRecipe
);

router.post(
  '/modify/:id',
  authenticateToken,
  aiGenerationLimiter,
  recipeController.modifyRecipe
);

router.post(
  '/suggestions',
  authenticateToken,
  standardLimiter,
  recipeController.getSuggestions
);

// CRUD operations
router.get(
  '/',
  optionalAuth,
  standardLimiter,
  recipeController.getRecipes
);

router.get(
  '/:id',
  optionalAuth,
  recipeController.getRecipeById
);

router.post(
  '/',
  authenticateToken,
  standardLimiter,
  recipeController.createRecipe
);

router.put(
  '/:id',
  authenticateToken,
  recipeController.updateRecipe
);

router.delete(
  '/:id',
  authenticateToken,
  recipeController.deleteRecipe
);

// Favorites
router.post(
  '/:id/favorite',
  authenticateToken,
  recipeController.addToFavorites
);

router.delete(
  '/:id/favorite',
  authenticateToken,
  recipeController.removeFromFavorites
);

router.get(
  '/favorites/list',
  authenticateToken,
  recipeController.getFavorites
);

export default router;
