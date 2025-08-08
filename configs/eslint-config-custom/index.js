module.exports = {
  extends: ["turbo", "prettier"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  rules: {
    "react/jsx-key": "off",
  },
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
};
