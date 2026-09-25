import { ActionError, defineAction } from 'astro:actions';
import { sql } from 'drizzle-orm';
import { db, commissionRequests, siteSettings } from '../db';
import { CommissionRequestSchema, acceptsRequests, calculateEstimatedPrice, pricingFromSettings } from '../lib/schemas';
import { resolveSiteConfig } from '../lib/settings';
import { sendNewCommissionNotification, sendCommissionConfirmation } from '../lib/email';

/**
 * Ceiling on how long a commission submit will wait for email.
 *
 * The sends are awaited so the serverless instance stays alive for them, but a
 * slow or unreachable Resend must not hold the visitor's form hostage. On
 * timeout the request is already saved and visible in /admin.
 */
const EMAIL_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${EMAIL_TIMEOUT_MS}ms`)),
      EMAIL_TIMEOUT_MS
    );
  });
  // clearTimeout so a resolved send does not hold the event loop open.
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Ceilings on client confirmation emails. Counts include the request just saved.
 *
 * The confirmation goes to whatever address the submitter typed and quotes
 * their name and description back, from the artist's verified domain. With no
 * limit, the form is a way to send arbitrary text to arbitrary people. The
 * numbers are meant to sit well above one artist's normal volume, so only bulk
 * abuse hits them. If a busy opening day ever does, raise them here.
 *
 * Over a limit, the request is still saved and the artist is still notified.
 * Only the confirmation to the submitted address is skipped, and that is
 * logged. The visitor sees the same success message either way.
 */
const CONFIRMATION_LIMITS = {
  perAddressPerDay: 3,
  perHour: 20,
  perDay: 60,
};

async function confirmationAllowed(email: string, requestId: number): Promise<boolean> {
  try {
    const [counts] = await db
      .select({
        sameAddress: sql<number>`count(*) filter (where lower(${commissionRequests.email}) = lower(${email}))`.mapWith(Number),
        lastHour: sql<number>`count(*) filter (where ${commissionRequests.createdAt} > now() - interval '1 hour')`.mapWith(Number),
        lastDay: sql<number>`count(*)`.mapWith(Number),
      })
      .from(commissionRequests)
      .where(sql`${commissionRequests.createdAt} > now() - interval '24 hours'`);

    const over =
      counts.sameAddress > CONFIRMATION_LIMITS.perAddressPerDay ? 'this address, last 24h' :
      counts.lastHour > CONFIRMATION_LIMITS.perHour ? 'all requests, last hour' :
      counts.lastDay > CONFIRMATION_LIMITS.perDay ? 'all requests, last 24h' :
      null;

    if (over) {
      console.warn(
        `[email] client confirmation for commission #${requestId} skipped: over the limit for ${over} ` +
          `(address ${counts.sameAddress}, hour ${counts.lastHour}, day ${counts.lastDay}).`
      );
      return false;
    }
    return true;
  } catch (error) {
    // Fail open: a counting error must not cost a real client their email.
    console.error('[email] could not check confirmation limits, sending anyway:', error);
    return true;
  }
}

export const server = {
  submitCommission: defineAction({
    accept: 'form',
    input: CommissionRequestSchema,
    handler: async (input) => {
      try {
        // Price from the live settings row, so admin price edits take effect
        // immediately. Falls back to DEFAULT_PRICING if the row is missing.
        const [settings] = await db.select().from(siteSettings).limit(1);
        // Same row also names the artist in the email templates, so renaming in
        // /admin no longer leaves the emails stale.
        const { artistName, commissionStatus } = resolveSiteConfig(settings);

        // Same test index.astro uses to decide whether to show the form, so a
        // request can only arrive while the form is visible. Before this, a
        // direct POST was accepted (and emailed) while the site said CLOSED.
        if (!acceptsRequests(commissionStatus)) {
          throw new ActionError({
            code: 'FORBIDDEN',
            message: 'Commissions are currently closed.',
          });
        }
        // SiteConfig types this as the literal default ('open'); it's a string
        // from the settings row at runtime.
        const waitlisted = (commissionStatus as string) === 'waitlist';

        const estimatedPrice = calculateEstimatedPrice(
          input.artType,
          input.style,
          pricingFromSettings(settings)
        );

        // Insert into database
        const [newRequest] = await db
          .insert(commissionRequests)
          .values({
            clientName: input.clientName,
            email: input.email,
            discord: input.discord || null,
            artType: input.artType,
            style: input.style,
            description: input.description,
            refImages: input.refImages,
            estimatedPrice,
            status: waitlisted ? 'waitlisted' : 'pending',
          })
          .returning();

        // Email must be AWAITED, not fired and forgotten.
        //
        // This used to be `Promise.all([...]).catch(...)` with the response
        // returned immediately. That works on a long-lived Node server, but on
        // serverless the instance is suspended the moment the response is sent,
        // which killed the in-flight fetch to Resend mid-request. Every send
        // failed with `statusCode: null, "Unable to fetch data"` — no email had
        // ever left this app, whatever the API key was set to.
        //
        // The request is already committed above, so this is purely best-effort:
        // allSettled means one failure cannot skip the other, and nothing here
        // can fail the submission or surface to the client.
        const sendConfirmation = await confirmationAllowed(newRequest.email, newRequest.id);

        const emailResults = await Promise.allSettled([
          withTimeout(
            sendNewCommissionNotification({
              id: newRequest.id,
              clientName: newRequest.clientName,
              email: newRequest.email,
              discord: newRequest.discord,
              artType: newRequest.artType,
              style: newRequest.style,
              description: newRequest.description,
              estimatedPrice: newRequest.estimatedPrice,
              refImages: newRequest.refImages || [],
              waitlisted,
            }, artistName),
            'artist notification'
          ),
          sendConfirmation
            ? withTimeout(
                sendCommissionConfirmation({
                  id: newRequest.id,
                  clientName: newRequest.clientName,
                  email: newRequest.email,
                  artType: newRequest.artType,
                  style: newRequest.style,
                  description: newRequest.description,
                  estimatedPrice: newRequest.estimatedPrice,
                  waitlisted,
                }, artistName),
                'client confirmation'
              )
            : Promise.resolve(false),
        ]);

        for (const result of emailResults) {
          if (result.status === 'rejected') {
            console.error('[email]', result.reason);
          }
        }

        return {
          success: true,
          message: waitlisted
            ? "You're on the waitlist! I'll reach out when a slot opens."
            : 'Commission request submitted successfully!',
          requestId: newRequest.id,
        };
      } catch (error) {
        // Deliberate refusals keep their own code and message.
        if (error instanceof ActionError) throw error;
        console.error('Error submitting commission:', error);
        throw new Error('Failed to submit commission request. Please try again.');
      }
    },
  }),
};
