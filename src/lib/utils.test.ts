import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  unescapeDoubledQuotes,
  cleanText,
  phpToUsd,
  escapeHtml,
  formatSiteDateTime,
} from './utils';

describe('sanitizeString', () => {
  it('strips zero-width characters and trims', () => {
    expect(sanitizeString('  Bred​ ')).toBe('Bred');
    expect(sanitizeString('B‌r‍e﻿d')).toBe('Bred');
  });

  it('returns null for values that are empty once cleaned', () => {
    // This is what makes a blank admin field fall back to a default rather
    // than rendering an empty heading.
    expect(sanitizeString('')).toBeNull();
    expect(sanitizeString('   ')).toBeNull();
    expect(sanitizeString('​﻿')).toBeNull();
    expect(sanitizeString(null)).toBeNull();
    expect(sanitizeString(undefined)).toBeNull();
  });
});

describe('unescapeDoubledQuotes', () => {
  it('repairs SQL-style doubled quotes', () => {
    // The exact string that was rendering on the live site.
    expect(unescapeDoubledQuotes("Hello, I''m Bred!")).toBe("Hello, I'm Bred!");
    expect(unescapeDoubledQuotes('He said ""hi""')).toBe('He said "hi"');
  });

  it('leaves single quotes alone', () => {
    expect(unescapeDoubledQuotes("I'm fine")).toBe("I'm fine");
  });

  it('passes through null and undefined as null', () => {
    expect(unescapeDoubledQuotes(null)).toBeNull();
    expect(unescapeDoubledQuotes(undefined)).toBeNull();
  });
});

describe('cleanText', () => {
  it('applies both the quote repair and the whitespace strip', () => {
    expect(cleanText("  I''m Bred​  ")).toBe("I'm Bred");
  });

  it('still collapses to null when nothing survives', () => {
    expect(cleanText('   ')).toBeNull();
  });
});

describe('phpToUsd', () => {
  it('rounds to the nearest dollar', () => {
    expect(phpToUsd(150)).toBe(3);
    expect(phpToUsd(560)).toBe(10);
    expect(phpToUsd(0)).toBe(0);
  });
});

describe('escapeHtml', () => {
  it('escapes every character that could break out of an HTML context', () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'
    );
    expect(escapeHtml("O'Brien & co")).toBe('O&#039;Brien &amp; co');
  });

  it('escapes ampersands before the entities it introduces', () => {
    // If & were escaped last, "&lt;" would become "&amp;lt;".
    expect(escapeHtml('<')).toBe('&lt;');
    expect(escapeHtml('&lt;')).toBe('&amp;lt;');
  });
});

describe('formatSiteDateTime', () => {
  it('renders in Manila time regardless of the runtime timezone', () => {
    // Regression guard: this exact instant was reported as "6:03 AM" in a
    // notification email because the Vercel runtime is UTC.
    const instant = new Date('2026-07-28T06:03:39Z');
    expect(formatSiteDateTime(instant)).toBe('Jul 28, 2026, 2:03 PM');
  });

  it('rolls the date over correctly across the UTC day boundary', () => {
    // 23:30 UTC is already the next morning in Manila (UTC+8).
    const instant = new Date('2026-07-28T23:30:00Z');
    expect(formatSiteDateTime(instant)).toBe('Jul 29, 2026, 7:30 AM');
  });
});
