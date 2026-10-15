import globals from 'globals';
import tseslint from 'typescript-eslint';
import {defineConfig} from 'eslint/config';
import stylistic from '@stylistic/eslint-plugin';

export default defineConfig([
  {
    ignores: ['**/node_modules/**', '**/dist/**'],
  },
  {
    files: ['**/*.{js,ts}'],
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      ...stylistic.configs.recommended.rules,
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/quotes': ['error', 'single'],
      '@stylistic/object-curly-spacing': ['error', 'never'],
      '@stylistic/brace-style': ['error', '1tbs'],
      '@stylistic/arrow-parens': ['error', 'always'],
    },
    languageOptions: {
      globals: {
        ...globals.vitest,
      },
      parserOptions: {
        projects: [
          './tsconfig.json',
        ],
      },
    },
  },
  tseslint.configs.recommended,
]);
