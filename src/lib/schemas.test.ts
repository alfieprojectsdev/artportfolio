import { describe, it, expect } from 'vitest';
import { calculateEstimatedPrice, PRICING, ArtTypeEnum, StyleEnum } from './schemas';

describe('calculateEstimatedPrice', () => {
  it('should return correct price for all valid art type and style combinations', () => {
    const artTypes = ArtTypeEnum.options;
    const styles = StyleEnum.options;

    artTypes.forEach((artType) => {
      styles.forEach((style) => {
        const expectedPrice = PRICING[artType][style];
        const actualPrice = calculateEstimatedPrice(artType, style);
        expect(actualPrice).toBe(expectedPrice);
      });
    });
  });

  it('should specifically handle "custom" art type returning 0', () => {
    const styles = StyleEnum.options;
    styles.forEach((style) => {
      expect(calculateEstimatedPrice('custom', style)).toBe(0);
    });
  });

  it('should verify pricing integrity (sanity check)', () => {
      // Just picking a few specific values to ensure the loop isn't lying to us if PRICING object itself was wrong (though the test above checks consistency, this checks specific values)
      expect(calculateEstimatedPrice('headshot', 'sketch')).toBe(60);
      expect(calculateEstimatedPrice('full', 'rendered')).toBe(500);
      expect(calculateEstimatedPrice('chibi', 'flat')).toBe(100);
  });
});
