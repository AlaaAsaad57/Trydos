/// <reference types="vitest/config" />

import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: {
      // `server-only` is a marker the framework's build resolves, not a package
      // that is installed — so `import "server-only"` cannot resolve here, and
      // every module carrying that line is unloadable in a test without this.
      // The stand-in keeps the rule rather than dropping it: it resolves to
      // nothing in a server-like test and throws in a browser-like one, which is
      // what the build does per bundle. See tests/mocks/serverOnly.ts.
      'server-only': fileURLToPath(
        new URL('./tests/mocks/serverOnly.ts', import.meta.url),
      ),
    },
  },
  test: {
    globals:true,
    environment: 'jsdom',
    // Runs once per test file, before its tests: the extra page checks, the
    // clean-up between renders, and the fake network. See tests/setup.ts.
    setupFiles: ['./tests/setup.ts'],
    // The settings a test run needs, written here rather than read from
    // .env.development. Two reasons: the runner does not load Next's env files,
    // and pointing tests at the real addresses in them is how a test ends up
    // talking to something real.
    //
    // Every value is obviously fake. The media address is example.com because
    // that domain is reserved for exactly this and is already allowed in
    // next.config.ts, so next/image accepts it and jsdom never asks for the
    // picture. Without a media address, next/image is handed "undefined/…" and
    // throws before the component can render.
    env: {
      NEXT_PUBLIC_BASE_MEDIA_URL: 'https://example.com',
      NEXT_PUBLIC_BASE_VIDEO_MEDIA_URL: 'https://example.com',
      NEXT_PUBLIC_MEDIA_SERVER_BASE_URL: 'https://example.com',
      NEXT_PUBLIC_CHAT_BACKEND_URL: 'https://example.com',
      NEXT_PUBLIC_DEFAULT_COUNTRY: 'gb',
      NEXT_PUBLIC_DEFAULT_LANGUAGE: 'en',
      NEXT_PUBLIC_APP_VERSION: '0.0.0-test',
      NEXT_PUBLIC_MAX_ARRAY_LENGTH: '50',
      // Left empty on purpose: the analytics and maps keys are the ones that
      // would reach a real service if anything ever used them.
      NEXT_PUBLIC_GA_MEASUREMENT_ID: '',
      NEXT_PUBLIC_POSTHOG_KEY: '',
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: '',
      NEXT_PUBLIC_MEDIA_API_KEY: '',
      NEXT_PUBLIC_ALLOW_INDEXING: 'false',
      NEXT_PUBLIC_ANALYTICS_LOG: 'false',
    },
    coverage: {
      provider: 'v8',
      // The console prints the headline numbers only. Per-file detail lives in
      // coverage/index.html, where you can walk the folders and see what still
      // has no tests — the full list is far too long to read in a terminal.
      // There is no CI, so no machine-readable format is produced.
      reporter: ['text-summary', 'html'],
      // Every source file the app itself ships, tested or not, so the report
      // doubles as the list of what is still to do. A file with no test shows
      // up at 0%.
      include: [
        'app/**/*.{ts,tsx,js,jsx}',
        'components/**/*.{ts,tsx,js,jsx}',
        'hooks/**/*.{ts,tsx,js,jsx}',
        'scaling/**/*.{ts,tsx,js,jsx}',
        'serverActions/**/*.{ts,tsx,js,jsx}',
        'serverRequests/**/*.{ts,tsx,js,jsx}',
        'services/**/*.{ts,tsx,js,jsx}',
        'store/**/*.{ts,tsx,js,jsx}',
        'utils/**/*.{ts,tsx,js,jsx}',
        'proxy.ts',
      ],
      // Left out on purpose, because none of it is app code we would write a
      // unit test for:
      //   - the tests and their stand-ins (tests/, *.test.*, *.spec.*)
      //   - descriptions of types, which have nothing to run (*.d.ts and
      //     types/)
      //   - build and tool settings (next/tailwind/postcss/eslint/sentry
      //     configs, instrumentation, eslint-rules/, scripts/)
      //   - public/, which holds the browser service worker and the three
      //     translation files — data, not our logic
      exclude: ['**/*.{test,spec}.{ts,tsx,js,jsx}', '**/*.d.ts'],
    },
  },
})
