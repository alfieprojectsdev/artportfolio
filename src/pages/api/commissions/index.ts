import type { APIRoute } from 'astro';
import { db, commissionRequests } from '../../../db';
import { desc } from 'drizzle-orm';

// GET /api/commissions - List all commission requests
export const GET: APIRoute = async () => {
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

// POST /api/commissions - Create new commission request (public form submission)
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { clientName, email, discord, artType, style, description, referenceLinks } = body;

    if (!clientName || !email || !artType) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email address' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const [newRequest] = await db
      .insert(commissionRequests)
      .values({
        clientName,
        email,
        discord,
        artType,
        style,
        description,
        referenceLinks,
        status: 'pending',
      })
      .returning();

    return new Response(JSON.stringify(newRequest), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating commission request:', error);
    return new Response(JSON.stringify({ error: 'Failed to create request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
