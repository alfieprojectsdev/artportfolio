import { describe, it, expect } from 'vitest';
import { CommissionRequestSchema, calculateEstimatedPrice } from './schemas';

describe('CommissionRequestSchema', () => {
  const validData = {
    clientName: 'Valid Client',
    email: 'test@example.com',
    discord: 'discorduser',
    artType: 'bust',
    style: 'rendered',
    description: 'This is a valid description with more than 20 characters.',
    refImages: ['https://example.com/image1.png', 'https://example.com/image2.png'],
  };

  it('validates a correct commission request', () => {
    const result = CommissionRequestSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validData);
    }
  });

  it('validates with minimal required fields', () => {
    const minimalData = {
      clientName: 'Jo',
      email: 'jo@test.com',
      artType: 'headshot',
      style: 'sketch',
      description: 'A simple sketch of a character headshot.',
    };
    const result = CommissionRequestSchema.safeParse(minimalData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.refImages).toEqual([]);
      expect(result.data.discord).toBeUndefined();
    }
  });

  describe('clientName', () => {
    it('fails if name is too short (< 2 chars)', () => {
      const result = CommissionRequestSchema.safeParse({ ...validData, clientName: 'A' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Name must be at least 2 characters');
      }
    });

    it('fails if name is too long (> 100 chars)', () => {
      const longName = 'a'.repeat(101);
      const result = CommissionRequestSchema.safeParse({ ...validData, clientName: longName });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Name must be less than 100 characters');
      }
    });
  });

  describe('email', () => {
    it('fails with invalid email', () => {
      const result = CommissionRequestSchema.safeParse({ ...validData, email: 'not-an-email' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Please enter a valid email address');
      }
    });
  });

  describe('discord', () => {
    it('fails if discord username is too long (> 50 chars)', () => {
      const longDiscord = 'a'.repeat(51);
      const result = CommissionRequestSchema.safeParse({ ...validData, discord: longDiscord });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Discord username must be less than 50 characters');
      }
    });

    it('transforms empty string to undefined', () => {
      const result = CommissionRequestSchema.safeParse({ ...validData, discord: '' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.discord).toBeUndefined();
      }
    });

    it('transforms null to undefined', () => {
        // @ts-expect-error Testing runtime behavior for null
        const result = CommissionRequestSchema.safeParse({ ...validData, discord: null });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.discord).toBeUndefined();
        }
      });
  });

  describe('artType', () => {
    it('fails with invalid art type', () => {
      const result = CommissionRequestSchema.safeParse({ ...validData, artType: 'invalid_type' });
      expect(result.success).toBe(false);
    });
  });

  describe('style', () => {
    it('fails with invalid style', () => {
      const result = CommissionRequestSchema.safeParse({ ...validData, style: 'invalid_style' });
      expect(result.success).toBe(false);
    });
  });

  describe('description', () => {
    it('fails if description is too short (< 20 chars)', () => {
      const result = CommissionRequestSchema.safeParse({ ...validData, description: 'Too short' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Please provide at least 20 characters describing your commission');
      }
    });

    it('fails if description is too long (> 2000 chars)', () => {
      const longDesc = 'a'.repeat(2001);
      const result = CommissionRequestSchema.safeParse({ ...validData, description: longDesc });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Description must be less than 2000 characters');
      }
    });
  });

  describe('refImages', () => {
    it('fails if any image URL is invalid', () => {
      const result = CommissionRequestSchema.safeParse({
        ...validData,
        refImages: ['https://valid.com', 'invalid-url'],
      });
      expect(result.success).toBe(false);
    });

    it('fails if more than 5 images are provided', () => {
      const manyImages = Array(6).fill('https://example.com/image.png');
      const result = CommissionRequestSchema.safeParse({ ...validData, refImages: manyImages });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Maximum 5 reference images');
      }
    });

    it('defaults to empty array if omitted', () => {
        const { refImages, ...dataWithoutImages } = validData;
        const result = CommissionRequestSchema.safeParse(dataWithoutImages);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.refImages).toEqual([]);
        }
    });
  });
});

describe('calculateEstimatedPrice', () => {
  it('returns correct price for bust sketch', () => {
    expect(calculateEstimatedPrice('bust', 'sketch')).toBe(80);
  });

  it('returns correct price for full rendered', () => {
    expect(calculateEstimatedPrice('full', 'rendered')).toBe(500);
  });

  it('returns 0 for custom commissions', () => {
    expect(calculateEstimatedPrice('custom', 'rendered')).toBe(0);
  });
});
