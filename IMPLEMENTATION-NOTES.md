# Bred's Portfolio (Astro Version) - Implementation Notes 🚀

Welcome to the upgraded version of your portfolio! This version uses **Astro** and a **Database** (Neon/Postgres) to make managing your art and business easier.

## 1. Project Structure

Unlike the old static HTML file, this project is broken down into modular parts:

*   **`src/pages/index.astro`**: This is the main homepage. It combines HTML, CSS, and Server-Side JavaScript.
*   **`src/db/`**: This folder handles the "Brain" of the site (the database).
    *   `schema.ts`: Defines what data we store (e.g., "A Portfolio Item has a title, image, and category").
    *   `index.ts`: Connects to the database.
*   **`public/`**: Static files like the background image (`bg.png`) live here.

## 2. The Database (`src/db/schema.ts`)

We use a tool called **Drizzle ORM** to talk to the database.

*   **`siteSettings`**: A single row that stores your global config (Bio, Social Links, Commission Status, Pricing). Change these in the database, and the site updates instantly!
*   **`portfolioItems`**: A table for your art. Each row is one image in your gallery.
*   **`commissionRequests`**: (Future Feature) A place to store incoming requests if you build a form later.

## 3. The Page (`src/pages/index.astro`)

This file has three sections, separated by `---`:

### A. The "Frontmatter" (Server-Side Logic)
The code between the `---` fences runs **on the server** before the page is sent to the user.
1.  It connects to the DB (`db.select()`).
2.  It fetches your `galleryItems` and `siteSettings`.
3.  It calculates things like "Unique Categories" for the filter buttons.

### B. The Template (HTML)
This looks like normal HTML, but it's "supercharged":
*   `{config.artistName}`: Injects data from the database.
*   `{galleryItems.map(...)}`: Loops through your DB items to create the gallery grid automatically.

### C. The Styles & Scripts
*   `<style>`: Scoped CSS (mostly copied from your original design).
*   `<script>`: Client-side JavaScript that runs in the user's browser (Lightbox, Filtering, Discord Copy).

## 4. How It Works

1.  **Request:** A user visits `breds-art.com`.
2.  **Server:** Astro wakes up, talks to Neon DB, grabs your latest art and pricing.
3.  **Render:** Astro builds the HTML with that fresh data.
4.  **Response:** The user sees the fully populated page.

## Maintenance Tips

*   **Adding Art:** You no longer edit HTML! Just add a row to the `portfolio_items` table in your Database Dashboard.
*   **Changing Prices:** Update the `bust_sketch` (etc.) columns in the `site_settings` table.
*   **Updating Bio:** Update the `bio` column in `site_settings`.

Happy Coding! 🎨
