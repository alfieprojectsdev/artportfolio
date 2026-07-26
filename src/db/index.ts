import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { env } from '../lib/env';

// Create the Neon client. A missing DATABASE_URL is reported by lib/env at
// startup; callers already wrap queries in try/catch and fall back to defaults.
const sql = neon(env.DATABASE_URL!);

// Create the Drizzle instance with schema
export const db = drizzle(sql, { schema });

// Re-export schema for convenience
export * from './schema';
