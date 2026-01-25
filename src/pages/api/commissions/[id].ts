import type { APIRoute } from 'astro';
import { db, commissionRequests } from '../../../db';
import { eq } from 'drizzle-orm';
import { checkAuth, unauthorizedResponse } from '../../../lib/auth';
import { sendStatusUpdateEmail } from '../../../lib/email';

// PATCH /api/commissions/:id - Update commission status
export const PATCH: APIRoute = async ({ params, request }) => {
  if (!checkAuth(request)) {
    return unauthorizedResponse();
  }

  try {
    const id = parseInt(params.id!);
    const body = await request.json();

    if (isNaN(id)) {
      return new Response(JSON.stringify({ error: 'Invalid ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get current commission to check for status change
    const [current] = await db
      .select()
      .from(commissionRequests)
      .where(eq(commissionRequests.id, id));

    if (!current) {
      return new Response(JSON.stringify({ error: 'Commission not found' }), {
        status: 404,
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

    // Send email notification if status changed (and sendEmail not explicitly false)
    if (body.status && body.status !== current.status && body.sendEmail !== false) {
      sendStatusUpdateEmail(
        updated.email,
        updated.clientName,
        updated.id,
        body.status,
        body.statusNote // Optional note to include in the email
      ).catch(err => console.error('Status update email error:', err));
    }

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
export const DELETE: APIRoute = async ({ params, request }) => {
  if (!checkAuth(request)) {
    return unauthorizedResponse();
  }

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
