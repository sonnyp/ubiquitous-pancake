// https://eslint.org/

module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true,
  },
  extends: ["eslint:recommended"],
  parserOptions: {
    ecmaVersion: 2018,
  },
  rules: {
    "linebreak-style": ["error", "unix"],
    quotes: ["error", "double", { avoidEscape: true }],
    semi: ["error", "always"],
    "require-atomic-updates": 0,
    "no-unused-vars": [
      "error",
      { vars: "all", args: "none", ignoreRestSiblings: false },
    ],
    // https://eslint.org/docs/rules/#ecmascript-6
    "no-var": "error", // https://eslint.org/docs/rules/no-var
    "prefer-arrow-callback": "error", // https://eslint.org/docs/rules/prefer-arrow-callback
    "prefer-const": "error", // https://eslint.org/docs/rules/prefer-const
  },
};
