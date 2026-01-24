# Astro + TinaCMS Implementation Plan

> Migration plan for converting the vanilla JS art portfolio to an Astro-based site with TinaCMS for content management, enabling independent site maintenance.

## Goal

Enable the artist (Bred) to manage the portfolio independently:
- Add/remove gallery images via visual editor
- Update pricing without code changes
- Toggle commission status (OPEN/CLOSED/WAITLIST)
- Edit Terms of Service
- Update contact information

---

## Phase 1: Project Setup (2-3 hours)

### 1.1 Initialize Astro Project

```bash
# Create new Astro project
npm create astro@latest artportfolio-astro

# Options to select:
# - Empty project (we'll add our own structure)
# - TypeScript: Yes (strict)
# - Install dependencies: Yes
```

### 1.2 Install TinaCMS

```bash
cd artportfolio-astro
npx @tinacms/cli@latest init
```

This creates:
- `tina/config.ts` - CMS configuration
- `tina/__generated__/` - Auto-generated types

### 1.3 Install Additional Dependencies

```bash
# Image optimization
npm install @astrojs/image sharp

# Optional: If keeping any React components (lightbox)
npm install @astrojs/react react react-dom
```

### 1.4 Configure Astro

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://alfieprojectsdev.github.io',
  base: '/artportfolio',
  integrations: [
    react(), // Only needed if using React components
  ],
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
  },
});
```

### Deliverables
- [ ] Astro project initialized
- [ ] TinaCMS installed and configured
- [ ] Project builds without errors
- [ ] Local dev server running

---

## Phase 2: Content Schema Design (2-3 hours)

### 2.1 Define Content Collections

```typescript
// tina/config.ts
import { defineConfig } from "tinacms";

export default defineConfig({
  branch: process.env.TINA_BRANCH || "main",
  clientId: process.env.TINA_CLIENT_ID || "",
  token: process.env.TINA_TOKEN || "",

  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },

  media: {
    tina: {
      mediaRoot: "uploads",
      publicFolder: "public",
    },
  },

  schema: {
    collections: [
      // Gallery Collection
      {
        name: "gallery",
        label: "Gallery",
        path: "src/content/gallery",
        format: "md",
        fields: [
          {
            type: "string",
            name: "title",
            label: "Artwork Title",
            required: true,
          },
          {
            type: "image",
            name: "image",
            label: "Image",
            required: true,
          },
          {
            type: "string",
            name: "category",
            label: "Category",
            options: [
              { value: "commission", label: "Commission" },
              { value: "fanart", label: "Fanart" },
              { value: "original", label: "Original" },
              { value: "wip", label: "Work in Progress" },
            ],
            required: true,
          },
          {
            type: "string",
            name: "alt",
            label: "Alt Text (Accessibility)",
            required: true,
          },
          {
            type: "boolean",
            name: "featured",
            label: "Show in Gallery",
          },
          {
            type: "number",
            name: "order",
            label: "Display Order",
          },
        ],
      },

      // Site Settings (single document)
      {
        name: "settings",
        label: "Site Settings",
        path: "src/content",
        format: "json",
        ui: {
          allowedActions: {
            create: false,
            delete: false,
          },
        },
        fields: [
          {
            type: "string",
            name: "commissionStatus",
            label: "Commission Status",
            options: [
              { value: "OPEN", label: "Open for Commissions" },
              { value: "CLOSED", label: "Closed" },
              { value: "WAITLIST", label: "Waitlist Only" },
            ],
            required: true,
          },
          {
            type: "string",
            name: "artistName",
            label: "Artist Name",
          },
          {
            type: "rich-text",
            name: "bio",
            label: "Bio/Introduction",
          },
          {
            type: "string",
            name: "instagram",
            label: "Instagram Handle",
          },
          {
            type: "string",
            name: "discord",
            label: "Discord Username",
          },
        ],
      },

      // Pricing Collection
      {
        name: "pricing",
        label: "Pricing",
        path: "src/content/pricing",
        format: "json",
        fields: [
          {
            type: "string",
            name: "name",
            label: "Commission Type",
            required: true,
          },
          {
            type: "image",
            name: "exampleImage",
            label: "Example Image",
          },
          {
            type: "object",
            name: "prices",
            label: "Prices",
            fields: [
              {
                type: "object",
                name: "sketch",
                label: "Sketch",
                fields: [
                  { type: "number", name: "php", label: "PHP (₱)" },
                  { type: "number", name: "usd", label: "USD ($)" },
                ],
              },
              {
                type: "object",
                name: "flat",
                label: "Flat Color",
                fields: [
                  { type: "number", name: "php", label: "PHP (₱)" },
                  { type: "number", name: "usd", label: "USD ($)" },
                ],
              },
              {
                type: "object",
                name: "rendered",
                label: "Rendered",
                fields: [
                  { type: "number", name: "php", label: "PHP (₱)" },
                  { type: "number", name: "usd", label: "USD ($)" },
                ],
              },
            ],
          },
          {
            type: "number",
            name: "order",
            label: "Display Order",
          },
        ],
      },

      // Terms of Service
      {
        name: "terms",
        label: "Terms of Service",
        path: "src/content",
        format: "md",
        ui: {
          allowedActions: {
            create: false,
            delete: false,
          },
        },
        fields: [
          {
            type: "rich-text",
            name: "body",
            label: "Terms Content",
            isBody: true,
          },
          {
            type: "object",
            name: "dos",
            label: "Do's (Will Draw)",
            list: true,
            fields: [
              { type: "string", name: "item", label: "Item" },
            ],
          },
          {
            type: "object",
            name: "donts",
            label: "Don'ts (Won't Draw)",
            list: true,
            fields: [
              { type: "string", name: "item", label: "Item" },
            ],
          },
        ],
      },
    ],
  },
});
```

### 2.2 Initial Content Files

Create initial content from existing portfolio:

```
src/content/
├── gallery/
│   ├── angentela-commission.md
│   ├── house-of-wrath.md
│   ├── xie-lian.md
│   └── into-the-abyss.md
├── pricing/
│   ├── bust-headshot.json
│   ├── half-body.json
│   ├── full-body.json
│   └── chibi.json
├── settings.json
└── terms.md
```

### Deliverables
- [ ] Content schema defined in Tina config
- [ ] All content types have appropriate fields
- [ ] Initial content files created
- [ ] Content loads in Tina admin UI

---

## Phase 3: Astro Components (4-6 hours)

### 3.1 Project Structure

```
src/
├── components/
│   ├── Gallery.astro          # Gallery grid with filtering
│   ├── GalleryItem.astro      # Individual gallery card
│   ├── Lightbox.tsx           # React component (interactive)
│   ├── PricingCard.astro      # Pricing display
│   ├── StatusBadge.astro      # OPEN/CLOSED badge
│   ├── TermsList.astro        # TOS display
│   ├── DosDonts.astro         # Do's and Don'ts columns
│   ├── Footer.astro           # Footer with contact
│   └── CopyButton.tsx         # Discord copy (React)
├── layouts/
│   └── BaseLayout.astro       # HTML shell, fonts, meta
├── pages/
│   └── index.astro            # Main portfolio page
├── content/
│   └── ... (managed by Tina)
└── styles/
    └── global.css             # Ported from style.css
