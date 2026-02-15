/**
 * Re-fetch recipes from TheMealDB and UPDATE already-imported curated recipes (matched by title).
 * Use this to refresh description, ingredients, instructions, image_url, etc. after the API or your schema changes.
 *
 * Run: npm run seed:themealdb:update   (local)
 * Prod: npm run seed:themealdb:update:prod
 */
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('Missing DATABASE_URL in .env. Add it and run again.');
  process.exit(1);
}

console.log('Starting TheMealDB update (re-fetch and update existing curated recipes)...');

async function main() {
  const { connectDatabase, initializeSchema, query } = await import('../database');
  const { fetchAllTheMealDBMeals, mapMealToRecipe } = await import('./themealdbFetch');

  console.log('Connecting to database...');
  await connectDatabase();
  await initializeSchema();

  console.log('Fetching recipes from TheMealDB...');
  const meals = await fetchAllTheMealDBMeals();
  console.log(`Fetched ${meals.length} meals. Updating matching recipes...`);

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
    if (result.rowCount && result.rowCount > 0) {
      updated++;
      if (updated % 100 === 0) console.log(`Updated ${updated}/${meals.length}...`);
    } else {
      notFound++;
    }
  }

  console.log(`Done. Updated ${updated} recipes, ${notFound} had no matching title in DB.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('TheMealDB update failed:', err instanceof Error ? err.message : err);
  if (err instanceof Error && err.stack) console.error(err.stack);
  process.exit(1);
});
