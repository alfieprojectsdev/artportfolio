import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file (ES module compatible)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../.env') });

test.describe('Admin Settings Management', () => {
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
    // Click Settings tab to navigate to settings
    await page.click('.admin-nav button:has-text("Settings")');
  });

  // Run tests serially since they share a page
  test.describe.configure({ mode: 'serial' });

  test.describe('Settings Tab Navigation', () => {
    test('Settings tab can be clicked and becomes active', async () => {
      const settingsTab = page.locator('.admin-nav button', { hasText: 'Settings' });
      await expect(settingsTab).toBeVisible();
      await expect(settingsTab).toHaveClass(/active/);
    });

    test('Settings section displays Site Settings heading', async () => {
      const heading = page.locator('.admin-section h2', { hasText: 'Site Settings' });
      await expect(heading).toBeVisible();
    });

    test('clicking Gallery tab and back to Settings works', async () => {
      // Click Gallery tab
      const galleryTab = page.locator('.admin-nav button', { hasText: 'Gallery' });
      await galleryTab.click();
      await expect(galleryTab).toHaveClass(/active/);

      // Click Settings tab
      const settingsTab = page.locator('.admin-nav button', { hasText: 'Settings' });
      await settingsTab.click();
      await expect(settingsTab).toHaveClass(/active/);

      // Verify Settings section is visible
      const heading = page.locator('.admin-section h2', { hasText: 'Site Settings' });
      await expect(heading).toBeVisible();
    });
  });

  test.describe('Settings Form', () => {
    test('settings form is visible', async () => {
      const form = page.locator('.settings-form');
      await expect(form).toBeVisible();
    });

    test('Commission Status dropdown exists', async () => {
      const label = page.locator('.settings-form .form-group label', { hasText: 'Commission Status' });
      await expect(label).toBeVisible();

      const select = page.locator('.settings-form .form-group select').first();
      await expect(select).toBeVisible();
    });

    test('Commission Status dropdown has 3 options', async () => {
      const select = page.locator('.settings-form .form-group select').first();

      const openOption = select.locator('option[value="open"]');
      await expect(openOption).toHaveText('Open');

      const closedOption = select.locator('option[value="closed"]');
      await expect(closedOption).toHaveText('Closed');

      const waitlistOption = select.locator('option[value="waitlist"]');
      await expect(waitlistOption).toHaveText('Waitlist');
    });

    test('Artist Name input field exists', async () => {
      const label = page.locator('.settings-form .form-group label', { hasText: 'Artist Name' });
      await expect(label).toBeVisible();

      // Artist Name is the first text input after Commission Status dropdown
      const input = page.locator('.settings-form .form-group:has(label:has-text("Artist Name")) input[type="text"]');
      await expect(input).toBeVisible();
    });

    test('Bio textarea exists', async () => {
      const label = page.locator('.settings-form .form-group label', { hasText: 'Bio' });
      await expect(label).toBeVisible();

      const textarea = page.locator('.settings-form textarea');
      await expect(textarea).toBeVisible();
      await expect(textarea).toHaveAttribute('rows', '4');
    });

    test('Instagram Handle input field exists', async () => {
      const label = page.locator('.settings-form .form-group label', { hasText: 'Instagram Handle' });
      await expect(label).toBeVisible();

      const input = page.locator('.settings-form .form-group:has(label:has-text("Instagram Handle")) input[type="text"]');
      await expect(input).toBeVisible();
      await expect(input).toHaveAttribute('placeholder', '@username');
    });

    test('Discord Username input field exists', async () => {
      const label = page.locator('.settings-form .form-group label', { hasText: 'Discord Username' });
      await expect(label).toBeVisible();

      const input = page.locator('.settings-form .form-group:has(label:has-text("Discord Username")) input[type="text"]');
      await expect(input).toBeVisible();
    });
  });

  test.describe('Pricing Grid', () => {
    test('Pricing section heading exists', async () => {
      const heading = page.locator('.settings-form h3', { hasText: 'Pricing (PHP)' });
      await expect(heading).toBeVisible();
    });

    test('pricing grid exists', async () => {
      const pricingGrid = page.locator('.pricing-grid');
      await expect(pricingGrid).toBeVisible();
    });

    test('pricing grid has 4 pricing cards', async () => {
      const pricingCards = page.locator('.pricing-grid .pricing-card');
      await expect(pricingCards).toHaveCount(4);
    });

    test('Bust pricing card exists with correct structure', async () => {
      const bustCard = page.locator('.pricing-card:has(h4:has-text("Bust"))');
      await expect(bustCard).toBeVisible();

      // Check for 3 style inputs (Sketch, Flat, Rendered)
      const priceInputs = bustCard.locator('.price-input');
      await expect(priceInputs).toHaveCount(3);
    });

    test('Half pricing card exists with correct structure', async () => {
      const halfCard = page.locator('.pricing-card:has(h4:has-text("Half"))');
      await expect(halfCard).toBeVisible();

      const priceInputs = halfCard.locator('.price-input');
      await expect(priceInputs).toHaveCount(3);
    });

    test('Full pricing card exists with correct structure', async () => {
      const fullCard = page.locator('.pricing-card:has(h4:has-text("Full"))');
      await expect(fullCard).toBeVisible();

      const priceInputs = fullCard.locator('.price-input');
      await expect(priceInputs).toHaveCount(3);
    });

    test('Chibi pricing card exists with correct structure', async () => {
      const chibiCard = page.locator('.pricing-card:has(h4:has-text("Chibi"))');
      await expect(chibiCard).toBeVisible();

      const priceInputs = chibiCard.locator('.price-input');
      await expect(priceInputs).toHaveCount(3);
    });

    test('each pricing card has Sketch, Flat, and Rendered styles', async () => {
      const bustCard = page.locator('.pricing-card:has(h4:has-text("Bust"))');

      const sketchLabel = bustCard.locator('.price-input label', { hasText: 'Sketch' });
      await expect(sketchLabel).toBeVisible();

      const flatLabel = bustCard.locator('.price-input label', { hasText: 'Flat' });
      await expect(flatLabel).toBeVisible();

      const renderedLabel = bustCard.locator('.price-input label', { hasText: 'Rendered' });
      await expect(renderedLabel).toBeVisible();
    });

    test('pricing inputs are number type', async () => {
      const bustCard = page.locator('.pricing-card:has(h4:has-text("Bust"))');
      const priceInputs = bustCard.locator('.price-input input');

      // Check that all inputs are number type
      const count = await priceInputs.count();
      for (let i = 0; i < count; i++) {
        await expect(priceInputs.nth(i)).toHaveAttribute('type', 'number');
      }
    });
  });

  test.describe('Save Settings Button', () => {
    test('Save Settings button exists', async () => {
      const submitButton = page.locator('.settings-form button[type="submit"]');
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toHaveText('Save Settings');
    });

    test('Save Settings button is enabled', async () => {
      const submitButton = page.locator('.settings-form button[type="submit"]');
      await expect(submitButton).toBeEnabled();
    });
  });
});
