import { fixupConfigRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import { defineConfig } from 'eslint/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  {
    extends: fixupConfigRules(compat.extends('@react-native', 'prettier')),
    plugins: { prettier },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'prettier/prettier': 'error',
      // disable rules that may not be available in every package
      'import/first': 'off',
    },
  },
  {
    // ignore build artifacts, workspace tooling, and config itself
    ignores: [
      'node_modules/',
      'lib/',
      '.yarn/**',
      'eslint.config.mjs',
      'example/jest.setup.js',
    ],
  },
  {
    // enable jest globals for example code
    files: ['example/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: { jest: 'readonly' },
    },
  },
]);
