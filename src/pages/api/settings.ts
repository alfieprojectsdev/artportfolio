import type { APIRoute } from 'astro';
import { db, siteSettings } from '../../db';
import { eq } from 'drizzle-orm';

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
  try {
    const body = await request.json();

    // Check if settings exist
    const [existing] = await db.select().from(siteSettings).limit(1);

    let result;
    if (existing) {
      // Update existing
      [result] = await db
        .update(siteSettings)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(siteSettings.id, existing.id))
        .returning();
    } else {
      // Insert new
      [result] = await db
        .insert(siteSettings)
        .values(body)
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
