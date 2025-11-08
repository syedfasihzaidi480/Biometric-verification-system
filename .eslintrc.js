module.exports = {
  root: true,
  env: { es2022: true, node: true },
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  ignorePatterns: ['**/dist/**', '**/build/**', '**/.expo/**', '**/caches/**'],
  extends: [
    'eslint:recommended',
    'plugin:import/recommended',
    'plugin:sonarjs/recommended',
    'plugin:unicorn/recommended',
    'plugin:jsdoc/recommended-typescript',
    'prettier'
  ],
  plugins: ['import', 'sonarjs', 'unicorn', 'jsdoc'],
  settings: {
    'import/resolver': {
      node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] }
    }
  },
  rules: {
    'unicorn/prevent-abbreviations': 'off',
    'unicorn/filename-case': 'off',
    'import/no-unresolved': 'off'
  }
}
