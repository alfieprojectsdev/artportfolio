import type { APIRoute } from 'astro';
import { createHash, timingSafeEqual } from 'node:crypto';
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from '../../../lib/session';

const rateLimit = new Map<string, { count: number, reset: number }>();

export const POST: APIRoute = async ({ request, cookies }) => {
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || 'unknown';
  const now = Date.now();

  // Rate Limiting: 5 attempts per minute
  const record = rateLimit.get(clientIp);
  if (record) {
    if (now > record.reset) {
      rateLimit.set(clientIp, { count: 1, reset: now + 60000 });
    } else {
      if (record.count >= 5) {
        return new Response(JSON.stringify({ message: 'Too many attempts. Please try again in a minute.' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      record.count++;
    }
  } else {
    rateLimit.set(clientIp, { count: 1, reset: now + 60000 });
  }

  try {
    const { username, password } = await request.json();

    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      return new Response(JSON.stringify({ message: 'Username and password required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Secure comparison using SHA-256 hashes to prevent timing attacks
    // We combine username and password to verify both at once, ensuring username is 'admin'
    const validUsername = 'admin';
    const validPassword = import.meta.env.ADMIN_PASSWORD;

    if (!validPassword) {
      console.error('Login attempt failed: ADMIN_PASSWORD environment variable is not set');
      return new Response(JSON.stringify({ message: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Hash the input and the expected credentials
    const inputHash = createHash('sha256').update(`${username}:${password}`).digest();
    const validHash = createHash('sha256').update(`${validUsername}:${validPassword}`).digest();

    // Constant-time comparison
    // Note: If ADMIN_PASSWORD is not set, this will fail securely (empty string vs input)
    // but ideally ADMIN_PASSWORD should always be set.
    if (inputHash.length !== validHash.length || !timingSafeEqual(inputHash, validHash)) {
      return new Response(JSON.stringify({ message: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Authentication successful
    // Reset rate limit on success? No, keeps brute force harder if they guess one right.
    // Actually, maybe clear it? For simplicity, we leave it.

    // Create session
    const payload = {
      role: 'admin',
      exp: Date.now() + (SESSION_COOKIE_OPTIONS.maxAge * 1000),
    };

    const token = createSessionToken(payload);

    cookies.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ message: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
