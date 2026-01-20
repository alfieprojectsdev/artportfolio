import { pgTable, serial, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core';

/*
  DATABASE SCHEMA
  This file defines the structure of your database tables using Drizzle ORM.
  Each "export const" is a table in your Postgres database.
*/

// ==========================================
// 1. PORTFOLIO ITEMS (The Gallery)
// Stores information about each artwork displayed on the site.
// ==========================================
export const portfolioItems = pgTable('portfolio_items', {
  id: serial('id').primaryKey(),                // Unique ID for each item
  title: text('title').notNull(),               // Title of the artwork
  imageUrl: text('image_url').notNull(),        // The full-size image URL (from Cloudinary)
  thumbnailUrl: text('thumbnail_url'),          // Smaller version for faster loading (optional)
  category: text('category').notNull(),         // Grouping: 'commission', 'fanart', 'original', 'wip'
  altText: text('alt_text'),                    // Description for screen readers (Accessibility)
  featured: boolean('featured').default(true),  // If false, hides the item from the gallery without deleting it
  displayOrder: integer('display_order').default(0), // Control the sort order (Higher numbers first)
  createdAt: timestamp('created_at').defaultNow(),   // Automatically records when the row was added
});

// ==========================================
// 2. COMMISSION REQUESTS (Future Feature)
// A place to store incoming form submissions if you add a "Request Commission" form later.
// ==========================================
export const commissionRequests = pgTable('commission_requests', {
  id: serial('id').primaryKey(),
  clientName: text('client_name').notNull(),
  email: text('email').notNull(),
  discord: text('discord'),                     // Discord username for contact
  artType: text('art_type').notNull(),          // e.g., 'bust', 'half', 'full'
  style: text('style'),                         // e.g., 'sketch', 'flat', 'rendered'
  status: text('status').default('pending'),    // Track progress: 'pending' -> 'accepted' -> 'completed'
  description: text('description'),
  referenceLinks: text('reference_links'),      // URLs to reference images provided by the client
  notes: text('notes'),                         // Private notes for the artist
  quotedPrice: integer('quoted_price'),         // Final agreed price in PHP
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==========================================
// 3. SITE SETTINGS (Global Configuration)
// This table should only have ONE row. It stores global variables.
// updating this row in the DB updates the website instantly.
// ==========================================
export const siteSettings = pgTable('site_settings', {
  id: serial('id').primaryKey(),
  commissionStatus: text('commission_status').default('open'), // 'open', 'closed', 'waitlist'
  artistName: text('artist_name').default('Bred'),
  bio: text('bio'),                             // The intro text on the homepage
  instagram: text('instagram'),
  discord: text('discord'),

  // PRICING COLUMNS (Store prices in PHP)
  // Bust
  bustSketch: integer('bust_sketch').default(80),
  bustFlat: integer('bust_flat').default(150),
  bustRendered: integer('bust_rendered').default(200),
  // Half Body
  halfSketch: integer('half_sketch').default(100),
  halfFlat: integer('half_flat').default(200),
  halfRendered: integer('half_rendered').default(300),
  // Full Body
  fullSketch: integer('full_sketch').default(200),
  fullFlat: integer('full_flat').default(250),
  fullRendered: integer('full_rendered').default(500),
  // Chibi
  chibiSketch: integer('chibi_sketch').default(40),
  chibiFlat: integer('chibi_flat').default(100),
  chibiRendered: integer('chibi_rendered').default(150),

  updatedAt: timestamp('updated_at').defaultNow(),
});

// TypeScript Types (automatically inferred from the tables above)
// These help VS Code provide autocomplete in other files.
export type PortfolioItem = typeof portfolioItems.$inferSelect;
export type NewPortfolioItem = typeof portfolioItems.$inferInsert;
export type CommissionRequest = typeof commissionRequests.$inferSelect;
export type NewCommissionRequest = typeof commissionRequests.$inferInsert;
export type SiteSettings = typeof siteSettings.$inferSelect;
