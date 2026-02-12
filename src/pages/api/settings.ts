import type { APIRoute } from 'astro';
import { db, siteSettings } from '../../db';
import { eq } from 'drizzle-orm';
import { checkAuth, unauthorizedResponse } from '../../lib/auth';
import { sanitizeString } from '../../lib/utils';

const defaults = {
  artistName: 'Bred',
  bio: "Hello, I'm Bred! I'm a senior student doing commissions and art on the side. If you like my style, I'd love to work with you! :D",
  instagram: 'demented.toast',
  discord: 'toasted_insanity',
};

// GET /api/settings - Get site settings
export const GET: APIRoute = async () => {
  try {
    const [settings] = await db.select().from(siteSettings).limit(1);

    // If no settings exist, return defaults
    if (!settings) {
      return new Response(JSON.stringify({
        id: 0,
        commissionStatus: 'open',
        artistName: 'Bred',
        bio: "Hello, I'm Bred! I'm a senior student doing commissions and art on the side.",
        instagram: 'demented.toast',
        discord: 'toasted_insanity',
        bustSketch: 80,
        bustFlat: 150,
        bustRendered: 200,
        halfSketch: 100,
        halfFlat: 200,
        halfRendered: 300,
        fullSketch: 200,
        fullFlat: 250,
        fullRendered: 500,
        chibiSketch: 40,
        chibiFlat: 100,
        chibiRendered: 150,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(settings), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch settings' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// PUT /api/settings - Update site settings
export const PUT: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const sanitized = sanitizeString(body.artistName);

    // Validate and sanitize critical fields
    const sanitizedBody = {
      ...body,
      artistName: sanitized || 'Bred',
    };

    // Validate artistName is not empty
    if (!sanitizedBody.artistName || sanitizedBody.artistName.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Artist name is required and cannot be empty' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if settings exist
    const [existing] = await db.select().from(siteSettings).limit(1);

    let result;
    if (existing) {
      // Update existing
      [result] = await db
        .update(siteSettings)
        .set({ ...sanitizedBody, updatedAt: new Date() })
        .where(eq(siteSettings.id, existing.id))
        .returning();
    } else {
      // Insert new
      [result] = await db
        .insert(siteSettings)
        .values(sanitizedBody)
        .returning();
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return new Response(JSON.stringify({ error: 'Failed to update settings' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
