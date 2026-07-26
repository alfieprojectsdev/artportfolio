import { test, expect } from '@playwright/test';

test.describe('Lightbox', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Opening Lightbox', () => {
    test('opens when clicking gallery image', async ({ page }) => {
      const galleryImages = page.locator('.gallery-item > img');
      const count = await galleryImages.count();
      test.skip(count === 0, 'No gallery items to test');

      await galleryImages.first().click();
      await expect(page.locator('#lightbox')).toHaveClass(/open/);
    });

    test('displays lightbox image when opened', async ({ page }) => {
      const galleryImages = page.locator('.gallery-item > img');
      const count = await galleryImages.count();
      test.skip(count === 0, 'No gallery items to test');

      await galleryImages.first().click();
      const lightboxImg = page.locator('#lightbox-img');
      await expect(lightboxImg).toBeVisible();
      await expect(lightboxImg).toHaveAttribute('src', /.+/);
    });

    test('displays correct image from gallery item', async ({ page }) => {
      const galleryImages = page.locator('.gallery-item > img');
      const count = await galleryImages.count();
      test.skip(count === 0, 'No gallery items to test');

      // Get the expected image URL (data-full or src)
      const firstImage = galleryImages.first();
      const expectedSrc = await firstImage.getAttribute('data-full') || await firstImage.getAttribute('src');

      await firstImage.click();
      const lightboxImg = page.locator('#lightbox-img');
      await expect(lightboxImg).toHaveAttribute('src', expectedSrc!);
    });
  });

  test.describe('Closing Lightbox', () => {
    test('closes with close button', async ({ page }) => {
      const galleryImages = page.locator('.gallery-item > img');
      const count = await galleryImages.count();
      test.skip(count === 0, 'No gallery items to test');

      // Open lightbox
      await galleryImages.first().click();
      await expect(page.locator('#lightbox')).toHaveClass(/open/);

      // Close with X button
      await page.locator('#lightbox .close').click();
      await expect(page.locator('#lightbox')).not.toHaveClass(/open/);
    });

    test('closes with Escape key', async ({ page }) => {
      const galleryImages = page.locator('.gallery-item > img');
      const count = await galleryImages.count();
      test.skip(count === 0, 'No gallery items to test');

      // Open lightbox
      await galleryImages.first().click();
      await expect(page.locator('#lightbox')).toHaveClass(/open/);

      // Close with Escape key
      await page.keyboard.press('Escape');
      await expect(page.locator('#lightbox')).not.toHaveClass(/open/);
    });

    test('closes when clicking outside the image', async ({ page }) => {
      const galleryImages = page.locator('.gallery-item > img');
      const count = await galleryImages.count();
      test.skip(count === 0, 'No gallery items to test');

      // Open lightbox
      await galleryImages.first().click();
      await expect(page.locator('#lightbox')).toHaveClass(/open/);

      // Click on the lightbox backdrop (not the image)
      const lightbox = page.locator('#lightbox');
      await lightbox.click({ position: { x: 10, y: 10 } });
      await expect(page.locator('#lightbox')).not.toHaveClass(/open/);
    });
  });

  test.describe('Navigation', () => {
    test('navigates to next image with next button', async ({ page }) => {
      const galleryImages = page.locator('.gallery-item > img');
      const count = await galleryImages.count();
      test.skip(count < 2, 'Need at least 2 gallery items for navigation test');

      // Open lightbox on first image
      await galleryImages.first().click();
      await expect(page.locator('#lightbox')).toHaveClass(/open/);

      // Get initial image src
      const lightboxImg = page.locator('#lightbox-img');
      const initialSrc = await lightboxImg.getAttribute('src');

      // Click next button
      await page.locator('#next-btn').click();

      // Verify image changed
      const newSrc = await lightboxImg.getAttribute('src');
      expect(newSrc).not.toBe(initialSrc);
    });

    test('navigates to previous image with prev button', async ({ page }) => {
      const galleryImages = page.locator('.gallery-item > img');
      const count = await galleryImages.count();
      test.skip(count < 2, 'Need at least 2 gallery items for navigation test');

      // Open lightbox on second image
      await galleryImages.nth(1).click();
      await expect(page.locator('#lightbox')).toHaveClass(/open/);

      // Get initial image src
      const lightboxImg = page.locator('#lightbox-img');
      const initialSrc = await lightboxImg.getAttribute('src');

      // Click prev button
      await page.locator('#prev-btn').click();

      // Verify image changed
      const newSrc = await lightboxImg.getAttribute('src');
      expect(newSrc).not.toBe(initialSrc);
    });

    test('navigates with arrow keys', async ({ page }) => {
      const galleryImages = page.locator('.gallery-item > img');
      const count = await galleryImages.count();
      test.skip(count < 2, 'Need at least 2 gallery items for navigation test');

      // Open lightbox on first image
      await galleryImages.first().click();
      await expect(page.locator('#lightbox')).toHaveClass(/open/);

      const lightboxImg = page.locator('#lightbox-img');
      const initialSrc = await lightboxImg.getAttribute('src');

      // Navigate forward with ArrowRight
      await page.keyboard.press('ArrowRight');
      const afterRightSrc = await lightboxImg.getAttribute('src');
      expect(afterRightSrc).not.toBe(initialSrc);

      // Navigate back with ArrowLeft
      await page.keyboard.press('ArrowLeft');
      const afterLeftSrc = await lightboxImg.getAttribute('src');
      expect(afterLeftSrc).toBe(initialSrc);
    });

    test('wraps around from last to first image', async ({ page }) => {
      const galleryImages = page.locator('.gallery-item > img');
      const count = await galleryImages.count();
      test.skip(count < 2, 'Need at least 2 gallery items for navigation test');

      // Open lightbox on last image
      await galleryImages.last().click();
      await expect(page.locator('#lightbox')).toHaveClass(/open/);

      // Get first image expected src for comparison
      const firstImageSrc = await galleryImages.first().getAttribute('data-full') ||
                           await galleryImages.first().getAttribute('src');

      // Click next to wrap around
      await page.locator('#next-btn').click();

      // Should now show first image
      const lightboxImg = page.locator('#lightbox-img');
      await expect(lightboxImg).toHaveAttribute('src', firstImageSrc!);
    });

    test('wraps around from first to last image', async ({ page }) => {
      const galleryImages = page.locator('.gallery-item > img');
      const count = await galleryImages.count();
      test.skip(count < 2, 'Need at least 2 gallery items for navigation test');

      // Open lightbox on first image
      await galleryImages.first().click();
      await expect(page.locator('#lightbox')).toHaveClass(/open/);

      // Get last image expected src for comparison
      const lastImageSrc = await galleryImages.last().getAttribute('data-full') ||
                          await galleryImages.last().getAttribute('src');

      // Click prev to wrap around
      await page.locator('#prev-btn').click();

      // Should now show last image
      const lightboxImg = page.locator('#lightbox-img');
      await expect(lightboxImg).toHaveAttribute('src', lastImageSrc!);
    });
  });

  test.describe('Image Counter', () => {
    test('displays image counter', async ({ page }) => {
      const galleryImages = page.locator('.gallery-item > img');
      const count = await galleryImages.count();
      test.skip(count === 0, 'No gallery items to test');

      await galleryImages.first().click();
      const imgCounter = page.locator('#img-counter');
      await expect(imgCounter).toBeVisible();
    });

    test('shows correct initial counter value', async ({ page }) => {
      const galleryImages = page.locator('.gallery-item > img');
      const count = await galleryImages.count();
      test.skip(count === 0, 'No gallery items to test');

      // Click on first image
      await galleryImages.first().click();
      const imgCounter = page.locator('#img-counter');
      await expect(imgCounter).toHaveText(`1 / ${count}`);
    });

    test('shows correct counter when opening different image', async ({ page }) => {
      const galleryImages = page.locator('.gallery-item > img');
      const count = await galleryImages.count();
      test.skip(count < 3, 'Need at least 3 gallery items for this test');

      // Click on third image
      await galleryImages.nth(2).click();
      const imgCounter = page.locator('#img-counter');
      await expect(imgCounter).toHaveText(`3 / ${count}`);
    });

    test('updates counter on navigation', async ({ page }) => {
      const galleryImages = page.locator('.gallery-item > img');
      const count = await galleryImages.count();
      test.skip(count < 2, 'Need at least 2 gallery items for navigation test');

      // Open lightbox on first image
      await galleryImages.first().click();
      const imgCounter = page.locator('#img-counter');
      await expect(imgCounter).toHaveText(`1 / ${count}`);

      // Navigate to next
      await page.locator('#next-btn').click();
      await expect(imgCounter).toHaveText(`2 / ${count}`);

      // Navigate back
      await page.locator('#prev-btn').click();
      await expect(imgCounter).toHaveText(`1 / ${count}`);
    });
  });

  test.describe('Empty Gallery Handling', () => {
    test('handles empty gallery gracefully', async ({ page }) => {
      const galleryImages = page.locator('.gallery-item > img');
      const emptyGallery = page.locator('.empty-gallery');
      const lightbox = page.locator('#lightbox');

      const itemCount = await galleryImages.count();

      if (itemCount === 0) {
        // Empty gallery should show placeholder message
        await expect(emptyGallery).toBeVisible();
        await expect(emptyGallery).toContainText('Gallery coming soon');

        // Lightbox should not have open class
        await expect(lightbox).not.toHaveClass(/open/);
      } else {
        // Gallery has items - lightbox should start closed
        await expect(lightbox).not.toHaveClass(/open/);

        // Clicking an image should open the lightbox
        await galleryImages.first().click();
        await expect(lightbox).toHaveClass(/open/);
      }
    });
  });

  test.describe('Interaction with category filters', () => {
    /**
     * Regression: the navigable set used to be snapshotted once at page load,
     * so filtering the gallery left hidden artwork in the lightbox. Arrowing
     * through a filtered gallery walked into pieces from other categories, and
     * the counter reported the unfiltered total.
     */
    test('only navigates images from the active filter', async ({ page }) => {
      const categoryButtons = page.locator('.filter-btn:not([data-filter="all"])');
      const categoryCount = await categoryButtons.count();
      test.skip(categoryCount === 0, 'No category filters to test');

      const allImages = page.locator('.gallery-item > img');
      const totalCount = await allImages.count();
      test.skip(totalCount < 2, 'Need at least 2 clickable gallery items');

      // Find a category that leaves at least one clickable image and hides others.
      let matched = false;
      for (let i = 0; i < categoryCount; i++) {
        await categoryButtons.nth(i).click();

        const visible = page.locator('.gallery-item:not(.hidden) > img');
        const visibleCount = await visible.count();
        if (visibleCount === 0 || visibleCount === totalCount) continue;

        matched = true;

        await visible.first().click();
        await expect(page.locator('#lightbox')).toHaveClass(/open/);

        // Counter reflects the filtered set, not every item on the page.
        await expect(page.locator('#img-counter')).toHaveText(`1 / ${visibleCount}`);

        // Stepping through the whole filtered set only ever shows visible art.
        const visibleSrcs = await visible.evaluateAll(imgs =>
          imgs.map(img => (img as HTMLImageElement).dataset.full || (img as HTMLImageElement).src)
        );

        for (let step = 0; step < visibleCount; step++) {
          const src = await page.locator('#lightbox-img').getAttribute('src');
          expect(visibleSrcs).toContain(src);
          await page.locator('#next-btn').click();
        }

        // Wrapped back to the start of the filtered set.
        await expect(page.locator('#img-counter')).toHaveText(`1 / ${visibleCount}`);
        break;
      }

      test.skip(!matched, 'No category partitions the gallery');
    });

    test('filter buttons expose pressed state', async ({ page }) => {
      const filterButtons = page.locator('.filter-btn');
      test.skip((await filterButtons.count()) === 0, 'No filters rendered');

      const all = page.locator('.filter-btn[data-filter="all"]');
      await expect(all).toHaveAttribute('aria-pressed', 'true');

      const other = page.locator('.filter-btn:not([data-filter="all"])').first();
      test.skip((await other.count()) === 0, 'Only the "all" filter exists');

      await other.click();
      await expect(other).toHaveAttribute('aria-pressed', 'true');
      await expect(all).toHaveAttribute('aria-pressed', 'false');
    });
  });
});
