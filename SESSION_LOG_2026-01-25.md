# Session Log: Commission Workflow Feature

**Date:** 2026-01-25
**Branch:** `feature/commission-workflow` → merged to `master`
**Working Directory:** `/home/finch/repos/artportfolio/worktrees/commission-workflow`

---

## Objectives

1. Fix CloudinaryUploadWidget duplicate image bug
2. Add ArtSlider component for flat/rendered image comparison
3. Implement commission request workflow with form, validation, and price calculator

---

## Fixes Applied

### Fix 1: CloudinaryUploadWidget Duplicate Image Bug
**Commit:** `183b824`
**File:** `src/components/admin/CloudinaryUploadWidget.tsx`

**Problem:** When the admin dashboard had two upload widgets (one for "Flat" and one for "Rendered"), uploading to either widget would show the same image in both previews. This was caused by:

1. **Multiple script loads:** Each widget instance tried to load the Cloudinary script independently, causing race conditions
2. **Stale closures:** The `onUpload` callback captured old state, so all widgets fired the same callback
3. **No instance isolation:** Widgets weren't distinguished from each other

**Root Cause Analysis:**
```typescript
// BEFORE: Each component loaded script independently
useEffect(() => {
  const script = document.createElement('script');
  script.src = 'https://widget.cloudinary.com/v2.0/global/all.js';
  document.body.appendChild(script); // Multiple scripts!
}, []);
```

**Solution 1 - Global Script Singleton:**
```typescript
// Load script once globally using window flags
function loadCloudinaryScript(): Promise<void> {
  if (window.cloudinaryScriptLoaded) {
    return Promise.resolve();
  }
  if (window.cloudinaryScriptLoading) {
    return window.cloudinaryScriptLoading; // Return existing promise
  }
  window.cloudinaryScriptLoading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://widget.cloudinary.com/v2.0/global/all.js';
    script.async = true;
    script.onload = () => {
      window.cloudinaryScriptLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Cloudinary widget'));
    document.body.appendChild(script);
  });
  return window.cloudinaryScriptLoading;
}
```

**Solution 2 - Refs for Stable Callbacks:**
```typescript
const onUploadRef = useRef(onUpload);

// Keep callback ref updated without recreating widget
useEffect(() => {
  onUploadRef.current = onUpload;
}, [onUpload]);

// Stable callback that uses the ref
const handleUploadResult = useCallback((error, result) => {
  if (result.event === 'success') {
    onUploadRef.current(result.info); // Always calls current callback
  }
}, []);
```

**Solution 3 - Unique Instance IDs:**
```typescript
interface CloudinaryUploadWidgetProps {
  id?: string; // Unique identifier for this widget instance
}

// In useEffect dependencies:
useEffect(() => {
  // Widget creation...
}, [cloudName, uploadPreset, id, handleUploadResult]);
```

**Result:** Each upload widget now correctly updates only its own preview image

### Fix 2: Artist Name UI Bug
**Commit:** `cb35f11`

The page showed "'s Commissions" instead of "Bred's Commissions" when artistName was null.

```typescript
// Before
const artistName = settings?.artistName ?? 'Bred';

// After - explicit fallback
artistName: settings?.artistName || defaults.artistName,
```

---

## Features Implemented

### Feature 1: ArtSlider Component
**Commit:** `4e93b18`
**File:** `src/components/ArtSlider.astro`

A zero-dependency before/after image comparison slider for showcasing flat vs rendered artwork.

**Design Goals:**
- No JavaScript libraries (vanilla JS only)
- Keyboard and touch accessible
- Works in lightbox and gallery contexts
- Lazy loading for performance

**Implementation:**

```astro
---
interface Props {
  before: string;  // Flat art URL
  after: string;   // Rendered art URL
  alt?: string;
}
const { before, after, alt = "Artwork comparison" } = Astro.props;
---

<div class="comparison-container" style="--exposure: 50%;">
  <!-- Base layer: Flat version -->
  <img src={before} alt={`${alt} - Flat version`} loading="lazy" />

  <!-- Overlay layer: Rendered version (clipped) -->
  <div class="rendered-layer">
    <img src={after} alt={`${alt} - Rendered version`} loading="lazy" />
  </div>

  <!-- Hidden range input for accessibility -->
  <input type="range" min="0" max="100" value="50"
         class="slider-input"
         aria-label="Slide to compare flat and rendered art" />

  <!-- Visual handle -->
  <div class="slider-handle" aria-hidden="true"></div>
</div>
```

