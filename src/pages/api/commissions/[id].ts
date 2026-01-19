import type { APIRoute } from 'astro';
import { db, commissionRequests } from '../../../db';
import { eq } from 'drizzle-orm';

// PATCH /api/commissions/:id - Update commission status
export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    const id = parseInt(params.id!);
    const body = await request.json();

    if (isNaN(id)) {
      return new Response(JSON.stringify({ error: 'Invalid ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Only allow updating specific fields
    const allowedFields = ['status', 'notes', 'quotedPrice'];
    const updates: Record<string, unknown> = { updatedAt: new Date() };

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const [updated] = await db
      .update(commissionRequests)
      .set(updates)
      .where(eq(commissionRequests.id, id))
      .returning();

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating commission:', error);
    return new Response(JSON.stringify({ error: 'Failed to update commission' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE /api/commissions/:id - Delete commission request
export const DELETE: APIRoute = async ({ params }) => {
  try {
    const id = parseInt(params.id!);

    if (isNaN(id)) {
      return new Response(JSON.stringify({ error: 'Invalid ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await db.delete(commissionRequests).where(eq(commissionRequests.id, id));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting commission:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete commission' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
