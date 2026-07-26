import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Playwright globalSetup — refuses to run the suite against production.
 *
 * The e2e suite writes real rows: `commission-form.spec.ts` submits actual
 * commission requests. It ran for months against the branch the live site was
 * reading, which is where the twelve `@example.com` requests came from.
 *
 * Fails CLOSED. If it cannot determine which database it is pointed at, it
 * aborts rather than assuming the target is safe. Every escape hatch is an
 * explicit environment variable, never a default.
 *
 * Overrides (use deliberately, never in CI defaults):
 *   ALLOW_PROD_E2E=1    run against the production database anyway
 *   ALLOW_E2E_EMAIL=1   run with a live Resend key present
 */

function fail(reason: string, fix: string): never {
  throw new Error(
    `\n\n  E2E SAFETY GUARD — refusing to run.\n\n  ${reason}\n\n  ${fix}\n`
  );
}

/** Values Playwright's own process can see, plus whatever `.env.local` holds. */
function loadEnv(): Record<string, string> {
  const merged: Record<string, string> = {};
  try {
    for (const line of readFileSync(resolve(process.cwd(), '.env.local'), 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      merged[trimmed.slice(0, eq).trim()] = trimmed
        .slice(eq + 1)
        .trim()
        .replace(/^["']|["']$/g, '');
    }
  } catch {
    // No .env.local (CI). process.env is then the only source.
  }
  return { ...merged, ...process.env } as Record<string, string>;
}

function hostOf(connectionString: string | undefined): string | null {
  if (!connectionString) return null;
  return connectionString.match(/@([^/:]+)/)?.[1] ?? null;
}

export default function guard() {
  const env = loadEnv();

  const dbHost = hostOf(env.DATABASE_URL);
  const prodHost = env.PRODUCTION_DB_HOST?.trim();

  if (!dbHost) {
    fail(
      'DATABASE_URL is not set, so the target database cannot be identified.',
      'Set DATABASE_URL in .env.local to a test/development branch.'
    );
  }

  if (!prodHost) {
    fail(
      'PRODUCTION_DB_HOST is not set, so the guard cannot tell whether DATABASE_URL ' +
        'points at production.',
      'Add PRODUCTION_DB_HOST=<production endpoint host> to .env.local. ' +
        'This is required — the guard will not assume the target is safe.'
    );
  }

  if (dbHost === prodHost && env.ALLOW_PROD_E2E !== '1') {
    fail(
      `DATABASE_URL points at the production database (${dbHost}).\n  ` +
        'The suite writes commission rows and would pollute live data.',
      'Point DATABASE_URL at the development branch, or set ALLOW_PROD_E2E=1 if you ' +
        'genuinely mean to write to production.'
    );
  }

  if (env.RESEND_API_KEY && env.ALLOW_E2E_EMAIL !== '1') {
    fail(
      'RESEND_API_KEY is set. Submitting a commission would send real email to the artist ' +
        'and to the fake client addresses the tests use.',
      'Unset RESEND_API_KEY for test runs, or set ALLOW_E2E_EMAIL=1 to override.'
    );
  }

  console.log(`[e2e guard] ok — database ${dbHost}, email disabled`);
}