**CSS Technique - clip-path with CSS Variable:**
```css
.rendered-layer {
  position: absolute;
  inset: 0;
  /* Clips from right edge based on --exposure value
     0% = fully hidden, 100% = fully visible */
  clip-path: inset(0 calc(100% - var(--exposure)) 0 0);
}

.slider-handle {
  left: var(--exposure); /* Handle follows the clip edge */
}
```

**JavaScript - Event Delegation:**
```javascript
const containers = document.querySelectorAll('.comparison-container');
containers.forEach(container => {
  const slider = container.querySelector('.slider-input');
  slider?.addEventListener('input', (e) => {
    container.style.setProperty('--exposure', `${e.target.value}%`);
  });
});
```

**Accessibility Features:**
- Hidden `<input type="range">` provides keyboard navigation (arrow keys)
- Touch/drag works via the native range input
- Screen readers announce "Slide to compare flat and rendered art"
- Visual handle with ↔ icon indicates interactivity

**Visual Design:**
- White vertical line with drop shadow
- Circular drag handle with ↔ symbol
- 8px border radius on container
- `cursor: ew-resize` for drag affordance

### Feature 2: Dual Image Upload Support
**Commit:** `421da86`

Updated schema with `flatUrl` column for optional flat versions:
- `src/db/schema.ts` - Added `flatUrl: text('flat_url')`
- `src/components/admin/AdminDashboard.tsx` - Added second upload widget

### Feature 3: ArtSlider Integration in Public Gallery
**Commit:** `d53738f`

Updated `src/pages/index.astro` to conditionally render ArtSlider when `flatUrl` exists.

### Feature 4: Commission Request Workflow
**Commit:** `e95ec1b`

Full commission form implementation:

| File | Purpose |
|------|---------|
| `src/lib/schemas.ts` | Zod validation schemas and pricing constants |
| `src/actions/index.ts` | Astro Actions for form handling |
| `src/components/CommissionForm.tsx` | React form with price calculator |
| `src/db/schema.ts` | Updated with jsonb refImages, estimatedPrice |
| `src/pages/index.astro` | Commission section with styling |

**Pricing Matrix:**
```typescript
export const PRICING = {
  headshot: { sketch: 60, flat: 100, rendered: 150 },
  bust: { sketch: 80, flat: 150, rendered: 200 },
  half: { sketch: 100, flat: 200, rendered: 300 },
  full: { sketch: 200, flat: 250, rendered: 500 },
  chibi: { sketch: 40, flat: 100, rendered: 150 },
  custom: { sketch: 0, flat: 0, rendered: 0 },
} as const;
```

**Form Features:**
- Real-time price calculator
- Cloudinary reference image uploads
- Discord contact field (optional)
- Art type and style selection
- Description textarea
- Automatic estimated price calculation on submit

---

## Commits

```
e95ec1b feat: add commission request workflow with form and validation
d53738f feat: integrate ArtSlider in public gallery for items with flatUrl
421da86 feat: add dual-image upload support for ArtSlider comparison
4e93b18 feat: add ArtSlider component for flat/rendered art comparison
183b824 fix: resolve CloudinaryUploadWidget duplicate image bug
cb35f11 fix: ensure artistName fallback when DB value is null
```

---

## Git Operations

| Operation | Result |
|-----------|--------|
| Feature branch created | `feature/commission-workflow` |
| Merged to master | ✅ Fast-forward |
| Pushed to origin | ✅ `f622d98..e95ec1b` |

---

## Files Changed

```
 .gitignore                        |  36 ++++-
 package.json                      |   3 +-
 src/actions/index.ts              |  45 +++++++  (new)
 src/components/ArtSlider.astro    |  80 +++++++++++
 src/components/CommissionForm.tsx | 267 ++++++++++++++++++++++++++++++  (new)
 src/components/admin/AdminDashboard.tsx | (dual upload)
 src/components/admin/CloudinaryUploadWidget.tsx | (bug fix)
 src/db/schema.ts                  |  11 +-
 src/lib/schemas.ts                |  45 +++++++  (new)
 src/pages/index.astro             |  48 +++++++
```

---

## Next Steps

1. Push schema changes to NeonDB (`npx drizzle-kit push`)
2. Deploy to Vercel
3. Add Resend email notifications for commission submissions
4. Add rate limiting / spam protection (Turnstile)
5. Admin panel commission management UI

---

## Quick Reference

### Commission Form Endpoint
- **Action:** `submitCommission` (Astro Actions)
- **Validation:** Zod schema in `src/lib/schemas.ts`
- **Database:** `commission_requests` table with jsonb `ref_images`

### Art Types
- Headshot, Bust, Half-body, Full-body, Chibi, Custom

### Styles
- Sketch, Flat color, Fully rendered

---

**Session completed successfully.**