```

### 3.2 Base Layout

```astro
---
// src/layouts/BaseLayout.astro
interface Props {
  title: string;
  description?: string;
}

const { title, description = "Digital art commissions by Bred" } = Astro.props;
---

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <meta name="description" content={description}>

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,600&family=Inter:wght@400;500&family=Kosugi&display=swap" rel="stylesheet">

  <!-- Styles -->
  <link rel="stylesheet" href="/styles/global.css">
</head>
<body>
  <slot />

  <!-- GoatCounter -->
  <script data-goatcounter="https://ithinkandicode.goatcounter.com/count"
          async src="//gc.zgo.at/count.js"></script>
</body>
</html>
```

### 3.3 Main Page

```astro
---
// src/pages/index.astro
import BaseLayout from '../layouts/BaseLayout.astro';
import Gallery from '../components/Gallery.astro';
import PricingCard from '../components/PricingCard.astro';
import StatusBadge from '../components/StatusBadge.astro';
import TermsList from '../components/TermsList.astro';
import DosDonts from '../components/DosDonts.astro';
import Footer from '../components/Footer.astro';
import Lightbox from '../components/Lightbox.tsx';

// Fetch content from Tina
import { client } from '../../tina/__generated__/client';

const settingsResponse = await client.queries.settings({ relativePath: 'settings.json' });
const settings = settingsResponse.data.settings;

const galleryResponse = await client.queries.galleryConnection();
const galleryItems = galleryResponse.data.galleryConnection.edges
  ?.map(edge => edge?.node)
  .filter(Boolean)
  .sort((a, b) => (a.order || 0) - (b.order || 0));

const pricingResponse = await client.queries.pricingConnection();
const pricing = pricingResponse.data.pricingConnection.edges
  ?.map(edge => edge?.node)
  .filter(Boolean)
  .sort((a, b) => (a.order || 0) - (b.order || 0));

