import { pgTable, serial, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core';

// Portfolio Items (The Gallery)
export const portfolioItems = pgTable('portfolio_items', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  imageUrl: text('image_url').notNull(),       // Cloudinary URL (rendered/final version)
  flatUrl: text('flat_url'),                    // Cloudinary URL (flat/sketch version for comparison slider)
  thumbnailUrl: text('thumbnail_url'),          // Optimized thumbnail URL
  category: text('category').notNull(),         // 'commission', 'fanart', 'original', 'wip'
  altText: text('alt_text'),                    // Accessibility
  featured: boolean('featured').default(true),  // Show in gallery
  displayOrder: integer('display_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Commission Requests (The Business)
export const commissionRequests = pgTable('commission_requests', {
  id: serial('id').primaryKey(),
  clientName: text('client_name').notNull(),
  email: text('email').notNull(),
  discord: text('discord'),                     // Discord username
  artType: text('art_type').notNull(),          // 'bust', 'half', 'full', 'chibi'
  style: text('style'),                         // 'sketch', 'flat', 'rendered'
  status: text('status').default('pending'),    // 'pending', 'accepted', 'in_progress', 'completed', 'rejected'
  description: text('description'),
  referenceLinks: text('reference_links'),      // JSON string or comma-separated URLs
  notes: text('notes'),                         // Artist's internal notes
  quotedPrice: integer('quoted_price'),         // Price in PHP
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Site Settings (single row for global config)
export const siteSettings = pgTable('site_settings', {
  id: serial('id').primaryKey(),
  commissionStatus: text('commission_status').default('open'), // 'open', 'closed', 'waitlist'
  artistName: text('artist_name').default('Bred'),
  bio: text('bio'),
  instagram: text('instagram'),
  discord: text('discord'),
  // Pricing (in PHP)
  bustSketch: integer('bust_sketch').default(80),
  bustFlat: integer('bust_flat').default(150),
  bustRendered: integer('bust_rendered').default(200),
  halfSketch: integer('half_sketch').default(100),
  halfFlat: integer('half_flat').default(200),
  halfRendered: integer('half_rendered').default(300),
  fullSketch: integer('full_sketch').default(200),
  fullFlat: integer('full_flat').default(250),
  fullRendered: integer('full_rendered').default(500),
  chibiSketch: integer('chibi_sketch').default(40),
  chibiFlat: integer('chibi_flat').default(100),
  chibiRendered: integer('chibi_rendered').default(150),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Type exports for use in components
export type PortfolioItem = typeof portfolioItems.$inferSelect;
export type NewPortfolioItem = typeof portfolioItems.$inferInsert;
export type CommissionRequest = typeof commissionRequests.$inferSelect;
export type NewCommissionRequest = typeof commissionRequests.$inferInsert;
export type SiteSettings = typeof siteSettings.$inferSelect;
