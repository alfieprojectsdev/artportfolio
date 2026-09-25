import { describe, it, expect } from 'vitest';
import {
  DEFAULT_PRICING,
  pricingFromSettings,
  calculateEstimatedPrice,
  SiteSettingsUpdateSchema,
  ArtTypeEnum,
  PRICED_ART_TYPES,
} from './schemas';

describe('pricingFromSettings', () => {
  it('falls back to DEFAULT_PRICING when there is no settings row', () => {
    expect(pricingFromSettings(null)).toEqual(DEFAULT_PRICING);
    expect(pricingFromSettings(undefined)).toEqual(DEFAULT_PRICING);
  });

  it('uses the stored value for each cell it has', () => {
    const table = pricingFromSettings({ bustFlat: 175, chibiSketch: 45 });
    expect(table.bust.flat).toBe(175);
    expect(table.chibi.sketch).toBe(45);
  });

  it('falls back per cell, not per art type', () => {
    // The whole point: overriding one price must not blank the siblings.
    const table = pricingFromSettings({ bustFlat: 175 });
    expect(table.bust.flat).toBe(175);
    expect(table.bust.sketch).toBe(DEFAULT_PRICING.bust.sketch);
    expect(table.bust.rendered).toBe(DEFAULT_PRICING.bust.rendered);
  });

  it('treats an explicit null column as absent', () => {
    const table = pricingFromSettings({ bustFlat: null });
    expect(table.bust.flat).toBe(DEFAULT_PRICING.bust.flat);
  });

  it('keeps custom at zero — it is quote-only', () => {
    expect(pricingFromSettings({ bustFlat: 175 }).custom).toEqual({
      sketch: 0,
      flat: 0,
      rendered: 0,
    });
  });

  it('covers every priced art type', () => {
    const table = pricingFromSettings({});
    for (const type of PRICED_ART_TYPES) {
      expect(table[type]).toBeDefined();
    }
  });
});

describe('calculateEstimatedPrice', () => {
  it('reads from the supplied table rather than a hardcoded one', () => {
    const table = pricingFromSettings({ bustFlat: 999 });
    expect(calculateEstimatedPrice('bust', 'flat', table)).toBe(999);
  });

  it('defaults to DEFAULT_PRICING when no table is passed', () => {
    expect(calculateEstimatedPrice('bust', 'flat')).toBe(DEFAULT_PRICING.bust.flat);
  });
});

describe('ArtTypeEnum', () => {
  it('no longer accepts headshot', () => {
    // Removed because the form quoted PHP 60/100/150 while the public card
    // advertised bust prices.
    expect(ArtTypeEnum.safeParse('headshot').success).toBe(false);
    expect(ArtTypeEnum.safeParse('bust').success).toBe(true);
  });
});

describe('SiteSettingsUpdateSchema', () => {
  it('strips keys that are not in the allowlist', () => {
    // This schema doubles as the write allowlist for PUT /api/settings.
    const parsed = SiteSettingsUpdateSchema.parse({
      artistName: 'Bred',
      id: 999,
      updatedAt: '2020-01-01',
      somethingInvented: true,
    });
    expect(parsed).toEqual({ artistName: 'Bred' });
    expect('id' in parsed).toBe(false);
    expect('updatedAt' in parsed).toBe(false);
  });

  it('rejects a blank artist name', () => {
    expect(SiteSettingsUpdateSchema.safeParse({ artistName: '' }).success).toBe(false);
  });

  it('rejects a non-numeric price instead of letting it reach the database', () => {
    // Previously produced a 500 from Postgres; now a 400 from validation.
    expect(SiteSettingsUpdateSchema.safeParse({ bustFlat: 'abc' }).success).toBe(false);
    expect(SiteSettingsUpdateSchema.safeParse({ bustFlat: -1 }).success).toBe(false);
    expect(SiteSettingsUpdateSchema.safeParse({ bustFlat: 1.5 }).success).toBe(false);
    expect(SiteSettingsUpdateSchema.safeParse({ bustFlat: 150 }).success).toBe(true);
  });

  it('constrains commissionStatus to the three known states', () => {
    expect(SiteSettingsUpdateSchema.safeParse({ commissionStatus: 'open' }).success).toBe(true);
    expect(SiteSettingsUpdateSchema.safeParse({ commissionStatus: 'maybe' }).success).toBe(false);
  });

  it('accepts an empty payload — a no-op save is valid', () => {
    expect(SiteSettingsUpdateSchema.safeParse({}).success).toBe(true);
  });
});
