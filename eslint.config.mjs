// ESLint covers only the new TypeScript code. Legacy classic scripts (*.js in the root) are not linted: they are scheduled for migration.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['eslint.config.mjs', 'dist/**', 'node_modules/**', '*.js', 'tests/**/*.js', 'playwright-report/**', 'test-results/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    files: ['src/**/*.ts', 'tests/**/*.ts', 'vite.config.mts', 'playwright.config.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-empty': ['error', { allowEmptyCatch: false }],
      eqeqeq: ['error', 'always'],
    },
  },
  { files: ['tests/e2e/**/*.ts'], rules: { '@typescript-eslint/no-explicit-any': 'off' } },
);
