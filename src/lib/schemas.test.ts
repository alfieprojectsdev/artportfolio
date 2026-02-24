import { describe, it, expect } from 'vitest';
import { calculateEstimatedPrice, PRICING } from './schemas';

describe('calculateEstimatedPrice', () => {
  it('should return the correct price for each ArtType and Style combination', () => {
    // Headshot
    expect(calculateEstimatedPrice('headshot', 'sketch')).toBe(PRICING.headshot.sketch);
    expect(calculateEstimatedPrice('headshot', 'flat')).toBe(PRICING.headshot.flat);
    expect(calculateEstimatedPrice('headshot', 'rendered')).toBe(PRICING.headshot.rendered);

    // Bust
    expect(calculateEstimatedPrice('bust', 'sketch')).toBe(PRICING.bust.sketch);
    expect(calculateEstimatedPrice('bust', 'flat')).toBe(PRICING.bust.flat);
    expect(calculateEstimatedPrice('bust', 'rendered')).toBe(PRICING.bust.rendered);

    // Half Body
    expect(calculateEstimatedPrice('half', 'sketch')).toBe(PRICING.half.sketch);
    expect(calculateEstimatedPrice('half', 'flat')).toBe(PRICING.half.flat);
    expect(calculateEstimatedPrice('half', 'rendered')).toBe(PRICING.half.rendered);

    // Full Body
    expect(calculateEstimatedPrice('full', 'sketch')).toBe(PRICING.full.sketch);
    expect(calculateEstimatedPrice('full', 'flat')).toBe(PRICING.full.flat);
    expect(calculateEstimatedPrice('full', 'rendered')).toBe(PRICING.full.rendered);

    // Chibi
    expect(calculateEstimatedPrice('chibi', 'sketch')).toBe(PRICING.chibi.sketch);
    expect(calculateEstimatedPrice('chibi', 'flat')).toBe(PRICING.chibi.flat);
    expect(calculateEstimatedPrice('chibi', 'rendered')).toBe(PRICING.chibi.rendered);
  });

  it('should return 0 for "custom" art type as it requires a quote', () => {
    expect(calculateEstimatedPrice('custom', 'sketch')).toBe(0);
    expect(calculateEstimatedPrice('custom', 'flat')).toBe(0);
    expect(calculateEstimatedPrice('custom', 'rendered')).toBe(0);
  });

  it('should match specific known values from the current pricing table', () => {
    // This catches accidental changes to the PRICING table itself if they weren't intended
    expect(calculateEstimatedPrice('headshot', 'sketch')).toBe(60);
    expect(calculateEstimatedPrice('full', 'rendered')).toBe(500);
    expect(calculateEstimatedPrice('chibi', 'flat')).toBe(100);
  });

  it('should correctly access the PRICING object for all valid combinations', () => {
    const artTypes = Object.keys(PRICING) as Array<keyof typeof PRICING>;
    const styles = ['sketch', 'flat', 'rendered'] as const;

    for (const artType of artTypes) {
      for (const style of styles) {
        expect(calculateEstimatedPrice(artType, style)).toBe(PRICING[artType][style]);
      }
    }
  });
});
