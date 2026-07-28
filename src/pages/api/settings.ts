import type { APIRoute } from 'astro';
import { db, siteSettings } from '../../db';
import { checkAuth, unauthorizedResponse } from '../../lib/auth';
import { cleanText } from '../../lib/utils';
import { DEFAULT_SITE_SETTINGS, SETTINGS_ROW_ID } from '../../lib/settings';
import { SiteSettingsUpdateSchema, type SiteSettingsUpdate } from '../../lib/schemas';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/** Optional free-text columns that need whitespace/quote repair before storage. */
const NULLABLE_TEXT_FIELDS = ['bio', 'instagram', 'discord'] as const;

// GET /api/settings - Get site settings (public: no PII on this row)
export const GET: APIRoute = async () => {
  try {
    const [settings] = await db.select().from(siteSettings).limit(1);

    if (!settings) {
      return json({ id: 0, ...DEFAULT_SITE_SETTINGS });
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

    // Single atomic upsert rather than select-then-branch.
    //
    // The old read-decide-write was a TOCTOU race: two concurrent PUTs could
    // both observe no row and both insert, leaving two site_settings rows for a
    // table that must have exactly one. `limit(1)` would then pick between them
    // arbitrarily, so the public page and the admin dashboard could disagree
    // about prices. One admin makes that unlikely, not impossible.
    //
    // The insert branch seeds defaults for columns the payload omits; the
    // conflict branch touches only what was sent, so a partial update cannot
    // silently reset unrelated fields back to defaults.
    const [result] = await db
      .insert(siteSettings)
      .values({ id: SETTINGS_ROW_ID, ...DEFAULT_SITE_SETTINGS, ...updates })
      .onConflictDoUpdate({
        target: siteSettings.id,
        set: { ...updates, updatedAt: new Date() },
      })
      .returning();

    return json(result);
  } catch (error) {
    console.error('Error updating settings:', error);
    return json({ error: 'Failed to update settings' }, 500);
  }
};
