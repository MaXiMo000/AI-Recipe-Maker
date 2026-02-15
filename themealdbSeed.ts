/**
 * Shared logic: fetch from TheMealDB and INSERT as curated recipes.
 * Used by scripts/seedTheMealDB.ts and by the admin HTTP endpoint.
 */
import { query } from './database';
import { fetchAllTheMealDBMeals, mapMealToRecipe } from './scripts/themealdbFetch';
import { logger } from './logger';

const MIN_CURATED_TO_SKIP = 100;

export async function runTheMealDBSeed(): Promise<{ inserted: number; skipped: boolean }> {
  const countResult = await query(
    'SELECT COUNT(*) AS n FROM recipes WHERE user_id IS NULL'
  );
  const existing = parseInt(String(countResult.rows[0]?.n ?? 0), 10);
  if (existing >= MIN_CURATED_TO_SKIP) {
    logger.info(`TheMealDB seed: already ${existing} curated recipes, skipping insert`);
    return { inserted: 0, skipped: true };
  }

  logger.info('TheMealDB seed: fetching from API...');
  const meals = await fetchAllTheMealDBMeals();
  logger.info(`TheMealDB seed: fetched ${meals.length} meals, inserting...`);

  let inserted = 0;
  for (const meal of meals) {
    try {
      const r = mapMealToRecipe(meal);
      await query(
        `INSERT INTO recipes (
          user_id, title, description, cuisine_type, meal_type, difficulty,
          prep_time, cook_time, servings, ingredients, instructions,
          nutritional_info, tags, image_url, source, is_public
        ) VALUES (NULL, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NULL, $11, $12, 'curated', true)`,
        [
          r.title,
          r.description,
          r.cuisine_type,
          r.meal_type,
          r.difficulty,
          r.prep_time,
          r.cook_time,
          r.servings,
          JSON.stringify(r.ingredients),
          JSON.stringify(r.instructions),
          JSON.stringify(r.tags || []),
          r.image_url,
        ]
      );
      inserted++;
      if (inserted % 50 === 0) logger.info(`TheMealDB seed: inserted ${inserted}/${meals.length}...`);
    } catch (err) {
      logger.warn('TheMealDB seed: skip duplicate or error', { title: (meal as { strMeal?: string }).strMeal, err });
    }
  }

  logger.info(`TheMealDB seed done: inserted ${inserted}`);
  return { inserted, skipped: false };
}
