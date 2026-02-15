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
  const { connectDatabase, initializeSchema } = await import('../database');
  const { runTheMealDBUpdate } = await import('../themealdbUpdate');

  console.log('Connecting to database...');
  await connectDatabase();
  await initializeSchema();

  const { updated, notFound } = await runTheMealDBUpdate();
  console.log(`Done. Updated ${updated} recipes, ${notFound} had no matching title in DB.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('TheMealDB update failed:', err instanceof Error ? err.message : err);
  if (err instanceof Error && err.stack) console.error(err.stack);
  process.exit(1);
});
