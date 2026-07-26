import { z } from 'zod';

/**
 * Server-only configuration.
 *
 * 12-factor III: config lives in the environment, read in exactly one place,
 * validated, with every default visible here instead of scattered as `||`
 * fallbacks across six files.
 *
 * DO NOT import this from a React island or anything in the client bundle.
 * It reads secrets (ADMIN_PASSWORD, RESEND_API_KEY, DATABASE_URL). Components
 * that need Cloudinary config receive it as props from the page.
 *
 * Deliberately does not throw. A missing RESEND_API_KEY should not take the
 * gallery down, and a missing ADMIN_PASSWORD locks the dashboard rather than
 * opening it (no supplied password can equal `undefined`). Problems are logged
 * once at startup, loudly, with severity.
 */

// Vite inlines `import.meta.env.X` at build time; process.env covers runtime
// injection. Keys are listed explicitly because static replacement cannot see
// through a dynamic lookup.
const processEnv: Record<string, string | undefined> =
  typeof process !== 'undefined' && process.env ? process.env : {};

const raw = {
  DATABASE_URL: import.meta.env.DATABASE_URL ?? processEnv.DATABASE_URL,
  ADMIN_PASSWORD: import.meta.env.ADMIN_PASSWORD ?? processEnv.ADMIN_PASSWORD,
  CLOUDINARY_CLOUD_NAME:
    import.meta.env.CLOUDINARY_CLOUD_NAME ?? processEnv.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET:
    import.meta.env.CLOUDINARY_UPLOAD_PRESET ?? processEnv.CLOUDINARY_UPLOAD_PRESET,
  RESEND_API_KEY: import.meta.env.RESEND_API_KEY ?? processEnv.RESEND_API_KEY,
  ARTIST_EMAIL: import.meta.env.ARTIST_EMAIL ?? processEnv.ARTIST_EMAIL,
  FROM_EMAIL: import.meta.env.FROM_EMAIL ?? processEnv.FROM_EMAIL,
  SITE_URL: import.meta.env.SITE_URL ?? processEnv.SITE_URL,
};

/** Treat "" and whitespace as unset — an empty Vercel field is not a value. */
const present = z.string().trim().min(1);
const optional = present.optional().catch(undefined);

const EnvSchema = z.object({
  // Required for anything to work.
  DATABASE_URL: optional,
  ADMIN_PASSWORD: optional,

  // Required for the upload widgets.
  CLOUDINARY_CLOUD_NAME: optional,
  CLOUDINARY_UPLOAD_PRESET: optional,

  // Email is opt-in; the app degrades to "no notifications sent".
  RESEND_API_KEY: optional,
  ARTIST_EMAIL: present.email('ARTIST_EMAIL must be a valid email address').optional().catch(undefined),
  FROM_EMAIL: optional,

  // Absolute links in email. Falls back to the deployed URL.
  SITE_URL: optional,
});

export const env = EnvSchema.parse(raw);

/**
 * Defaults that are safe to hardcode because they are not secrets and not
 * artist-specific. `ARTIST_EMAIL` deliberately has no default: a wrong-looking
 * placeholder there silently swallows every commission notification.
 */
export const DEFAULT_FROM_EMAIL = 'commissions@resend.dev';
export const DEFAULT_SITE_URL = 'https://artportfolio-sigma.vercel.app';

export const siteUrl = () => env.SITE_URL ?? DEFAULT_SITE_URL;
export const fromEmail = () => env.FROM_EMAIL ?? DEFAULT_FROM_EMAIL;

type Issue = { level: 'error' | 'warn'; message: string };

function collectIssues(): Issue[] {
  const issues: Issue[] = [];

  if (!env.DATABASE_URL) {
    issues.push({
      level: 'error',
      message: 'DATABASE_URL is not set — the gallery, settings and admin dashboard will be empty.',
    });
  }

  if (!env.ADMIN_PASSWORD) {
    issues.push({
      level: 'error',
      message: 'ADMIN_PASSWORD is not set — /admin and every write endpoint will reject all credentials.',
    });
  }

  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_UPLOAD_PRESET) {
    issues.push({
      level: 'warn',
      message: 'CLOUDINARY_CLOUD_NAME / CLOUDINARY_UPLOAD_PRESET missing — image uploads will not open.',
    });
  }

  if (env.RESEND_API_KEY && !env.ARTIST_EMAIL) {
    // A malformed address fails validation and lands here as `undefined`, the
    // same as never being set. Reporting both cases as "not set" would send you
    // to the dashboard where the variable plainly is set — so say which it is.
    issues.push(
      raw.ARTIST_EMAIL
        ? {
            level: 'error',
            message:
              `ARTIST_EMAIL is set to ${JSON.stringify(raw.ARTIST_EMAIL)}, which is not a valid ` +
              'email address, so it is being ignored. New-commission notifications will be skipped ' +
              'until it is corrected.',
          }
        : {
            level: 'error',
            message:
              'RESEND_API_KEY is set but ARTIST_EMAIL is not — new-commission notifications have ' +
              'nowhere to go and will be skipped. Set ARTIST_EMAIL.',
          }
    );
  }

  if (!env.RESEND_API_KEY) {
    issues.push({
      level: 'warn',
      message: 'RESEND_API_KEY not set — commission emails are disabled (the app runs fine without them).',
    });
  }

  if (env.RESEND_API_KEY && !env.FROM_EMAIL) {
    issues.push({
      level: 'warn',
      message:
        `FROM_EMAIL not set, falling back to ${DEFAULT_FROM_EMAIL}. That is Resend's shared sandbox ` +
        'domain: it only delivers to your own verified address, so client confirmation emails will be ' +
        'rejected. Verify a custom domain in Resend for production.',
    });
  }

  // FROM_EMAIL is the *sender*. Resend will only send from a domain verified in
  // your account via DNS, which is impossible for a consumer mailbox provider —
  // you don't control gmail.com's DNS. Setting the artist's own inbox here is an
  // easy mistake (it is the right value for ARTIST_EMAIL) and produces a
  // domain-not-verified rejection on every send.
  const senderDomain = env.FROM_EMAIL?.split('@')[1]?.toLowerCase();
  const UNVERIFIABLE = [
    'gmail.com', 'googlemail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
    'live.com', 'icloud.com', 'me.com', 'aol.com', 'proton.me', 'protonmail.com',
  ];
  if (senderDomain && UNVERIFIABLE.includes(senderDomain)) {
    issues.push({
      level: 'error',
      message:
        `FROM_EMAIL is set to a ${senderDomain} address. That is a recipient inbox, not a sending ` +
        'identity — Resend can only send from a domain you verify by DNS, and you do not control ' +
        `${senderDomain}. Every send will be rejected. Use onboarding@resend.dev for testing, or an ` +
        'address on a domain verified in Resend. The artist inbox belongs in ARTIST_EMAIL.',
    });
  }

  return issues;
}

// Log once per server start rather than per request.
const issues = collectIssues();
if (issues.length > 0) {
  for (const { level, message } of issues) {
    console[level](`[env] ${message}`);
  }
}

export const envIssues = issues;