const termsResponse = await client.queries.terms({ relativePath: 'terms.md' });
const terms = termsResponse.data.terms;
---

<BaseLayout title="Bred's Commissions">
  <header class="hero">
    <div class="container">
      <img src="/uploads/profile.png" alt="Bred Art Avatar" class="profile-pic">
      <h1>Bred's Commissions</h1>
      <p class="intro">{settings.bio}</p>
      <StatusBadge status={settings.commissionStatus} />
    </div>
  </header>

  <main class="container">
    <Gallery items={galleryItems} client:load />

    <section id="pricing" class="pricing-section">
      <h2>Commission Rates</h2>
      <div class="pricing-grid">
        {pricing.map(item => (
          <PricingCard {...item} />
        ))}
      </div>
      <p class="payment-note">
        <strong>Payment:</strong> GCash / Paypal / Robux<br>
        <small>(For Robux payment, ask me thru DMs)</small>
      </p>
    </section>

    <TermsList terms={terms} />
    <DosDonts dos={terms.dos} donts={terms.donts} />
  </main>

  <Footer
    instagram={settings.instagram}
    discord={settings.discord}
  />

  <Lightbox client:only="react" />
</BaseLayout>
```

### 3.4 Gallery Component with Filtering

```astro
---
// src/components/Gallery.astro
const { items } = Astro.props;
const categories = ['all', ...new Set(items.map(item => item.category))];
---

<section id="gallery">
  <div class="filter-buttons">
    {categories.map(cat => (
      <button
        class:list={['filter-btn', { active: cat === 'all' }]}
        data-filter={cat}
      >
        {cat === 'all' ? 'All Work' : cat.charAt(0).toUpperCase() + cat.slice(1)}
      </button>
    ))}
  </div>

  <div class="gallery-grid">
    {items.filter(item => item.featured !== false).map((item, index) => (
      <div class="gallery-item" data-category={item.category}>
        <img
          src={item.image}
          alt={item.alt}
          loading="lazy"
          data-index={index}
        />
      </div>
    ))}
  </div>
</section>

<script>
  // Filter functionality (vanilla JS, runs on client)
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.gallery-item').forEach(item => {
        if (filter === 'all' || item.dataset.category === filter) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
</script>
```

### 3.5 Lightbox (React for Interactivity)

```tsx
// src/components/Lightbox.tsx
import { useState, useEffect } from 'react';

export default function Lightbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    // Collect all gallery images
    const galleryImages = Array.from(
      document.querySelectorAll('.gallery-item img')
    ).map(img => (img as HTMLImageElement).src);
    setImages(galleryImages);

    // Add click listeners
    document.querySelectorAll('.gallery-item img').forEach((img, index) => {
      img.addEventListener('click', () => {
        setCurrentIndex(index);
        setIsOpen(true);
      });
    });

    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') setIsOpen(false);
      if (e.key === 'ArrowRight') setCurrentIndex(i => (i + 1) % images.length);
      if (e.key === 'ArrowLeft') setCurrentIndex(i => (i - 1 + images.length) % images.length);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, images.length]);

  if (!isOpen) return null;

  return (
    <div className="lightbox" onClick={() => setIsOpen(false)}>
      <span className="close">&times;</span>
      <img
        src={images[currentIndex]}
        className="lightbox-content"
        onClick={e => e.stopPropagation()}
        alt=""
      />
      <div className="lightbox-nav">
        <button onClick={(e) => { e.stopPropagation(); setCurrentIndex(i => (i - 1 + images.length) % images.length); }}>
          &#10094;
        </button>
        <span>{currentIndex + 1} / {images.length}</span>
        <button onClick={(e) => { e.stopPropagation(); setCurrentIndex(i => (i + 1) % images.length); }}>
          &#10095;
        </button>
      </div>
    </div>
  );
}
```

### Deliverables
- [ ] All components created
- [ ] Content renders correctly from Tina
- [ ] Gallery filtering works
- [ ] Lightbox opens/closes with keyboard support
- [ ] Styling matches original

---

## Phase 4: Styling Migration (1-2 hours)

### 4.1 Port Existing CSS

Copy the current `style.css` to `src/styles/global.css` with minimal changes:

```css
/* src/styles/global.css */
/* Ported from vanilla version - minimal changes needed */

