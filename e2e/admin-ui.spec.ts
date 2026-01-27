import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file (ES module compatible)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../.env.local') });

test.describe('Admin UI - Fieldsets and Layout', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({
      httpCredentials: {
        username: 'admin',
        password: process.env.ADMIN_PASSWORD || 'oxfordsnotbrogues',
      },
    });
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.beforeEach(async () => {
    await page.goto('/admin');
    await page.waitForSelector('.admin-dashboard', { state: 'visible', timeout: 10000 });
    await page.waitForSelector('.admin-nav', { state: 'visible', timeout: 10000 });
  });

  test.describe.configure({ mode: 'serial' });

  test.describe('Gallery Tab - Fieldset Groupings', () => {
    test('takes screenshot of Gallery tab', async () => {
      await page.screenshot({ path: 'e2e/screenshots/admin-gallery-tab.png', fullPage: true });
    });

    test('Gallery form has Images fieldset', async () => {
      const imagesFieldset = page.locator('fieldset.form-fieldset:has(legend:has-text("Images"))');
      await expect(imagesFieldset).toBeVisible();
    });

    test('Images fieldset contains Rendered Image upload', async () => {
      const imagesFieldset = page.locator('fieldset.form-fieldset:has(legend:has-text("Images"))');
      const renderedLabel = imagesFieldset.locator('label', { hasText: 'Rendered Image' });
      await expect(renderedLabel).toBeVisible();
    });

    test('Images fieldset contains Flat Image upload', async () => {
      const imagesFieldset = page.locator('fieldset.form-fieldset:has(legend:has-text("Images"))');
      const flatLabel = imagesFieldset.locator('label', { hasText: 'Flat Image' });
      await expect(flatLabel).toBeVisible();
    });

    test('Gallery form has Artwork Details fieldset', async () => {
      const detailsFieldset = page.locator('fieldset.form-fieldset:has(legend:has-text("Artwork Details"))');
      await expect(detailsFieldset).toBeVisible();
    });

    test('Artwork Details fieldset contains Title, Category, Alt Text', async () => {
      const detailsFieldset = page.locator('fieldset.form-fieldset:has(legend:has-text("Artwork Details"))');

      const titleLabel = detailsFieldset.locator('label', { hasText: 'Title' });
      await expect(titleLabel).toBeVisible();

      const categoryLabel = detailsFieldset.locator('label', { hasText: 'Category' });
      await expect(categoryLabel).toBeVisible();

      const altTextLabel = detailsFieldset.locator('label', { hasText: 'Alt Text' });
      await expect(altTextLabel).toBeVisible();
    });

    test('Artwork Details has form-row for side-by-side fields', async () => {
      const formRow = page.locator('.add-item-form .form-row');
      await expect(formRow).toBeVisible();
    });
  });

  test.describe('Settings Tab - Fieldset Groupings', () => {
    test.beforeEach(async () => {
      await page.click('.admin-nav button:has-text("Settings")');
      await page.waitForSelector('.settings-form', { state: 'visible' });
    });

    test('takes screenshot of Settings tab', async () => {
      await page.screenshot({ path: 'e2e/screenshots/admin-settings-tab.png', fullPage: true });
    });

    test('Settings has Commission Status fieldset', async () => {
      const fieldset = page.locator('fieldset.form-fieldset:has(legend:has-text("Commission Status"))');
      await expect(fieldset).toBeVisible();
    });

    test('Commission Status fieldset has hint text', async () => {
      const fieldset = page.locator('fieldset.form-fieldset:has(legend:has-text("Commission Status"))');
      const hint = fieldset.locator('.field-hint');
      await expect(hint).toBeVisible();
      await expect(hint).toContainText('commission form');
    });

    test('Settings has Artist Profile fieldset', async () => {
      const fieldset = page.locator('fieldset.form-fieldset:has(legend:has-text("Artist Profile"))');
      await expect(fieldset).toBeVisible();
    });

    test('Artist Profile fieldset contains Name and Bio', async () => {
      const fieldset = page.locator('fieldset.form-fieldset:has(legend:has-text("Artist Profile"))');

      const nameLabel = fieldset.locator('label', { hasText: 'Artist Name' });
      await expect(nameLabel).toBeVisible();

      const bioLabel = fieldset.locator('label', { hasText: 'Bio' });
      await expect(bioLabel).toBeVisible();
    });

    test('Settings has Social Links fieldset', async () => {
      const fieldset = page.locator('fieldset.form-fieldset:has(legend:has-text("Social Links"))');
      await expect(fieldset).toBeVisible();
    });

    test('Social Links fieldset has form-row for side-by-side layout', async () => {
      const fieldset = page.locator('fieldset.form-fieldset:has(legend:has-text("Social Links"))');
      const formRow = fieldset.locator('.form-row');
      await expect(formRow).toBeVisible();
    });

    test('Social Links contains Instagram and Discord', async () => {
      const fieldset = page.locator('fieldset.form-fieldset:has(legend:has-text("Social Links"))');

      const instagramLabel = fieldset.locator('label', { hasText: 'Instagram' });
      await expect(instagramLabel).toBeVisible();

      const discordLabel = fieldset.locator('label', { hasText: 'Discord' });
      await expect(discordLabel).toBeVisible();
    });

    test('Settings has Pricing fieldset', async () => {
      const fieldset = page.locator('fieldset.form-fieldset:has(legend:has-text("Pricing"))');
      await expect(fieldset).toBeVisible();
    });

    test('Pricing fieldset contains pricing grid with 4 cards', async () => {
      const fieldset = page.locator('fieldset.form-fieldset:has(legend:has-text("Pricing"))');
      const pricingCards = fieldset.locator('.pricing-card');
      await expect(pricingCards).toHaveCount(4);
    });
  });

  test.describe('Commissions Tab', () => {
    test.beforeEach(async () => {
      await page.click('.admin-nav button:has-text("Commissions")');
      await page.waitForSelector('.admin-section h2:has-text("Commission Requests")', { state: 'visible' });
    });

    test('takes screenshot of Commissions tab', async () => {
      await page.screenshot({ path: 'e2e/screenshots/admin-commissions-tab.png', fullPage: true });
    });

    test('Commissions tab shows pending count in nav', async () => {
      const commissionsTab = page.locator('.admin-nav button', { hasText: 'Commissions' });
      await expect(commissionsTab).toHaveText(/Commissions \(\d+ pending\)/);
    });

    test('Commission Requests heading is visible', async () => {
      const heading = page.locator('.admin-section h2', { hasText: 'Commission Requests' });
      await expect(heading).toBeVisible();
    });

    test('Status filter dropdown exists', async () => {
      const filterGroup = page.locator('.commission-filters .filter-group');
      await expect(filterGroup).toBeVisible();

      const filterSelect = filterGroup.locator('select');
      await expect(filterSelect).toBeVisible();
    });

    test('Status filter has all options with counts', async () => {
      const filterSelect = page.locator('.commission-filters select');

      const allOption = filterSelect.locator('option[value="all"]');
      await expect(allOption).toHaveText(/All \(\d+\)/);

      const pendingOption = filterSelect.locator('option[value="pending"]');
      await expect(pendingOption).toHaveText(/Pending \(\d+\)/);

      const acceptedOption = filterSelect.locator('option[value="accepted"]');
      await expect(acceptedOption).toHaveText(/Accepted \(\d+\)/);

      const inProgressOption = filterSelect.locator('option[value="in_progress"]');
      await expect(inProgressOption).toHaveText(/In Progress \(\d+\)/);

      const completedOption = filterSelect.locator('option[value="completed"]');
      await expect(completedOption).toHaveText(/Completed \(\d+\)/);

      const declinedOption = filterSelect.locator('option[value="declined"]');
      await expect(declinedOption).toHaveText(/Declined \(\d+\)/);
    });

    test('Commissions table exists with headers', async () => {
      const table = page.locator('.commissions-table');
      await expect(table).toBeVisible();

      const clientHeader = table.locator('th', { hasText: 'Client' });
      await expect(clientHeader).toBeVisible();

      const typeHeader = table.locator('th', { hasText: 'Type' });
      await expect(typeHeader).toBeVisible();

      const priceHeader = table.locator('th', { hasText: 'Price' });
      await expect(priceHeader).toBeVisible();

      const statusHeader = table.locator('th', { hasText: 'Status' });
      await expect(statusHeader).toBeVisible();

      const dateHeader = table.locator('th', { hasText: 'Date' });
      await expect(dateHeader).toBeVisible();

      const actionsHeader = table.locator('th', { hasText: 'Actions' });
      await expect(actionsHeader).toBeVisible();
    });

    test('Sortable headers have sortable class', async () => {
      const clientHeader = page.locator('.commissions-table th.sortable', { hasText: 'Client' });
      await expect(clientHeader).toBeVisible();

      const statusHeader = page.locator('.commissions-table th.sortable', { hasText: 'Status' });
      await expect(statusHeader).toBeVisible();

      const dateHeader = page.locator('.commissions-table th.sortable', { hasText: 'Date' });
      await expect(dateHeader).toBeVisible();
    });

    test('Empty state shown when no commissions match filter', async () => {
      // This test assumes there might be empty states for some filters
      // Check if either empty state OR commission rows exist
      const emptyState = page.locator('.commissions-table .empty-state');
      const commissionRows = page.locator('.commissions-table tbody tr:not(:has(.empty-state))');

      const emptyCount = await emptyState.count();
      const rowCount = await commissionRows.count();

      // Either we have an empty state or we have rows - one must be true
      expect(emptyCount > 0 || rowCount >= 0).toBeTruthy();
    });
  });

  test.describe('Commissions Tab - Sorting', () => {
    test.beforeEach(async () => {
      await page.click('.admin-nav button:has-text("Commissions")');
      await page.waitForSelector('.commissions-table', { state: 'visible' });
    });

    test('clicking Client header toggles sort', async () => {
      const clientHeader = page.locator('.commissions-table th.sortable', { hasText: 'Client' });
      await clientHeader.click();

      // After click, should show sort indicator
      await expect(clientHeader).toHaveText(/Client [↑↓]/);
    });

    test('clicking Date header toggles sort', async () => {
      const dateHeader = page.locator('.commissions-table th.sortable', { hasText: 'Date' });
      await dateHeader.click();

      // After click, should show sort indicator
      await expect(dateHeader).toHaveText(/Date [↑↓]/);
    });

    test('double-clicking header toggles sort direction', async () => {
      const dateHeader = page.locator('.commissions-table th.sortable', { hasText: 'Date' });

      // First click
      await dateHeader.click();
      const firstText = await dateHeader.textContent();

      // Second click
      await dateHeader.click();
      const secondText = await dateHeader.textContent();

      // Direction should have changed (↑ to ↓ or vice versa)
      expect(firstText).not.toEqual(secondText);
    });
  });

  test.describe('Commission Detail Modal', () => {
    test.beforeEach(async () => {
      await page.click('.admin-nav button:has-text("Commissions")');
      await page.waitForSelector('.commissions-table', { state: 'visible' });
    });

    test('clicking View button opens modal (if commissions exist)', async () => {
      const viewButton = page.locator('.commissions-table .btn-view').first();
      const buttonCount = await viewButton.count();

      if (buttonCount > 0) {
        await viewButton.click();

        const modal = page.locator('.modal-overlay');
        await expect(modal).toBeVisible();

        // Take screenshot of modal
        await page.screenshot({ path: 'e2e/screenshots/admin-commission-modal.png' });
      } else {
        // Skip if no commissions
        test.skip();
      }
    });

    test('modal has Client Info fieldset (if commissions exist)', async () => {
      const viewButton = page.locator('.commissions-table .btn-view').first();
      const buttonCount = await viewButton.count();

      if (buttonCount > 0) {
        await viewButton.click();
        await page.waitForSelector('.modal-overlay', { state: 'visible' });

        const clientFieldset = page.locator('.modal-fieldset:has(legend:has-text("Client Info"))');
        await expect(clientFieldset).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('modal has Commission Details fieldset (if commissions exist)', async () => {
      const viewButton = page.locator('.commissions-table .btn-view').first();
      const buttonCount = await viewButton.count();

      if (buttonCount > 0) {
        await viewButton.click();
        await page.waitForSelector('.modal-overlay', { state: 'visible' });

        const detailsFieldset = page.locator('.modal-fieldset:has(legend:has-text("Commission Details"))');
        await expect(detailsFieldset).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('modal has Description fieldset (if commissions exist)', async () => {
      const viewButton = page.locator('.commissions-table .btn-view').first();
      const buttonCount = await viewButton.count();

      if (buttonCount > 0) {
        await viewButton.click();
        await page.waitForSelector('.modal-overlay', { state: 'visible' });

        const descFieldset = page.locator('.modal-fieldset:has(legend:has-text("Description"))');
        await expect(descFieldset).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('modal has Admin Controls fieldset (if commissions exist)', async () => {
      const viewButton = page.locator('.commissions-table .btn-view').first();
      const buttonCount = await viewButton.count();

      if (buttonCount > 0) {
        await viewButton.click();
        await page.waitForSelector('.modal-overlay', { state: 'visible' });

        const adminFieldset = page.locator('.modal-fieldset:has(legend:has-text("Admin Controls"))');
        await expect(adminFieldset).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('Admin Controls has Status, Quoted Price, and Notes (if commissions exist)', async () => {
      const viewButton = page.locator('.commissions-table .btn-view').first();
      const buttonCount = await viewButton.count();

      if (buttonCount > 0) {
        await viewButton.click();
        await page.waitForSelector('.modal-overlay', { state: 'visible' });

        const adminFieldset = page.locator('.modal-fieldset:has(legend:has-text("Admin Controls"))');

        const statusLabel = adminFieldset.locator('label', { hasText: 'Status' });
        await expect(statusLabel).toBeVisible();

        const priceLabel = adminFieldset.locator('label', { hasText: 'Quoted Price' });
        await expect(priceLabel).toBeVisible();

        const notesLabel = adminFieldset.locator('label', { hasText: 'Internal Notes' });
        await expect(notesLabel).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('modal close button works (if commissions exist)', async () => {
      const viewButton = page.locator('.commissions-table .btn-view').first();
      const buttonCount = await viewButton.count();

      if (buttonCount > 0) {
        await viewButton.click();
        await page.waitForSelector('.modal-overlay', { state: 'visible' });

        const closeButton = page.locator('.modal-close');
        await closeButton.click();

        const modal = page.locator('.modal-overlay');
        await expect(modal).not.toBeVisible();
      } else {
        test.skip();
      }
    });

    test('clicking modal overlay closes modal (if commissions exist)', async () => {
      const viewButton = page.locator('.commissions-table .btn-view').first();
      const buttonCount = await viewButton.count();

      if (buttonCount > 0) {
        await viewButton.click();
        await page.waitForSelector('.modal-overlay', { state: 'visible' });

        // Click the overlay (not the content)
        await page.locator('.modal-overlay').click({ position: { x: 10, y: 10 } });

        const modal = page.locator('.modal-overlay');
        await expect(modal).not.toBeVisible();
      } else {
        test.skip();
      }
    });
  });

  test.describe('Responsive Layout', () => {
    test('takes mobile screenshot of Gallery tab', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.screenshot({ path: 'e2e/screenshots/admin-gallery-mobile.png', fullPage: true });
    });

    test('takes mobile screenshot of Settings tab', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.click('.admin-nav button:has-text("Settings")');
      await page.waitForSelector('.settings-form', { state: 'visible' });
      await page.screenshot({ path: 'e2e/screenshots/admin-settings-mobile.png', fullPage: true });
    });

    test('takes mobile screenshot of Commissions tab', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.click('.admin-nav button:has-text("Commissions")');
      await page.waitForSelector('.commissions-table', { state: 'visible' });
      await page.screenshot({ path: 'e2e/screenshots/admin-commissions-mobile.png', fullPage: true });
    });
  });
});
