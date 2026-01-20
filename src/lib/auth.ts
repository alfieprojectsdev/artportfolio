/**
 * Authentication utility for admin API endpoints.
 * Implements Basic Auth matching the pattern used in admin.astro.
 */

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
    return username === 'admin' && password === import.meta.env.ADMIN_PASSWORD;
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
    headers: { 'WWW-Authenticate': 'Basic realm="Admin API"' },
  });
}
