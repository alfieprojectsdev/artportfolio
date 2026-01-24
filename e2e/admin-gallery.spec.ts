import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file (ES module compatible)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../.env') });

test.describe('Admin Gallery Management', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({
      httpCredentials: {
        username: 'admin',
        password: process.env.ADMIN_PASSWORD || 'test-password',
      },
    });
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.beforeEach(async () => {
    await page.goto('/admin');
    // Wait for dashboard to finish loading (it shows "Loading dashboard..." initially)
    await page.waitForSelector('.admin-dashboard', { state: 'visible', timeout: 10000 });
    // Wait for nav to be visible to ensure React component has hydrated
    await page.waitForSelector('.admin-nav', { state: 'visible', timeout: 10000 });
  });

  // Run tests serially since they share a page
  test.describe.configure({ mode: 'serial' });

  test.describe('Gallery Tab', () => {
    test('Gallery tab is active by default', async () => {
      const galleryTab = page.locator('.admin-nav button', { hasText: 'Gallery' });
      await expect(galleryTab).toBeVisible();
      await expect(galleryTab).toHaveClass(/active/);
    });

    test('Gallery tab shows item count', async () => {
      const galleryTab = page.locator('.admin-nav button', { hasText: 'Gallery' });
      await expect(galleryTab).toBeVisible();
      // Gallery tab text format: "Gallery (X)" where X is the count
      await expect(galleryTab).toHaveText(/Gallery \(\d+\)/);
    });

    test('Gallery section displays Gallery Management heading', async () => {
      const heading = page.locator('.admin-section h2', { hasText: 'Gallery Management' });
      await expect(heading).toBeVisible();
    });
  });

  test.describe('Add New Artwork Form', () => {
    test('Add New Artwork form is visible', async () => {
      const form = page.locator('.add-item-form');
      await expect(form).toBeVisible();
    });

    test('Add New Artwork form has heading', async () => {
      const formHeading = page.locator('.add-item-form h3', { hasText: 'Add New Artwork' });
      await expect(formHeading).toBeVisible();
    });

    test('form has Image upload section', async () => {
      const imageLabel = page.locator('.add-item-form .form-group label', { hasText: 'Image' });
      await expect(imageLabel).toBeVisible();
    });

    test('form has Title input field', async () => {
      const titleLabel = page.locator('.add-item-form .form-group label', { hasText: 'Title' });
      await expect(titleLabel).toBeVisible();

      const titleInput = page.locator('.add-item-form input[type="text"]').first();
      await expect(titleInput).toBeVisible();
      await expect(titleInput).toHaveAttribute('required', '');
    });

    test('form has Category dropdown', async () => {
      const categoryLabel = page.locator('.add-item-form .form-group label', { hasText: 'Category' });
      await expect(categoryLabel).toBeVisible();

      const categorySelect = page.locator('.add-item-form select').first();
      await expect(categorySelect).toBeVisible();
    });

    test('Category dropdown has correct options', async () => {
      const categorySelect = page.locator('.add-item-form select').first();

      // Verify all category options exist
      const commissionOption = categorySelect.locator('option[value="commission"]');
      await expect(commissionOption).toHaveText('Commission');

      const fanartOption = categorySelect.locator('option[value="fanart"]');
      await expect(fanartOption).toHaveText('Fanart');

      const originalOption = categorySelect.locator('option[value="original"]');
      await expect(originalOption).toHaveText('Original');

      const wipOption = categorySelect.locator('option[value="wip"]');
      await expect(wipOption).toHaveText('Work in Progress');
    });

    test('Category dropdown defaults to commission', async () => {
      const categorySelect = page.locator('.add-item-form select').first();
      await expect(categorySelect).toHaveValue('commission');
    });

    test('form has Alt Text input field', async () => {
      const altTextLabel = page.locator('.add-item-form .form-group label', { hasText: 'Alt Text' });
      await expect(altTextLabel).toBeVisible();

      const altTextInput = page.locator('.add-item-form input[placeholder="Describe the image"]');
      await expect(altTextInput).toBeVisible();
    });

    test('form has Add to Gallery submit button', async () => {
      const submitButton = page.locator('.add-item-form button[type="submit"]');
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toHaveText('Add to Gallery');
    });

    test('submit button is disabled when required fields are empty', async () => {
      const submitButton = page.locator('.add-item-form button[type="submit"]');
      // Button should be disabled when imageUrl or title is empty
      await expect(submitButton).toBeDisabled();
    });
  });

  test.describe('Gallery List Section', () => {
    test('gallery list section exists', async () => {
      const galleryList = page.locator('.gallery-list');
      await expect(galleryList).toBeVisible();
    });

    test('gallery list has Current Gallery Items heading', async () => {
      const listHeading = page.locator('.gallery-list h3', { hasText: 'Current Gallery Items' });
      await expect(listHeading).toBeVisible();
    });
  });

  test.describe('Tab Navigation', () => {
    test('clicking Gallery tab shows gallery section', async () => {
      // First click another tab
      const settingsTab = page.locator('.admin-nav button', { hasText: 'Settings' });
      await settingsTab.click();

      // Then click Gallery tab
      const galleryTab = page.locator('.admin-nav button', { hasText: 'Gallery' });
      await galleryTab.click();

      // Verify Gallery tab is active
      await expect(galleryTab).toHaveClass(/active/);

      // Verify Gallery section is visible
      const heading = page.locator('.admin-section h2', { hasText: 'Gallery Management' });
      await expect(heading).toBeVisible();
    });
  });
});
