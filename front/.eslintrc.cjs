module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  settings: {
    react: { version: "detect" },
  },
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  plugins: [
    "react",
    "react-hooks",
    "@typescript-eslint",
    "import",
    "jsx-a11y",
  ],
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:jsx-a11y/recommended",
    "prettier",
  ],
  rules: {
    // お好みの最小ルールセット（標準的）
    "react/react-in-jsx-scope": "off", // React 17+では不要
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "import/order": [
      "warn",
      {
        groups: [["builtin", "external"], ["internal"], ["parent", "sibling", "index"]],
        "newlines-between": "always",
      },
    ],
  },
  ignorePatterns: ["dist/", "node_modules/", "src/api/generated/"],
};
