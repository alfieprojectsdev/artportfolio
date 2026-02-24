import { describe, it, expect } from 'vitest';
import { sanitizeString } from './utils';

describe('sanitizeString', () => {
    it('returns null for null or undefined input', () => {
        expect(sanitizeString(null)).toBeNull();
        expect(sanitizeString(undefined)).toBeNull();
    });

    it('returns null for empty strings', () => {
        expect(sanitizeString('')).toBeNull();
    });

    it('returns null for strings with only whitespace', () => {
        expect(sanitizeString('   ')).toBeNull();
        expect(sanitizeString('\t\n')).toBeNull();
    });

    it('returns the string as-is if it is clean', () => {
        expect(sanitizeString('hello')).toBe('hello');
        expect(sanitizeString('hello world')).toBe('hello world');
    });

    it('trims leading and trailing whitespace', () => {
        expect(sanitizeString('  hello  ')).toBe('hello');
    });

    it('removes zero-width spaces and other invisible characters', () => {
        // \u200B: Zero-width space
        expect(sanitizeString('hello\u200Bworld')).toBe('helloworld');
        expect(sanitizeString('\u200Bhello')).toBe('hello');

        // \uFEFF: Zero-width no-break space
        expect(sanitizeString('\uFEFFhello')).toBe('hello');

        // Combined
        expect(sanitizeString('\u200B\uFEFF')).toBeNull();
    });

    it('returns null if the result is empty after cleaning', () => {
        expect(sanitizeString(' \u200B ')).toBeNull();
    });
});
