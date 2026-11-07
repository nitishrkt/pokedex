module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'refactor', 'perf', 'test', 'docs', 'chore', 'style'],
    ],
    'scope-empty': [2, 'never'],
    'scope-enum': [2, 'always', ['core', 'common', 'pokedex', 'teams', 'deps', 'readme']],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [2, 'always', 72],
  },
};
