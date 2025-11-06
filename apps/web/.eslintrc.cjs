/* eslint-env node */
// ESLint configuration for the web app. Focus: catch duplicate route handlers.
module.exports = {
  root: true,
  env: { es2022: true, browser: true, node: true },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  ignorePatterns: [
    'dist/',
    'build/',
    '.react-router/',
    'public/',
  ],
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      extends: ['plugin:@typescript-eslint/recommended'],
      rules: {
        'no-redeclare': 'off',
        '@typescript-eslint/no-redeclare': ['error'],
      },
    },
    {
      // Route files: ensure no duplicate handler names (e.g., multiple GET/POST)
      files: ['src/app/api/**/route.{js,ts}'],
      rules: {
        'no-redeclare': ['error', { builtinGlobals: true }],
        // Keep lint focused on structural mistakes; many route stubs are scaffolded
        'import/no-unresolved': 'off',
        'no-unused-vars': 'off',
        'no-empty': 'off',
        'no-useless-escape': 'off',
      },
    },
  ],
  plugins: ['import'],
  extends: ['eslint:recommended', 'plugin:import/recommended'],
  rules: {
    'import/no-duplicates': 'error',
  },
};
