/**
 * Standalone script to seed curated recipes (user_id = NULL).
 * Run: npm run seed:curated  (or npx ts-node scripts/seedCuratedRecipes.ts)
 * Safe to re-run: skips if curated recipes already exist.
 * On Render, curated recipes are also seeded automatically on first app startup.
 */
import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase, initializeSchema } from '../database';
import { runCuratedSeed } from '../runCuratedSeed';

async function main() {
  await connectDatabase();
  await initializeSchema();
  await runCuratedSeed();
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
