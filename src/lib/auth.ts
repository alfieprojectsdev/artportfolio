/**
 * Authentication utility for admin API endpoints.
 * Implements Basic Auth matching the pattern used in admin.astro.
 */
import { createHash, timingSafeEqual } from 'node:crypto';
import { env } from './env';

/**
 * Constant-time string comparison.
 *
 * Both sides are hashed first so the buffers are always 32 bytes. That matters:
 * `timingSafeEqual` throws on length mismatch, so a naive implementation needs
 * an early `length !== length` return — which leaks the secret's length through
 * exactly the side channel the function is supposed to close.
 *
 * Server-only. `auth.ts` is imported by admin.astro's frontmatter and the API
 * routes, never by a React island, so `node:crypto` never reaches the client
 * bundle.
 */
function constantTimeEquals(a: string, b: string): boolean {
  const digestA = createHash('sha256').update(a, 'utf8').digest();
  const digestB = createHash('sha256').update(b, 'utf8').digest();
  return timingSafeEqual(digestA, digestB);
}

/**
 * Checks if a request has valid Basic Auth credentials.
 * @param request - The incoming Request object
 * @returns true if authenticated, false otherwise
 */
export function checkAuth(request: Request): boolean {
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return false;
  }

  const [type, credentials] = authHeader.split(' ');

  if (type !== 'Basic' || !credentials) {
    return false;
  }

  // Fail closed. An unset ADMIN_PASSWORD must lock the dashboard, never open
  // it — do not coerce undefined to '' here, or an empty password would match.
  const expected = env.ADMIN_PASSWORD;
  if (expected === undefined) {
    return false;
  }

  try {
    // Decode as UTF-8, not via atob(). atob() returns a byte-string — one
    // character per byte — so a password containing any non-ASCII character
    // hashes to different bytes than the value in the environment and can
    // never authenticate.
    const decoded = Buffer.from(credentials, 'base64').toString('utf8');

    // RFC 7617: the user-id may not contain a colon, the password may. Split on
    // the *first* colon only — `decoded.split(':')` would truncate a password
    // like `pa:ss` to `pa`, locking the admin out of their own dashboard.
    // A header with no colon at all yields an empty password, which cannot
    // match: `expected` is non-empty by construction (env.ts requires min(1)).
    const separator = decoded.indexOf(':');
    const username = separator === -1 ? decoded : decoded.slice(0, separator);
    const password = separator === -1 ? '' : decoded.slice(separator + 1);

    // The username is a public constant, not a secret, so a plain comparison
    // leaks nothing. Only the password needs constant-time treatment.
    return username === 'admin' && constantTimeEquals(password, expected);
  } catch {
    // Kept as a backstop. Unlike atob(), Buffer.from(..., 'base64') does not
    // throw on malformed input — it drops invalid characters — so a bad header
    // now fails as a mismatch rather than an exception. Either path returns
    // false; neither can surface as a 500.
    return false;
  }
}

/**
 * Creates a 401 Unauthorized response with WWW-Authenticate header.
 * @param realm - Browser-visible realm. The admin page uses "Admin Area" so
 *                the credential prompt reads the same as it always has.
 * @returns Response object with 401 status
 */
export function unauthorizedResponse(realm = 'Admin API'): Response {
  return new Response('Unauthorized', {
    status: 401,
    headers: { 'WWW-Authenticate': `Basic realm="${realm}"` },
  });
}