:root {
  --bg-color: #FFFFFF;
  --card-bg: #FFFFFF;
  --text-main: #000000;
  --text-secondary: #916A5D;
  --accent: #916A5D;
  --accent-light: #7A5A4F;
  --divider: #A18278;
  --btn-bg: rgba(242,227,203,0.678);
  --btn-hover: rgba(242,227,203,0.9);
  --font-serif: 'Fraunces', Georgia, serif;
  --font-mono: 'Kosugi', monospace;
  --font-sans: 'Inter', sans-serif;
}

/* ... rest of CSS unchanged ... */
```

### 4.2 Add Filter Button Styles

```css
/* Additional styles for filter buttons */
.filter-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-bottom: 30px;
}

.filter-btn {
  background: var(--btn-bg);
  border: none;
  color: var(--text-main);
  padding: 8px 16px;
  border-radius: 50px;
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.filter-btn:hover,
.filter-btn.active {
  background: var(--accent);
  color: white;
  transform: scale(1.05);
}
```

### Deliverables
- [ ] All styles ported
- [ ] New component styles added
- [ ] Responsive design works
- [ ] Visual parity with vanilla version

---

## Phase 5: Deployment Setup (2-3 hours)

### 5.1 Tina Cloud Setup

1. Create account at [tina.io](https://tina.io)
2. Connect GitHub repository
3. Get Client ID and Token
4. Add to environment variables

```bash
# .env
TINA_CLIENT_ID=your-client-id
TINA_TOKEN=your-token
TINA_BRANCH=main
```

### 5.2 GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build Astro site
        run: npm run build
        env:
          TINA_CLIENT_ID: ${{ secrets.TINA_CLIENT_ID }}
          TINA_TOKEN: ${{ secrets.TINA_TOKEN }}

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 5.3 Add GitHub Secrets

In repository settings, add:
- `TINA_CLIENT_ID`
- `TINA_TOKEN`

### Deliverables
- [ ] Tina Cloud account created
- [ ] Repository connected to Tina
- [ ] GitHub Actions workflow configured
- [ ] Secrets added to repository
- [ ] Site deploys automatically on push

---

## Phase 6: User Guide for Bred (1 hour)

### 6.1 Create User Documentation

```markdown
# How to Update Your Portfolio

## Accessing the Editor

1. Go to: https://alfieprojectsdev.github.io/artportfolio/admin
2. Log in with your GitHub account
3. You'll see the Tina editor sidebar

## Adding New Artwork

1. Click "Gallery" in the sidebar
2. Click "+ Add New"
3. Fill in:
   - Title: Name of the artwork
   - Image: Click to upload
   - Category: Select type (Commission, Fanart, etc.)
   - Alt Text: Describe the image for accessibility
   - Featured: Check to show in gallery
4. Click "Save"

## Updating Commission Status

1. Click "Site Settings"
2. Find "Commission Status"
3. Select: Open, Closed, or Waitlist
4. Click "Save"

## Changing Prices

1. Click "Pricing"
2. Select the type (Bust, Half Body, etc.)
3. Update the PHP and USD amounts
4. Click "Save"

## Tips

- Changes appear on the site after ~2 minutes (build time)
- Large images are automatically optimized
- You can preview changes before saving
```

### Deliverables
- [ ] User guide created
- [ ] Screenshots added (optional)
- [ ] Bred can successfully make a test edit

---

## Timeline Summary

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| 1. Setup | 2-3 hours | None |
| 2. Schema | 2-3 hours | Phase 1 |
| 3. Components | 4-6 hours | Phase 2 |
| 4. Styling | 1-2 hours | Phase 3 |
| 5. Deployment | 2-3 hours | Phase 4 |
| 6. User Guide | 1 hour | Phase 5 |
| **Total** | **12-18 hours** | |

---

## Success Criteria

- [ ] Site looks identical to current vanilla version
- [ ] Bred can add/remove gallery images without help
- [ ] Bred can update pricing without help
- [ ] Bred can change commission status without help
- [ ] Site builds and deploys automatically
- [ ] Performance remains fast (< 2s load time)
- [ ] All accessibility features preserved

---

## Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Tina Cloud downtime | Low | Content still in Git, can edit directly |
| Build failures | Medium | GitHub Actions notifications, easy rollback |
| Learning curve for Bred | Medium | User guide + initial walkthrough session |
| Image sizes too large | Medium | Astro image optimization handles this |

---

## Resources

- [Astro Documentation](https://docs.astro.build)
- [TinaCMS for Astro](https://tina.io/astro)
- [Astro + Tina Official Guide](https://docs.astro.build/en/guides/cms/tina-cms/)
- [GitHub Pages Deployment](https://docs.astro.build/en/guides/deploy/github/)
