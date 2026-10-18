import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

// Reglas en "warn": el código existente no se reescribe, el linter solo avisa.
export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'data/**', 'uploads/**', 'coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node, ...globals.jest } },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'warn',
    },
  },
  prettier,
);
