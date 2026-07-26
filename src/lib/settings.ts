import { DEFAULT_PRICING } from './schemas';
import { cleanText } from './utils';
import type { SiteSettings } from '../db/schema';

/**
 * Values used when the site_settings row is missing or a field is blank.
 *
 * One copy. This blob previously existed three times (index.astro, the
 * GET /api/settings early return, and a dead const in the same file) and had
 * already started to diverge.
 */
export const DEFAULT_SITE_SETTINGS = {
  commissionStatus: 'open',
  artistName: 'Bred',
  bio: "Hello, I'm Bred! I'm a senior student doing commissions and art on the side. If you like my style, I'd love to work with you! :D",
  instagram: 'demented.toast',
  discord: 'toasted_insanity',

  bustSketch: DEFAULT_PRICING.bust.sketch,
  bustFlat: DEFAULT_PRICING.bust.flat,
  bustRendered: DEFAULT_PRICING.bust.rendered,
  halfSketch: DEFAULT_PRICING.half.sketch,
  halfFlat: DEFAULT_PRICING.half.flat,
  halfRendered: DEFAULT_PRICING.half.rendered,
  fullSketch: DEFAULT_PRICING.full.sketch,
  fullFlat: DEFAULT_PRICING.full.flat,
  fullRendered: DEFAULT_PRICING.full.rendered,
  chibiSketch: DEFAULT_PRICING.chibi.sketch,
  chibiFlat: DEFAULT_PRICING.chibi.flat,
  chibiRendered: DEFAULT_PRICING.chibi.rendered,
} as const;

export type SiteConfig = typeof DEFAULT_SITE_SETTINGS & Partial<SiteSettings>;

/**
 * Merge a settings row over the defaults.
 *
 * Fields that are null, empty, or only invisible characters fall back to the
 * default rather than rendering as a blank heading - the failure mode that
 * produced the "header missing the artist's name" bug.
 *
 * Free-text fields also go through `cleanText`, which repairs SQL-style
 * doubled quotes ("I''m") left behind by hand-seeded rows.
 */
export function resolveSiteConfig(settings: SiteSettings | null | undefined): SiteConfig {
  return {
    ...DEFAULT_SITE_SETTINGS,
    ...(settings ?? {}),
    artistName: cleanText(settings?.artistName) || DEFAULT_SITE_SETTINGS.artistName,
    commissionStatus:
      cleanText(settings?.commissionStatus) || DEFAULT_SITE_SETTINGS.commissionStatus,
    bio: cleanText(settings?.bio) || DEFAULT_SITE_SETTINGS.bio,
    instagram: cleanText(settings?.instagram) || DEFAULT_SITE_SETTINGS.instagram,
    discord: cleanText(settings?.discord) || DEFAULT_SITE_SETTINGS.discord,
  };
}
