import type { APIRoute } from 'astro';
import { db, commissionRequests, siteSettings } from '../../../db';
import { eq } from 'drizzle-orm';
import { checkAuth, unauthorizedResponse } from '../../../lib/auth';
import { sendStatusUpdateEmail } from '../../../lib/email';
import { resolveSiteConfig } from '../../../lib/settings';
import { CommissionStatusEnum, EMAILED_STATUSES } from '../../../lib/schemas';

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

    // An unknown status would be stored as-is and fall out of every filter
    // and badge in the dashboard.
    if (body.status !== undefined && !CommissionStatusEnum.safeParse(body.status).success) {
      return new Response(JSON.stringify({ error: `Unknown status "${body.status}"` }), {
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

    // Reported in a header rather than the body, so the body stays the plain
    // row the dashboard stores. 'none' = no email was due or asked for.
    let emailResult: 'sent' | 'failed' | 'none' = 'none';

    // Send email notification if status changed (and sendEmail not explicitly
    // false). Only statuses with a template: pending/waitlisted have none, and
    // used to be logged as "not delivered" on every change.
    if (
      body.status &&
      body.status !== current.status &&
      body.sendEmail !== false &&
      EMAILED_STATUSES.includes(body.status)
    ) {
      const [settings] = await db.select().from(siteSettings).limit(1);
      const { artistName } = resolveSiteConfig(settings);

      // Awaited for the same reason as the submit action: on serverless the
      // instance is suspended once the response is sent, which kills an
      // unawaited fetch mid-request. Failures are logged, never surfaced —
      // the status change itself is already committed above.
      const sent = await sendStatusUpdateEmail(
        updated.email,
        updated.clientName,
        updated.id,
        body.status,
        typeof body.statusNote === 'string' ? body.statusNote : undefined, // Optional note, escaped in the template
        artistName
      ).catch(err => {
        console.error('Status update email error:', err);
        return false;
      });

      emailResult = sent ? 'sent' : 'failed';
      if (!sent) {
        console.warn(`[email] status update for commission #${updated.id} was not delivered`);
      }
    }

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-Status-Email': emailResult },
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
