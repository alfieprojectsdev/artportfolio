import type { APIRoute } from 'astro';
import { db, siteSettings } from '../../db';
import { eq } from 'drizzle-orm';
import { checkAuth, unauthorizedResponse } from '../../lib/auth';
import { sanitizeString } from '../../lib/utils';
import { z } from 'zod';

// Define schema for input validation to prevent mass assignment
const updateSettingsSchema = z.object({
  commissionStatus: z.enum(['open', 'closed', 'waitlist']).optional(),
  artistName: z.string().optional(),
  bio: z.string().nullable().optional(),
  instagram: z.string().nullable().optional(),
  discord: z.string().nullable().optional(),
  // Pricing fields - coerce to number in case they come as strings
  bustSketch: z.coerce.number().int().min(0).optional(),
  bustFlat: z.coerce.number().int().min(0).optional(),
  bustRendered: z.coerce.number().int().min(0).optional(),
  halfSketch: z.coerce.number().int().min(0).optional(),
  halfFlat: z.coerce.number().int().min(0).optional(),
  halfRendered: z.coerce.number().int().min(0).optional(),
  fullSketch: z.coerce.number().int().min(0).optional(),
  fullFlat: z.coerce.number().int().min(0).optional(),
  fullRendered: z.coerce.number().int().min(0).optional(),
  chibiSketch: z.coerce.number().int().min(0).optional(),
  chibiFlat: z.coerce.number().int().min(0).optional(),
  chibiRendered: z.coerce.number().int().min(0).optional(),
});

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

    // Validate request body against schema
    const parseResult = updateSettingsSchema.safeParse(body);

    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request data', details: parseResult.error.issues }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const validatedData = parseResult.data;

    // Sanitize artistName if present
    const sanitizedName = sanitizeString(validatedData.artistName);

    // Construct the update object with only allowed fields
    const sanitizedBody = {
      ...validatedData,
      // Ensure artistName is always set to a valid string or default 'Bred'
      artistName: sanitizedName || 'Bred',
    };

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
