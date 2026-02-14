/**
 * Dev entry: run app.ts and print any load/start error so Docker logs show it.
 * Usage: node scripts/dev-entry.cjs
 */
function main() {
  try {
    require('ts-node/register');
    require('../app.ts');
  } catch (err) {
    console.error('\n[BOOT ERROR]');
    console.error(err && err.message ? err.message : err);
    if (err && err.stack) console.error(err.stack);
    if (err && err.errors) console.error('Validation errors:', JSON.stringify(err.errors, null, 2));
    process.exit(1);
  }
}
main();
