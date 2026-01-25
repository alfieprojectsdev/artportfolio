import { z } from 'zod';

// Commission Types - synced between frontend and backend
export const ArtTypeEnum = z.enum(['headshot', 'bust', 'half', 'full', 'chibi', 'custom']);
export const StyleEnum = z.enum(['sketch', 'flat', 'rendered']);
export const CommissionStatusEnum = z.enum(['pending', 'accepted', 'in_progress', 'completed', 'declined']);

export type ArtType = z.infer<typeof ArtTypeEnum>;
export type Style = z.infer<typeof StyleEnum>;
export type CommissionStatus = z.infer<typeof CommissionStatusEnum>;

// Commission Request Schema - for form validation
export const CommissionRequestSchema = z.object({
  clientName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string()
    .email('Please enter a valid email address'),
  discord: z.string()
    .max(50, 'Discord username must be less than 50 characters')
    .nullish()
    .transform(val => val || undefined),
  artType: ArtTypeEnum,
  style: StyleEnum,
  description: z.string()
    .min(20, 'Please provide at least 20 characters describing your commission')
    .max(2000, 'Description must be less than 2000 characters'),
  refImages: z.array(z.string().url()).max(5, 'Maximum 5 reference images').optional().default([]),
});

export type CommissionRequestInput = z.infer<typeof CommissionRequestSchema>;

// Price calculation based on art type and style
export const PRICING = {
  headshot: { sketch: 60, flat: 100, rendered: 150 },
  bust: { sketch: 80, flat: 150, rendered: 200 },
  half: { sketch: 100, flat: 200, rendered: 300 },
  full: { sketch: 200, flat: 250, rendered: 500 },
  chibi: { sketch: 40, flat: 100, rendered: 150 },
  custom: { sketch: 0, flat: 0, rendered: 0 }, // Quote required
} as const;

export function calculateEstimatedPrice(artType: ArtType, style: Style): number {
  return PRICING[artType][style];
}
