import { defineAction } from 'astro:actions';
import { z } from 'zod';
import { db, commissionRequests } from '../db';
import { CommissionRequestSchema, calculateEstimatedPrice } from '../lib/schemas';

export const server = {
  submitCommission: defineAction({
    accept: 'form',
    input: CommissionRequestSchema,
    handler: async (input) => {
      try {
        // Calculate estimated price
        const estimatedPrice = calculateEstimatedPrice(input.artType, input.style);

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

        // TODO: Send email notification via Resend
        // await sendNotificationEmail(newRequest);

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
