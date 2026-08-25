/** TypeScript-aware jest. There was no config at all before, and `npm test`
 *  exited 1 with "No tests found". */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  // The seed scripts talk to TheMealDB and the database; nothing here does.
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/frontend/'],
  clearMocks: true,
};
