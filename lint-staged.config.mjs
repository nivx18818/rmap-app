/**
 * @type {import('lint-staged').Configuration}
 */
export default {
  'apps/web/**/*.{ts,tsx,js}': ['pnpm --filter web exec eslint --fix', 'prettier --write'],
  'apps/api/**/*.{ts,js}': ['pnpm --filter api exec eslint --fix', 'prettier --write'],
  'packages/design-system/**/*.{ts,tsx,js}': [
    'pnpm --filter @repo/design-system exec eslint --fix',
    'prettier --write',
  ],
  '**/*.{js,jsx,ts,tsx,json,css,md,mdx,yml,yaml}': 'prettier --write',
};
