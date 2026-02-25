import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
  define: {
    'import.meta.env.ADMIN_PASSWORD': JSON.stringify('secret-password'),
  },
});
