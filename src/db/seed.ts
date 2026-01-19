import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { portfolioItems, siteSettings } from './schema';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Check if settings exist
    const settings = await db.select().from(siteSettings).limit(1);
    if (settings.length === 0) {
      console.log('Creating default site settings...');
      await db.insert(siteSettings).values({
        artistName: 'Bred',
        bio: "Hello, I'm Bred! I'm a senior student doing commissions and art on the side. If you like my style, I'd love to work with you! :D",
        commissionStatus: 'open',
        instagram: 'demented.toast',
        discord: 'toasted_insanity',
      });
    } else {
      console.log('Site settings already exist.');
    }

    // Check if portfolio items exist
    const items = await db.select().from(portfolioItems).limit(1);
    if (items.length === 0) {
      console.log('Creating sample portfolio items...');
      await db.insert(portfolioItems).values([
        {
          title: 'Commission Example 1',
          imageUrl: 'https://placehold.co/600x400/png',
          thumbnailUrl: 'https://placehold.co/600x400/png',
          category: 'commission',
          featured: true,
          displayOrder: 1,
        },
        {
          title: 'Fanart Example',
          imageUrl: 'https://placehold.co/400x600/png',
          thumbnailUrl: 'https://placehold.co/400x600/png',
          category: 'fanart',
          featured: true,
          displayOrder: 2,
        },
        {
          title: 'Original Character',
          imageUrl: 'https://placehold.co/600x600/png',
          thumbnailUrl: 'https://placehold.co/600x600/png',
          category: 'original',
          featured: true,
          displayOrder: 3,
        },
      ]);
    } else {
      console.log('Portfolio items already exist.');
    }

    console.log('✅ Seeding complete!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
