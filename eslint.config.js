// ESLint flat config (ESLint 9). Extends Expo's shared config and disables
// stylistic rules that Prettier owns, so lint focuses on correctness only.
const expoConfig = require('eslint-config-expo/flat');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = [
  ...expoConfig,
  eslintConfigPrettier,
  {
    ignores: [
      'dist/*',
      'node_modules/*',
      '.expo/*',
      'coverage/*',
      'assets/*',
      'babel.config.js',
      'metro.config.js',
    ],
  },
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // The headless demo is a console program; logging is its whole point.
    files: ['scripts/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },
];
