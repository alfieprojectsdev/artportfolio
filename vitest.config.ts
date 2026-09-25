import { defineConfig } from 'vitest/config';

/**
 * Unit tests for the pure helpers only.
 *
 * Everything covered here is dependency-free — no database, no network, no
 * fixtures — which is why these run in milliseconds and need no setup file.
 * Anything requiring a server or a database belongs in the Playwright suite
 * under `e2e/`, which is excluded below so `npm test` cannot accidentally try
 * to run it.
 */
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**', '.vercel/**'],
    environment: 'node',
  },
});
