# Migration Guide: Vanilla JS to Astro + Neon CMS

This guide outlines how to migrate the content from the original static HTML/JS site to your new Astro database-driven system.

## 1. Overview of Changes

| Feature | Original (Vanilla) | New (Astro + Neon) |
| :--- | :--- | :--- |
| **Content Source** | Hardcoded in `index.html` | Stored in Postgres Database (Neon) |
| **Images** | Local files in `assets/` | Cloudinary URLs stored in DB |
| **Pricing** | Hardcoded HTML | Configurable in `site_settings` table |
| **Gallery** | Hardcoded HTML | Dynamic rows in `portfolio_items` table |

---

## 2. Populating the Database

You need to run these SQL commands in your Neon Console (SQL Editor) to seed the database with your original content.

### Step A: Site Settings & Pricing
Populates your bio, socials, and commission rates.

```sql
INSERT INTO site_settings (
  artist_name,
  bio,
  commission_status,
  instagram,
  discord,
  bust_sketch, bust_flat, bust_rendered,
  half_sketch, half_flat, half_rendered,
  full_sketch, full_flat, full_rendered,
  chibi_sketch, chibi_flat, chibi_rendered
) VALUES (
  'Bred',
  'Hello, I''m Bred! I''m a senior student doing commissions and art on the side. If you like my style, I''d love to work with you! :D',
  'open',
  'demented.toast',
  'toasted_insanity',
  -- Pricing (PHP)
  80, 150, 200,   -- Bust
  100, 200, 300,  -- Half Body
  200, 250, 500,  -- Full Body
  40, 100, 150    -- Chibi
);
```

### Step B: Portfolio Items (Gallery)
Populates the gallery. *Note: You must upload your images to Cloudinary first and replace `CLOUDINARY_URL_HERE` with the actual public URL.*

```sql
INSERT INTO portfolio_items (title, category, image_url, alt_text, display_order) VALUES
('Commission Work', 'commission', 'https://res.cloudinary.com/.../angentela_commission.png', 'Commission Work', 1),
('House of Wrath', 'original', 'https://res.cloudinary.com/.../house_of_wrath.png', 'House of Wrath', 2),
('Xie Lian Fanart', 'fanart', 'https://res.cloudinary.com/.../xie_lian.png', 'Xie Lian Fanart', 3),
('WIP Line Art', 'wip', 'https://res.cloudinary.com/.../into_the_abyss_wip.jpg', 'Into The Abyss WIP', 4);
```

### Note on Missing Features
The original site had "Example Images" inside the Pricing Cards (e.g., `esper_pfp.png` for Headshot). The current Astro schema does not have specific columns for "Pricing Card Images". These images will not appear unless you update the schema and code.

---

## 3. Step-by-Step Migration Instructions

1.  **Set up Cloudinary**
    *   Create a Cloudinary account.
    *   Upload all images from the original `assets/` folder.
    *   Copy the "Public URL" for each image.

2.  **Set up Neon (Postgres)**
    *   Create a Neon project.
    *   Get your connection string (`DATABASE_URL`).
    *   Run `npx drizzle-kit push` to create the tables.

3.  **Seed Data**
    *   Open the SQL Editor in Neon.
    *   Run the SQL commands from **Section 2** above (with your real Image URLs).

4.  **Connect Local Dev**
    *   Create a `.env` file:
        ```bash
        DATABASE_URL="postgresql://..."
        ```
    *   Run `npm run dev`.

---

## 4. Troubleshooting

### Scenario: "Database connection error" in Console
*   **Cause:** Incorrect `DATABASE_URL` or IP restrictions.
*   **Fix:** Check `.env` file. Ensure your IP is allowed in Neon dashboard.

### Scenario: Images not loading
*   **Cause:** Broken Cloudinary links.
*   **Fix:** Check the `image_url` column in `portfolio_items`. Paste the URL in a browser to verify it works.

### Scenario: Gallery is empty
*   **Cause:** `featured` column might be `false` (default is `true`, but check DB).
*   **Fix:** Run `UPDATE portfolio_items SET featured = true;`

### Scenario: Pricing is wrong
*   **Cause:** `site_settings` table might be empty (code falls back to hardcoded defaults).
*   **Fix:** Ensure you ran the INSERT for `site_settings`.
