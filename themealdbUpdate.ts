/**
 * Shared logic: re-fetch from TheMealDB and UPDATE existing curated recipes (by title).
 * Used by scripts/updateTheMealDBRecipes.ts and by the admin HTTP endpoint.
 */
import { query } from './database';
import { fetchAllTheMealDBMeals, mapMealToRecipe } from './scripts/themealdbFetch';
import { logger } from './logger';

export async function runTheMealDBUpdate(): Promise<{ updated: number; notFound: number }> {
  logger.info('TheMealDB update: fetching from API...');
  const meals = await fetchAllTheMealDBMeals();
  logger.info(`TheMealDB update: fetched ${meals.length} meals, updating DB...`);

  let updated = 0;
  let notFound = 0;
  for (const meal of meals) {
    const r = mapMealToRecipe(meal);
    const result = await query(
      `UPDATE recipes SET
        description = $1,
        ingredients = $2,
        instructions = $3,
        cuisine_type = $4,
        meal_type = $5,
        tags = $6,
        image_url = $7,
        updated_at = NOW()
      WHERE user_id IS NULL AND title = $8`,
      [
        r.description,
        JSON.stringify(r.ingredients),
        JSON.stringify(r.instructions),
        r.cuisine_type,
        r.meal_type,
        JSON.stringify(r.tags || []),
        r.image_url,
        r.title,
      ]
    );
    if (result.rowCount && result.rowCount > 0) updated++;
    else notFound++;
  }

  logger.info(`TheMealDB update done: ${updated} updated, ${notFound} not found`);
  return { updated, notFound };
}
