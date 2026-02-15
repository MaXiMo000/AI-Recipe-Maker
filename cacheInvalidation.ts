import { cache } from './redis';

const RECIPE_PREFIX = 'recipe:';
const RECIPES_USER_PREFIX = 'recipes:user:';
const RECIPES_LIST_PATTERN = 'recipes:list:*';
const SEARCH_RECIPES_PATTERN = 'search:recipes:*';
const MEAL_PLAN_PREFIX = 'meal-plan:';
const MEAL_PLANS_USER_PREFIX = 'meal-plans:user:';
const NUTRITION_DAILY_PATTERN_PREFIX = 'nutrition:daily:';

/**
 * Invalidate list/search and user recipe caches (e.g. after create).
 */
export async function invalidateRecipeForUser(userId: string): Promise<void> {
  await cache.del(`${RECIPES_USER_PREFIX}${userId}`);
  await cache.delByPattern(RECIPES_LIST_PATTERN);
  await cache.delByPattern(SEARCH_RECIPES_PATTERN);
}

/**
 * Invalidate all cache entries affected by a recipe change (update/delete).
 */
export async function invalidateRecipe(recipeId: string, userId: string): Promise<void> {
  await cache.del(`${RECIPE_PREFIX}${recipeId}`);
  await invalidateRecipeForUser(userId);
}

/**
 * Invalidate all cache entries affected by a meal plan change (create/update/delete).
 */
export async function invalidateMealPlan(mealPlanId: string, userId: string): Promise<void> {
  await cache.del(`${MEAL_PLAN_PREFIX}${mealPlanId}`);
  await cache.del(`${MEAL_PLANS_USER_PREFIX}${userId}`);
  await invalidateNutritionDaily(userId);
}

/**
 * Invalidate daily nutrition cache for a user (e.g. after profile or meal plan changes).
 */
export async function invalidateNutritionDaily(userId: string): Promise<void> {
  await cache.delByPattern(`${NUTRITION_DAILY_PATTERN_PREFIX}${userId}:*`);
}
