/// <reference types="vitest/config" />

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
 
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    globals:true,
    environment: 'jsdom',
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
