import type { APIRoute } from 'astro';
import { SESSION_COOKIE_NAME } from '../../../lib/session';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
  return redirect('/login');
}

export const GET: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
  return redirect('/login');
}
