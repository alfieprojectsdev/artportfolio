import { defineAction } from 'astro:actions';
import { db, commissionRequests, siteSettings } from '../db';
import { CommissionRequestSchema, calculateEstimatedPrice, pricingFromSettings } from '../lib/schemas';
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
        const { artistName } = resolveSiteConfig(settings);
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
            status: 'pending',
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
            }, artistName),
            'artist notification'
          ),
          withTimeout(
            sendCommissionConfirmation({
              id: newRequest.id,
              clientName: newRequest.clientName,
              email: newRequest.email,
              artType: newRequest.artType,
              style: newRequest.style,
              description: newRequest.description,
              estimatedPrice: newRequest.estimatedPrice,
            }, artistName),
            'client confirmation'
          ),
        ]);

        for (const result of emailResults) {
          if (result.status === 'rejected') {
            console.error('[email]', result.reason);
          }
        }

        return {
          success: true,
          message: 'Commission request submitted successfully!',
          requestId: newRequest.id,
        };
      } catch (error) {
        console.error('Error submitting commission:', error);
        throw new Error('Failed to submit commission request. Please try again.');
      }
    },
  }),
};
