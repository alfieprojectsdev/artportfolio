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
    const decoded = atob(credentials);
    // A header without a colon yields `password === undefined`; `?? ''` keeps
    // that a failed comparison rather than a thrown TypeError.
    const [username, password] = decoded.split(':');

    // The username is a public constant, not a secret, so a plain comparison
    // leaks nothing. Only the password needs constant-time treatment.
    return username === 'admin' && constantTimeEquals(password ?? '', expected);
  } catch {
    // Invalid base64 encoding
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
