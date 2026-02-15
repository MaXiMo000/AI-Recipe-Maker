/**
 * Fetch ~300–600 recipes from TheMealDB (free API) and insert as curated (user_id = NULL).
 * Run: npm run seed:themealdb
 * Requires: DATABASE_URL in .env (or environment). DB must be reachable.
 * Safe to re-run: skips if curated count is already >100.
 */
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('Missing DATABASE_URL in .env. Add it and run again.');
  process.exit(1);
}

console.log('Starting TheMealDB seed...');

const MIN_CURATED_TO_SKIP = 100;

async function main() {
  const { connectDatabase, initializeSchema, query } = await import('../database');
  const { fetchAllTheMealDBMeals, mapMealToRecipe } = await import('./themealdbFetch');

  console.log('Connecting to database...');
  await connectDatabase();
  await initializeSchema();

  const countResult = await query(
    'SELECT COUNT(*) AS n FROM recipes WHERE user_id IS NULL'
  );
  const existing = parseInt(String(countResult.rows[0]?.n ?? 0), 10);
  if (existing >= MIN_CURATED_TO_SKIP) {
    console.log(`Already ${existing} curated recipes. Skipping TheMealDB fetch (run seed:import for more).`);
    process.exit(0);
    return;
  }

  console.log('Fetching recipes from TheMealDB...');
  const meals = await fetchAllTheMealDBMeals();
  console.log(`Fetched ${meals.length} meals. Inserting...`);

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
      if (inserted % 50 === 0) console.log(`Inserted ${inserted}/${meals.length}...`);
    } catch (err) {
      console.warn('Skip duplicate or error:', (meal as any).strMeal, err);
    }
  }

  console.log(`Done. Inserted ${inserted} recipes from TheMealDB.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('TheMealDB seed failed:', err instanceof Error ? err.message : err);
  if (err instanceof Error && err.stack) console.error(err.stack);
  process.exit(1);
});
