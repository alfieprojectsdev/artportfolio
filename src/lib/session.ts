import { createHmac, timingSafeEqual } from 'node:crypto';

// Use ADMIN_PASSWORD as the secret key for signing sessions.
// In a production environment with multiple users, a dedicated SESSION_SECRET should be used.
const SECRET_KEY = import.meta.env.ADMIN_PASSWORD;
const SESSION_COOKIE_NAME = 'admin_session';

if (!SECRET_KEY && import.meta.env.PROD) {
  console.warn('WARNING: ADMIN_PASSWORD is not set. Session security is compromised.');
}

interface SessionPayload {
  role: string;
  exp: number;
}

/**
 * Creates a signed session token.
 */
export function createSessionToken(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', SECRET_KEY).update(data).digest('base64url');
  return `${data}.${signature}`;
}

/**
 * Verifies a session token and returns the payload if valid.
 */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const [data, signature] = token.split('.');
    if (!data || !signature) return null;

    const expectedSignature = createHmac('sha256', SECRET_KEY).update(data).digest('base64url');

    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());

    // Check expiration
    if (Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: import.meta.env.PROD, // Secure in production (HTTPS)
  sameSite: 'lax' as const, // Lax is sufficient for top-level navigation, Strict might break redirects from external sites if any
  path: '/',
  maxAge: 60 * 60 * 24, // 24 hours in seconds
};

export { SESSION_COOKIE_NAME };
