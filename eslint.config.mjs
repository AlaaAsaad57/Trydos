import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "node_modules/**",
      "next-env.d.ts",
    ],
  },
  ...nextCoreWebVitals,
  {
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    rules: {
      // Permissive config — see CLAUDE.md / copilot-instructions.md.
      "react/react-in-jsx-scope": "off",
      "react/display-name": "off",
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "off",
      "@next/next/no-html-link-for-pages": "off",
      "jsx-a11y/alt-text": "off",
      // React Compiler handles dependency arrays automatically.
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/rules-of-hooks": "warn",
      // react-hooks v7 bundles React Compiler diagnostic rules. React Compiler
      // is already enabled (next.config.ts), so these are advisory bailout hints,
      // not correctness errors — kept off to match this repo's permissive policy.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/error-boundaries": "off",
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
      "react-hooks/purity": "off",
      "react-hooks/static-components": "off",
      "react-hooks/preserve-manual-memoization": "off",
    },
  },
];

export default eslintConfig;
