import globals from 'globals';
import tseslint from 'typescript-eslint';
import {defineConfig} from 'eslint/config';
import stylistic from '@stylistic/eslint-plugin';
import {importX} from 'eslint-plugin-import-x';

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
  {
    // Type imports get their own statements, above the other imports and one blank line away.
    files: ['**/*.ts'],
    plugins: {
      'import-x': importX,
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', {
        prefer: 'type-imports',
        fixStyle: 'separate-type-imports',
      }],
      'import-x/consistent-type-specifier-style': ['error', 'prefer-top-level'],
      'import-x/order': ['error', {
        'groups': ['type', ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'unknown']],
        'newlines-between': 'always',
      }],
    },
  },
]);
