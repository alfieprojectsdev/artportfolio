# DementedBred Art Portfolio 🎨✨

A professional, database-driven art portfolio and custom CMS built for DementedBred. This project represents a major upgrade from previous static and Carrd-based iterations, offering a fully dynamic gallery and streamlined content management.

## 🚀 Features

* **Dynamic Gallery:** Artwork, commission prices, and bio information are stored in a database, allowing for instant site updates without editing raw code.
* **High-Performance Image Hosting:** Integrates with Cloudinary for fast, professional image delivery.
* **Modern Tech Stack:** Built with an Astro server-side rendered core and React components.
* **Robust Testing:** Includes end-to-end testing powered by Playwright.

## 🛠️ Tech Stack

* **Framework:** Astro & React
* **Database:** Neon (Serverless Postgres)
* **ORM:** Drizzle ORM
* **Media & Services:** Cloudinary (Images) & Resend (Email APIs)

## 🗺️ Roadmap

**Current Status:** The site actively serves as a professional showcase for Adie's portfolio and commission prices. Clients currently request commissions via direct messages on platforms like Discord and Instagram.

**Upcoming Features:**
* **Commission Requests Manager:** A dedicated dashboard and form allowing clients to submit commission requests directly through the site, which can then be accepted or rejected in an administrative view.

## 💻 Local Development

1. Install the dependencies:
   ```bash
   npm install

```

2. Run the development server:
```bash
npm run dev

```


3. Run the E2E test suite:
```bash
npm run test:e2e

```



*Refer to `IMPLEMENTATION-NOTES.md` for detailed code structure and `MIGRATION_GUIDE.md` for instructions on resetting database seeds.*
