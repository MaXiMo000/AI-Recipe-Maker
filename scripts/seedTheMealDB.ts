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

async function main() {
  const { connectDatabase, initializeSchema } = await import('../database');
  const { runTheMealDBSeed } = await import('../themealdbSeed');

  console.log('Connecting to database...');
  await connectDatabase();
  await initializeSchema();

  const { inserted, skipped } = await runTheMealDBSeed();
  if (skipped) {
    console.log('Already 100+ curated recipes. Skipping TheMealDB fetch (run seed:import for more).');
  } else {
    console.log(`Done. Inserted ${inserted} recipes from TheMealDB.`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('TheMealDB seed failed:', err instanceof Error ? err.message : err);
  if (err instanceof Error && err.stack) console.error(err.stack);
  process.exit(1);
});
