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
      // Read in the console; browse the detail in coverage/index.html. There is
      // no CI, so no machine-readable format is produced.
      reporter: ['text', 'html'],
      // Only files that actually have tests. A folder here would report on
      // hundreds of untested files and the number would mean nothing. Every
      // later test phase appends its own targets to this list.
      include: ['utils/functions.tsx'],
      exclude: ['**/*.{test,spec}.{ts,tsx}'],
    },
  },
})
