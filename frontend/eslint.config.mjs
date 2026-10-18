import { FlatCompat } from '@eslint/eslintrc';
import prettier from 'eslint-config-prettier';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

// Reglas en "warn": el código existente no se reescribe, el linter solo avisa.
const config = [
  { ignores: ['postcss.config.mjs', '.next/**', 'node_modules/**', 'next-env.d.ts'] },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'react-hooks/exhaustive-deps': 'warn',
      'react/no-unescaped-entities': 'off',
    },
  },
  prettier,
];

export default config;
