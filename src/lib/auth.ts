import { verifySessionToken, SESSION_COOKIE_NAME } from './session';

/**
 * Checks if a request has a valid session cookie.
 * @param request - The incoming Request object
 * @returns true if authenticated, false otherwise
 */
export function checkAuth(request: Request): boolean {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return false;

  const cookies = parseCookies(cookieHeader);
  const token = cookies[SESSION_COOKIE_NAME];

  if (!token) return false;

  return !!verifySessionToken(token);
}

/**
 * Simple cookie parser for the Cookie header string.
 */
function parseCookies(header: string): Record<string, string> {
  const list: Record<string, string> = {};
  header.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    const name = parts.shift()?.trim();
    const value = parts.join('=')?.trim(); // Handle values with '='
    if (name && value) {
      try {
        list[name] = decodeURIComponent(value);
      } catch (e) {
        // Ignore malformed cookies
        list[name] = value;
      }
    }
  });
  return list;
}

/**
 * Creates a 401 Unauthorized response.
 * @returns Response object with 401 status
 */
export function unauthorizedResponse(): Response {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}
