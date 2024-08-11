module.exports = {
    extends: ['mantine'],
    parserOptions: {
      project: './tsconfig.json',
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'import/extensions': 'off',
      'no-plusplus': [2, { allowForLoopAfterthoughts: true }],
      'no-console': [2, { allow: ['warn', 'error'] }],
    },
  };