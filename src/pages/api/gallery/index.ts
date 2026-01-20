import type { APIRoute } from 'astro';
import { db, portfolioItems } from '../../../db';
import { desc } from 'drizzle-orm';
import { checkAuth, unauthorizedResponse } from '../../../lib/auth';

// GET /api/gallery - List all gallery items
export const GET: APIRoute = async () => {
  try {
    const items = await db
      .select()
      .from(portfolioItems)
      .orderBy(desc(portfolioItems.displayOrder), desc(portfolioItems.createdAt));

    return new Response(JSON.stringify(items), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching gallery:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch gallery' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST /api/gallery - Add new gallery item
export const POST: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { title, imageUrl, category, altText } = body;

    if (!title || !imageUrl || !category) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate thumbnail URL from Cloudinary (w_400, auto quality, auto format)
    const thumbnailUrl = imageUrl.replace('/upload/', '/upload/w_400,q_auto,f_auto/');

    const [newItem] = await db
      .insert(portfolioItems)
      .values({
        title,
        imageUrl,
        thumbnailUrl,
        category,
        altText: altText || title,
        featured: true,
      })
      .returning();

    return new Response(JSON.stringify(newItem), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error adding gallery item:', error);
    return new Response(JSON.stringify({ error: 'Failed to add item' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
