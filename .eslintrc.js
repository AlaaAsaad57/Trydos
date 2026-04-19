module.exports = {
  extends: ["next", "next/core-web-vitals"], // Next.js default configuration
  rules: {
    "react/react-in-jsx-scope": "off",
    "@next/next/no-img-element": "off",
    "react-hooks/exhaustive-deps": "off", // Can be off with React Compiler (it handles deps automatically)
    "jsx-a11y/alt-text": "off",
    "react/display-name": "off", // Disable this specific rule globally
    // React 19 Compiler specific rules
    "react-hooks/rules-of-hooks": "warn", // Keep this to catch hook violations
    // Note: With React Compiler, you may not need useMemo/useCallback warnings
    // but keep them as warnings (not errors) for now during migration
  },
};
