module.exports = {
  extends: ["next", "next/core-web-vitals"], // Next.js default configuration
  rules: {
    "react/react-in-jsx-scope": "off",
    "@next/next/no-img-element": "off",
    "react-hooks/exhaustive-deps": "off",
    "jsx-a11y/alt-text": "off",
    "react/display-name": "off", // Disable this specific rule globally
  },
};
