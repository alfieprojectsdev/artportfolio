import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

/**
 * Load the same env file Astro/Vite uses.
 *
 * Plain `import 'dotenv/config'` reads `.env` only — and this project keeps its
 * values in `.env.local`, which no `.env` shadows. That mismatch meant every
 * drizzle-kit command needed an inline `DATABASE_URL=...` prefix, which is how
 * a live connection string ended up pasted into the setup docs.
 *
 * An already-set DATABASE_URL in the environment still wins (dotenv does not
 * override), so CI and one-off overrides keep working.
 */
config({ path: '.env.local' });
config(); // fall back to .env if present

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. Add it to .env.local (see .env.example) or export it before running drizzle-kit.'
  );
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
