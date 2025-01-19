import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  // @ts-ignore
  plugins: [
    // @ts-ignore
    ...react(),
    // @ts-ignore
    tsconfigPaths(),
    // @ts-ignore
    svgr({
      // Vite plugin for handling SVG files
      include: "**/**/*.svg",
      svgrOptions: {
        icon: true,
        plugins: ["@svgr/plugin-svgo", "@svgr/plugin-jsx"],
      },
    }),
  ],
  optimizeDeps: {
    include: ["app/**/*.tsx"],
  },
  test: {
    globals: true,
    testTimeout: 10000000,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    alias: {
      "components/": new URL("./components/", import.meta.url).pathname,
      "services/": new URL("./services/", import.meta.url).pathname,
      "store/": new URL("./store/", import.meta.url).pathname,
      "utils/": new URL("./utils/", import.meta.url).pathname,
      "public/": new URL("./public/", import.meta.url).pathname,
      "Hooks/": new URL("./Hooks/", import.meta.url).pathname,
      "assets/": new URL("./public/", import.meta.url).pathname,
      "styles/": new URL("./public/styles/", import.meta.url).pathname,
      "svg/": new URL("./public/svg/", import.meta.url).pathname,
      "*": new URL("./", import.meta.url).pathname,
    },
  },
});
