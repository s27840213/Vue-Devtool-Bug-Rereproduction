module.exports = {
  root: true,
  plugins: [
    'cypress'
  ],
  env: {
    'cypress/globals': true,
    node: true
  },

  extends: [
    'plugin:vue/vue3-essential',
    '@vue/standard',
    '@vue/typescript/recommended',
    'plugin:cypress/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2020
  },

  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'space-before-function-paren': 0,
    '@typescript-eslint/no-var-requires': 0,
    camelcase: 'off',
    '@typescript-eslint/no-non-null-assertion': 0,
    'multiline-ternary': 'off',
    'vue/multi-word-component-names': 'off',
    'comma-dangle': ['error', 'only-multiline'],
    'cypress/no-unnecessary-waiting': 'off',
    // semi: 'off',
    // 'import/no-dynamic-require': 'off',
    // 'global-require': 0,
    // 'no-shadow': 'off',
    // '@typescript-eslint/no-explicit-any': 'off'
  }
}
