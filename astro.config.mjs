// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  output: 'server', // SSR mode
  adapter: vercel(),
  integrations: [react()],

  // The dev toolbar sits bottom-centre and intercepts clicks on the lightbox
  // navigation controls. Playwright starts the dev server with PLAYWRIGHT=1.
  devToolbar: {
    enabled: !process.env.PLAYWRIGHT,
  },

  vite: {
    optimizeDeps: {
      exclude: ['drizzle-orm'],
    },
  },
});
