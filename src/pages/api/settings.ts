import type { APIRoute } from 'astro';
import { db, siteSettings } from '../../db';
import { eq } from 'drizzle-orm';
import { checkAuth, unauthorizedResponse } from '../../lib/auth';
import { cleanText, sanitizeString } from '../../lib/utils';
import { DEFAULT_SITE_SETTINGS } from '../../lib/settings';
import { SiteSettingsUpdateSchema, type SiteSettingsUpdate } from '../../lib/schemas';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/** Optional free-text columns that need whitespace/quote repair before storage. */
const NULLABLE_TEXT_FIELDS = ['bio', 'instagram', 'discord'] as const;

/**
 * `DEFAULT_SITE_SETTINGS.avatarUrl` is a *display* fallback for
 * `resolveSiteConfig` — it must never reach this route's consumers as a
 * literal value, because the admin UI's upload/preview toggle keys off
 * whether `avatarUrl` is truthy. If a bundled-asset path is defaulted in here,
 * the admin sees a picture "already set" that was never actually uploaded,
 * and cannot get back to the upload button without first clicking Remove on
 * something that was never real.
 *
 * A no-row response is the one place this matters: everywhere else,
 * `resolveSiteConfig` — not the raw API response — is what the public page
 * reads, and it already applies this same fallback correctly.
 */
const DB_DEFAULTS = (() => {
  const { avatarUrl: _displayOnly, ...rest } = DEFAULT_SITE_SETTINGS;
  return rest;
})();

// GET /api/settings - Get site settings (public: no PII on this row)
export const GET: APIRoute = async () => {
  try {
    const [settings] = await db.select().from(siteSettings).limit(1);

    if (!settings) {
      return json({ id: 0, ...DB_DEFAULTS, avatarUrl: null });
    }

    return json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return json({ error: 'Failed to fetch settings' }, 500);
  }
};

// PUT /api/settings - Update site settings
export const PUT: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();

    // Validate against an explicit allowlist. Anything not in the schema (id,
    // updatedAt, unknown columns) is dropped rather than written straight to
    // the row, matching the pattern the gallery/commission routes use.
    const parsed = SiteSettingsUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return json(
        {
          error: 'Invalid settings payload',
          fields: parsed.error.flatten().fieldErrors,
        },
        400
      );
    }

    const updates: SiteSettingsUpdate = { ...parsed.data };

    // artistName drives the page title and header; never store it blank.
    if (updates.artistName !== undefined) {
      const artistName = cleanText(updates.artistName);
      if (!artistName) {
        return json({ error: 'Artist name is required and cannot be empty' }, 400);
      }
      updates.artistName = artistName;
    }

    for (const field of NULLABLE_TEXT_FIELDS) {
      if (updates[field] !== undefined) {
        updates[field] = cleanText(updates[field]);
      }
    }

    // Not cleanText: this is a URL, not prose, so the quote-repair half of
    // cleanText has no business touching it — same reasoning resolveSiteConfig
    // already applies on read. Collapses whitespace-only input to null rather
    // than storing it, which would otherwise pass the schema's length check
    // and render as a broken <img src="   "> in the admin preview.
    if (updates.avatarUrl !== undefined) {
      updates.avatarUrl = sanitizeString(updates.avatarUrl);
    }

    const [existing] = await db.select().from(siteSettings).limit(1);

    let result;
    if (existing) {
      [result] = await db
        .update(siteSettings)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(siteSettings.id, existing.id))
        .returning();
    } else {
      // DB_DEFAULTS, not DEFAULT_SITE_SETTINGS — see the comment above it.
      // avatarUrl is left out entirely so a first save that never touches the
      // avatar field stores null, not the bundled-asset path.
      [result] = await db
        .insert(siteSettings)
        .values({ ...DB_DEFAULTS, ...updates })
        .returning();
    }

    return json(result);
  } catch (error) {
    console.error('Error updating settings:', error);
    return json({ error: 'Failed to update settings' }, 500);
  }
};
