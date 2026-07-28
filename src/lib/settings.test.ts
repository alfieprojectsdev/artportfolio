import { describe, it, expect } from 'vitest';
import { DEFAULT_SITE_SETTINGS, resolveSiteConfig } from './settings';
import type { SiteSettings } from '../db/schema';

/** A settings row with only the fields a given test cares about. */
const row = (overrides: Partial<SiteSettings>) => overrides as SiteSettings;

// Note: `SETTINGS_ROW_ID` is introduced by the atomic-upsert change (#48) and
// does not exist on master, so it is not asserted here. Worth covering once
// both that change and this runner have landed — the constant being 0 rather
// than 1 is load-bearing.

describe('resolveSiteConfig', () => {
  it('returns the defaults when there is no row', () => {
    const config = resolveSiteConfig(null);
    expect(config.artistName).toBe(DEFAULT_SITE_SETTINGS.artistName);
    expect(config.commissionStatus).toBe('open');
    expect(config.bustFlat).toBe(DEFAULT_SITE_SETTINGS.bustFlat);
  });

  it('prefers stored values over defaults', () => {
    const config = resolveSiteConfig(row({ artistName: 'Someone Else', bustFlat: 175 }));
    expect(config.artistName).toBe('Someone Else');
    expect(config.bustFlat).toBe(175);
  });

  it('falls back when a display field is blank rather than rendering empty', () => {
    // The failure this guards against is a header with no artist name.
    expect(resolveSiteConfig(row({ artistName: '' })).artistName).toBe(
      DEFAULT_SITE_SETTINGS.artistName
    );
    expect(resolveSiteConfig(row({ artistName: '   ' })).artistName).toBe(
      DEFAULT_SITE_SETTINGS.artistName
    );
    expect(resolveSiteConfig(row({ artistName: null })).artistName).toBe(
      DEFAULT_SITE_SETTINGS.artistName
    );
  });

  it('falls back when a field contains only invisible characters', () => {
    expect(resolveSiteConfig(row({ artistName: '​﻿' })).artistName).toBe(
      DEFAULT_SITE_SETTINGS.artistName
    );
  });

  it('repairs SQL-style doubled quotes on read', () => {
    // The stored bio genuinely contained this; the site rendered "I''m Bred".
    const config = resolveSiteConfig(row({ bio: "Hello, I''m Bred!" }));
    expect(config.bio).toBe("Hello, I'm Bred!");
  });

  it('repairs the social handles too, not just name and bio', () => {
    const config = resolveSiteConfig(row({ instagram: "demented''toast", discord: "  toast  " }));
    expect(config.instagram).toBe("demented'toast");
    expect(config.discord).toBe('toast');
  });

  it('keeps a stored commissionStatus of closed', () => {
    // Regression guard: a naive `|| default` would turn any falsy-looking
    // value back into "open" and reopen commissions unexpectedly.
    expect(resolveSiteConfig(row({ commissionStatus: 'closed' })).commissionStatus).toBe('closed');
    expect(resolveSiteConfig(row({ commissionStatus: 'waitlist' })).commissionStatus).toBe(
      'waitlist'
    );
  });

  it('preserves price columns that are legitimately zero', () => {
    // 0 is falsy; a `||` fallback would silently replace a free tier.
    expect(resolveSiteConfig(row({ bustSketch: 0 })).bustSketch).toBe(0);
  });
});
