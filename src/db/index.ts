import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Create the Neon client
const sql = neon(import.meta.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/dbname');

// Create the Drizzle instance with schema
export const db = drizzle(sql, { schema });

// Re-export schema for convenience
export * from './schema';
