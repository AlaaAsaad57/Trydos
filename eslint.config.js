const eslintConfigNext = require("eslint-config-next");
const eslintConfigStandard = require("eslint-config-standard");
const eslintPluginImport = require("eslint-plugin-import");
const eslintPluginNode = require("eslint-plugin-node");
const eslintPluginPromise = require("eslint-plugin-promise");

module.exports = [
  {
    files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest", // ECMAScript version
        sourceType: "module", // Use ES modules
      },
    },
    plugins: {
      import: eslintPluginImport,
      node: eslintPluginNode,
      promise: eslintPluginPromise,
    },
    rules: {
      ...eslintConfigStandard.rules, // Add rules from the `eslint-config-standard` package
      "react/react-in-jsx-scope": "off",
      "@next/next/no-img-element": "off",
      "react-hooks/exhaustive-deps": "off",
      "jsx-a11y/alt-text": "off",
    },
  },
  eslintConfigNext, // Add Next.js-specific config
];
