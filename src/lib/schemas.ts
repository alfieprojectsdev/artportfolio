import { z } from 'zod';

// Commission Types - synced between frontend and backend
export const ArtTypeEnum = z.enum(['bust', 'half', 'full', 'chibi', 'custom']);
export const StyleEnum = z.enum(['sketch', 'flat', 'rendered']);
export const CommissionStatusEnum = z.enum(['pending', 'accepted', 'in_progress', 'completed', 'declined']);
export const CommissionAvailabilityEnum = z.enum(['open', 'closed', 'waitlist']);

export type ArtType = z.infer<typeof ArtTypeEnum>;
export type Style = z.infer<typeof StyleEnum>;
export type CommissionStatus = z.infer<typeof CommissionStatusEnum>;

/** Art types that carry a price. `custom` is quote-only. */
export const PRICED_ART_TYPES = ['bust', 'half', 'full', 'chibi'] as const;
export type PricedArtType = (typeof PRICED_ART_TYPES)[number];

export const STYLES = ['sketch', 'flat', 'rendered'] as const;

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

/** Price in PHP for every art type x style combination. */
export type PricingTable = Record<ArtType, Record<Style, number>>;

/**
 * Fallback prices, used only when the site_settings row is missing.
 *
 * The live prices live in the database and are edited from the admin
 * dashboard - read them with `pricingFromSettings()`, never from here.
 */
export const DEFAULT_PRICING: PricingTable = {
  bust: { sketch: 80, flat: 150, rendered: 200 },
  half: { sketch: 100, flat: 200, rendered: 300 },
  full: { sketch: 200, flat: 250, rendered: 500 },
  chibi: { sketch: 40, flat: 100, rendered: 150 },
  custom: { sketch: 0, flat: 0, rendered: 0 }, // Quote required
};

/** The price columns on the site_settings row. */
export type PricingColumns = Partial<
  Record<`${PricedArtType}${Capitalize<Style>}`, number | null>
>;

/**
 * Build a pricing table from the site_settings row, so a quote always reflects
 * what the artist entered in the admin dashboard. Missing or null columns fall
 * back to DEFAULT_PRICING cell by cell.
 */
export function pricingFromSettings(settings: PricingColumns | null | undefined): PricingTable {
  if (!settings) return DEFAULT_PRICING;

  const table = { custom: DEFAULT_PRICING.custom } as PricingTable;

  for (const artType of PRICED_ART_TYPES) {
    table[artType] = {
      sketch: settings[`${artType}Sketch`] ?? DEFAULT_PRICING[artType].sketch,
      flat: settings[`${artType}Flat`] ?? DEFAULT_PRICING[artType].flat,
      rendered: settings[`${artType}Rendered`] ?? DEFAULT_PRICING[artType].rendered,
    };
  }

  return table;
}

export function calculateEstimatedPrice(
  artType: ArtType,
  style: Style,
  pricing: PricingTable = DEFAULT_PRICING
): number {
  return pricing[artType][style];
}

const price = () => z.number().int().min(0).max(1_000_000).optional();

/**
 * Site settings update payload.
 *
 * Doubles as the allowlist for PUT /api/settings: anything not named here (id,
 * updatedAt, arbitrary columns) is stripped rather than written, matching the
 * explicit-field pattern the gallery and commission routes already use.
 */
export const SiteSettingsUpdateSchema = z.object({
  commissionStatus: CommissionAvailabilityEnum.optional(),
  artistName: z.string()
    .min(1, 'Artist name is required and cannot be empty')
    .max(100, 'Artist name must be less than 100 characters')
    .optional(),
  // Cloudinary always returns https://res.cloudinary.com/..., but the default
  // is a root-relative /assets/profile.jpg — url() would reject that, so this
  // only checks length, and the display fallback in resolveSiteConfig covers
  // an unset or blank value.
  avatarUrl: z.string().max(2000).nullish(),
  bio: z.string().max(2000).nullish(),
  instagram: z.string().max(100).nullish(),
  discord: z.string().max(100).nullish(),

  bustSketch: price(),
  bustFlat: price(),
  bustRendered: price(),
  halfSketch: price(),
  halfFlat: price(),
  halfRendered: price(),
  fullSketch: price(),
  fullFlat: price(),
  fullRendered: price(),
  chibiSketch: price(),
  chibiFlat: price(),
  chibiRendered: price(),
});

export type SiteSettingsUpdate = z.infer<typeof SiteSettingsUpdateSchema>;
