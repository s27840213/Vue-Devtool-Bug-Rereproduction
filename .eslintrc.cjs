/* For monorepo */
require('@rushstack/eslint-patch/modern-module-resolution')

// npm_lifecycle_script will be undefined in vscode,
// and be build/serve command when using vue-cli
// So this function will return off when using vue-cli
function offInCommand(value) {
  return process.env.npm_lifecycle_script ? 'off' : value
}

module.exports = {
  root: true,
  parser: 'vue-eslint-parser',
  plugins: ['cypress', 'unused-imports', 'sonarjs'],
  extends: [
    'plugin:vue/vue3-essential',
    'plugin:vue-pug/vue3-recommended',
    'eslint:recommended',
    '@vue/standard',
    '@vue/typescript/recommended',
    'plugin:cypress/recommended',
    '@vue/eslint-config-typescript',
    '@vue/eslint-config-prettier/skip-formatting'
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  // to prevent commitlint.config.js to throw error
  env: {
    'cypress/globals': true,
    node: true,
    'vue/setup-compiler-macros': true
  },
  rules: {
    'no-console': 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'space-before-function-paren': 0,
    '@typescript-eslint/no-var-requires': 0,
    camelcase: 'off',
    '@typescript-eslint/no-non-null-assertion': 0,
    'multiline-ternary': 'off',
    'vue/multi-word-component-names': 'off',
    'vue/no-ref-object-reactivity-loss': 'error',
    'comma-dangle': ['error', 'only-multiline'],
    'cypress/no-unnecessary-waiting': 'off',

    // unused-imports is similar to @typescript-eslint/no-unused-vars
    // But unused-imports can auto remove unused import
    // So use unused-imports instead of @typescript-eslint/no-unused-vars
    'unused-imports/no-unused-imports': 'warn',
    'unused-imports/no-unused-vars': offInCommand('warn'),
    '@typescript-eslint/no-unused-vars': 'off',

    '@typescript-eslint/no-explicit-any': offInCommand('warn'),
    // Require explicit function return type
    '@typescript-eslint/explicit-module-boundary-types': 'off',

    'vue/no-unused-properties': [
      'error',
      {
        groups: ['props', 'data', 'computed', 'methods'],
        deepData: true,
        ignorePublicMembers: false
      }
    ],
    'sonarjs/cognitive-complexity': [offInCommand('warn'), 15]
  }
}
