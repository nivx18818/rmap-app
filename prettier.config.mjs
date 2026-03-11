/** @type {import("prettier").Config} */
const config = {
  semi: true,
  singleQuote: true,
  jsxSingleQuote: false,
  trailingComma: 'all',
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  bracketSpacing: true,
  arrowParens: 'always',

  endOfLine: 'lf',

  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 80,
      },
    },
  ],
};

export default config;
