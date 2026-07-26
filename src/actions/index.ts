import { defineAction } from 'astro:actions';
import { db, commissionRequests, siteSettings } from '../db';
import { CommissionRequestSchema, calculateEstimatedPrice, pricingFromSettings } from '../lib/schemas';
import { sendNewCommissionNotification, sendCommissionConfirmation } from '../lib/email';

export const server = {
  submitCommission: defineAction({
    accept: 'form',
    input: CommissionRequestSchema,
    handler: async (input) => {
      try {
        // Price from the live settings row, so admin price edits take effect
        // immediately. Falls back to DEFAULT_PRICING if the row is missing.
        const [settings] = await db.select().from(siteSettings).limit(1);
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

        // Send email notifications (fire and forget - don't block response)
        Promise.all([
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
          }),
          sendCommissionConfirmation({
            id: newRequest.id,
            clientName: newRequest.clientName,
            email: newRequest.email,
            artType: newRequest.artType,
            style: newRequest.style,
            description: newRequest.description,
            estimatedPrice: newRequest.estimatedPrice,
          }),
        ]).catch(err => console.error('Email notification error:', err));

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
