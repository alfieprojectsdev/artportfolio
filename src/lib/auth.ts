import { timingSafeEqual } from 'node:crypto';

/**
 * Authentication utility for admin API endpoints.
 * Implements Basic Auth matching the pattern used in admin.astro.
 */

/**
 * Constant-time string comparison to prevent timing attacks.
 */
function secureCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;

  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    // Return false if lengths differ, but perform a dummy comparison to mitigate some timing leaks.
    // timingSafeEqual requires buffers of equal length.
    timingSafeEqual(aBuffer, aBuffer);
    return false;
  }

  return timingSafeEqual(aBuffer, bBuffer);
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

  try {
    const decoded = atob(credentials);
    const [username, password] = decoded.split(':');

    const adminPassword = import.meta.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      // If ADMIN_PASSWORD is not set, deny access
      return false;
    }

    return secureCompare(username, 'admin') && secureCompare(password, adminPassword);
  } catch {
    // Invalid base64 encoding
    return false;
  }
}

/**
 * Creates a 401 Unauthorized response with WWW-Authenticate header.
 * @returns Response object with 401 status
 */
export function unauthorizedResponse(): Response {
  return new Response('Unauthorized', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Admin Area"' },
  });
}
