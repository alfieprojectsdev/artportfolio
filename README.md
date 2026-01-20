# Bred's Art Portfolio (Astro + Neon)

A dynamic, database-driven portfolio website built for digital art commissions.

**Live Demo:** [Link to your Vercel/Netlify deployment]

## 🚀 Features

*   **Dynamic Gallery:** Manage artwork via a Postgres database (Neon) instead of editing HTML.
*   **Real-time Config:** Update commission status ("Open", "Closed"), pricing, and bio instantly.
*   **Filtering:** Filter artwork by category (Commission, Fanart, Original, WIP).
*   **Performance:** Built with Astro for blazing fast static-first rendering.
*   **Optimized Images:** Integration with Cloudinary for fast image delivery.
*   **Analytics:** Privacy-friendly tracking with GoatCounter.

## 🛠 Tech Stack

*   **Framework:** [Astro](https://astro.build)
*   **Database:** Postgres (via [Neon](https://neon.tech))
*   **ORM:** [Drizzle](https://orm.drizzle.team)
*   **Styling:** Vanilla CSS (Scoped)
*   **Deployment:** Vercel (recommended)

## 📦 Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/artportfolio.git
    cd artportfolio
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory:
    ```bash
    DATABASE_URL="postgresql://user:password@ep-xyz.region.aws.neon.tech/neondb?sslmode=require"
    ```

4.  **Run Local Development Server**
    ```bash
    npm run dev
    ```
    Visit `http://localhost:4321` to see the site.

## 🗄 Database Management

This project uses Drizzle Kit to manage the database schema.

*   **Push Schema Changes:** If you edit `src/db/schema.ts`, update the DB with:
    ```bash
    npx drizzle-kit push
    ```
*   **View Data (Studio):** Open a local GUI to view/edit your data:
    ```bash
    npx drizzle-kit studio
    ```

## 📚 Documentation

*   **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)**: Instructions for migrating content from the old vanilla JS site.
*   **[IMPLEMENTATION-NOTES.md](./IMPLEMENTATION-NOTES.md)**: Technical overview of the Astro architecture for maintainers.

## 📝 License

Private / Personal Use.
