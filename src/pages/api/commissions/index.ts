import type { APIRoute } from 'astro';
import { db, commissionRequests } from '../../../db';
import { desc } from 'drizzle-orm';
import { checkAuth, unauthorizedResponse } from '../../../lib/auth';

// GET /api/commissions - List all commission requests (protected - contains PII)
export const GET: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) {
    return unauthorizedResponse();
  }

  try {
    const requests = await db
      .select()
      .from(commissionRequests)
      .orderBy(desc(commissionRequests.createdAt));

    return new Response(JSON.stringify(requests), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching commissions:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch commissions' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

