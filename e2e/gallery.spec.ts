import { test, expect } from '@playwright/test';

test.describe('Gallery', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Filter Buttons', () => {
    test('filter buttons exist when gallery has items', async ({ page }) => {
      const filterButtons = page.locator('.filter-btn');
      const galleryItems = page.locator('.gallery-item');
      const emptyGallery = page.locator('.empty-gallery');

      // Check if gallery has items or is empty
      const hasItems = await galleryItems.count() > 0;
      const isEmpty = await emptyGallery.isVisible().catch(() => false);

      if (hasItems) {
        // At minimum, "All Work" button should exist
        await expect(filterButtons.first()).toBeVisible();
        const allWorkButton = page.locator('.filter-btn[data-filter="all"]');
        await expect(allWorkButton).toBeVisible();
        await expect(allWorkButton).toHaveText('All Work');
      } else if (isEmpty) {
        // Empty gallery should show the placeholder message
        await expect(emptyGallery).toContainText('Gallery coming soon');
        // Filter buttons should not be present when gallery is empty
        await expect(filterButtons).toHaveCount(0);
      }
    });

    test('clicking filter button adds active class', async ({ page }) => {
      const filterButtons = page.locator('.filter-btn');
      const buttonCount = await filterButtons.count();

      // Skip test if no filter buttons (empty gallery)
      if (buttonCount === 0) {
        test.skip();
        return;
      }

      // Click on a filter button (if there are multiple, click the second one)
      const buttonToClick = buttonCount > 1 ? filterButtons.nth(1) : filterButtons.first();
      await buttonToClick.click();

      // Verify the clicked button has the active class
      await expect(buttonToClick).toHaveClass(/active/);
    });

    test('only one filter button is active at a time', async ({ page }) => {
      const filterButtons = page.locator('.filter-btn');
      const buttonCount = await filterButtons.count();

      // Skip test if less than 2 filter buttons
      if (buttonCount < 2) {
        test.skip();
        return;
      }

      // Click first button
      await filterButtons.first().click();
      let activeButtons = page.locator('.filter-btn.active');
      await expect(activeButtons).toHaveCount(1);

      // Click second button
      await filterButtons.nth(1).click();
      activeButtons = page.locator('.filter-btn.active');
      await expect(activeButtons).toHaveCount(1);

      // Verify the second button is now active, not the first
      await expect(filterButtons.nth(1)).toHaveClass(/active/);
      await expect(filterButtons.first()).not.toHaveClass(/active/);
    });
  });

  test.describe('Gallery Filtering', () => {
    test('clicking "All Work" shows all gallery items', async ({ page }) => {
      const allWorkButton = page.locator('.filter-btn[data-filter="all"]');
      const galleryItems = page.locator('.gallery-item');
      const buttonVisible = await allWorkButton.isVisible().catch(() => false);

      // Skip test if no "All Work" button (empty gallery)
      if (!buttonVisible) {
        test.skip();
        return;
      }

      // Click "All Work" button
      await allWorkButton.click();

      // Verify no gallery items have the hidden class
      const hiddenItems = page.locator('.gallery-item.hidden');
      await expect(hiddenItems).toHaveCount(0);

      // All gallery items should be visible
      const totalItems = await galleryItems.count();
      if (totalItems > 0) {
        for (let i = 0; i < totalItems; i++) {
          await expect(galleryItems.nth(i)).toBeVisible();
        }
      }
    });

    test('clicking category filter hides non-matching items', async ({ page }) => {
      const filterButtons = page.locator('.filter-btn');
      const galleryItems = page.locator('.gallery-item');
      const buttonCount = await filterButtons.count();
      const itemCount = await galleryItems.count();

      // Skip test if no filter buttons or no gallery items
      if (buttonCount < 2 || itemCount === 0) {
        test.skip();
        return;
      }

      // Find a category filter button (not "all")
      const categoryButton = page.locator('.filter-btn:not([data-filter="all"])').first();
      const categoryButtonExists = await categoryButton.isVisible().catch(() => false);

      if (!categoryButtonExists) {
        test.skip();
        return;
      }

      // Get the category from the button
      const category = await categoryButton.getAttribute('data-filter');

      // Click the category filter
      await categoryButton.click();

      // Items matching the category should be visible (not have hidden class)
      const matchingItems = page.locator(`.gallery-item[data-category="${category}"]`);
      const matchingCount = await matchingItems.count();

      for (let i = 0; i < matchingCount; i++) {
        await expect(matchingItems.nth(i)).not.toHaveClass(/hidden/);
      }

      // Items not matching the category should have hidden class
      const nonMatchingItems = page.locator(`.gallery-item:not([data-category="${category}"])`);
      const nonMatchingCount = await nonMatchingItems.count();

      for (let i = 0; i < nonMatchingCount; i++) {
        await expect(nonMatchingItems.nth(i)).toHaveClass(/hidden/);
      }
    });

    test('filter resets when clicking "All Work" after category filter', async ({ page }) => {
      const filterButtons = page.locator('.filter-btn');
      const allWorkButton = page.locator('.filter-btn[data-filter="all"]');
      const galleryItems = page.locator('.gallery-item');
      const buttonCount = await filterButtons.count();
      const itemCount = await galleryItems.count();

      // Skip test if not enough buttons or no items
      if (buttonCount < 2 || itemCount === 0) {
        test.skip();
        return;
      }

      // Click a category filter first (not "all")
      const categoryButton = page.locator('.filter-btn:not([data-filter="all"])').first();
      const categoryButtonExists = await categoryButton.isVisible().catch(() => false);

      if (!categoryButtonExists) {
        test.skip();
        return;
      }

      await categoryButton.click();

      // Now click "All Work" to reset
      await allWorkButton.click();

      // Verify no items have hidden class
      const hiddenItems = page.locator('.gallery-item.hidden');
      await expect(hiddenItems).toHaveCount(0);

      // Verify "All Work" button is active
      await expect(allWorkButton).toHaveClass(/active/);
    });
  });

  test.describe('Empty Gallery', () => {
    test('handles empty gallery gracefully', async ({ page }) => {
      const galleryItems = page.locator('.gallery-item');
      const emptyGallery = page.locator('.empty-gallery');
      const filterButtons = page.locator('.filter-btn');

      const itemCount = await galleryItems.count();

      if (itemCount === 0) {
        // Empty gallery should show placeholder message
        await expect(emptyGallery).toBeVisible();
        await expect(emptyGallery).toContainText('Gallery coming soon');

        // Filter buttons should not be present
        await expect(filterButtons).toHaveCount(0);
      } else {
        // Gallery has items - filter buttons should exist
        await expect(filterButtons.first()).toBeVisible();

        // Empty gallery message should not be visible
        await expect(emptyGallery).not.toBeVisible();
      }
    });
  });
});
