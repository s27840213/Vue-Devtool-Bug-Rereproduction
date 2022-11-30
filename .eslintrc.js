module.exports = {
  root: true,

  env: {
    node: true
  },

  extends: [
    'plugin:vue/vue3-essential',
    '@vue/standard',
    '@vue/typescript/recommended'
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
    'vue/no-mutating-props': 0,
    'multiline-ternary': 'off',
    'vue/multi-word-component-names': 'off',
    'prefer-regex-literals': 'off',
    'indent': 'off',
    'no-empty': 'off',
    'no-unreachable-loop': 'off'
    // 'comma-dangle': ['error', 'never'],
    // semi: 'off',
    // 'import/no-dynamic-require': 'off',
    // 'global-require': 0,
    // 'no-shadow': 'off',
    // '@typescript-eslint/no-explicit-any': 'off'
  }
}
