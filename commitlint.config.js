// https://commitlint.js.org/#/reference-rules
// [Level, Applicable, Value]
// Level [0..2]: 0 disables the rule. For 1 it will be considered a warning for 2 an error.
// Applicable always|never: never inverts the rule.
// Value: value to use for this rule.

/**
 * type(scope): subject
 * body?
 * footer?
 */

/**
 * Valid commit types:
 * feat(pic): hello world
 *
 * hello world too
 *
 * ISSUES CLOSED: #32
 */

module.exports = {
  parserPreset: 'conventional-changelog-conventionalcommits',
  rules: {
    'body-leading-blank': [1, 'always'],
    'body-max-line-length': [2, 'always', 100],
    'footer-leading-blank': [1, 'always'],
    'footer-max-line-length': [2, 'always', 100],
    'header-max-length': [2, 'always', 100],
    // 'subject-case': [
    // 	2,
    // 	'never',
    // 	['sentence-case', 'start-case', 'pascal-case', 'upper-case'],
    // ],
    'subject-empty': [2, 'never'],
    // subject should not end with "."
    'subject-full-stop': [2, 'never', '.'],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'perf', 'refactor']],
    'scope-enum': [2, 'always', ['pic', 'stk', 'aipe', '']],
    'scope-case': [2, 'always', 'lower-case']
    // 'scope-empty': [2, 'never'],
  }
}
