import { test, expect } from '@playwright/test';

test.describe('Admin Authentication', () => {
  test.describe('Unauthorized Access', () => {
    test('returns 401 without credentials', async ({ page }) => {
      const response = await page.goto('/admin');
      expect(response?.status()).toBe(401);
    });

    test('returns WWW-Authenticate header without credentials', async ({ request }) => {
      const response = await request.get('/admin');
      expect(response.status()).toBe(401);
      expect(response.headers()['www-authenticate']).toBe('Basic realm="Admin Area"');
    });

    test('returns 401 with wrong password', async ({ browser }) => {
      const context = await browser.newContext({
        httpCredentials: {
          username: 'admin',
          password: 'wrong-password',
        },
      });
      const page = await context.newPage();
      const response = await page.goto('/admin');
      expect(response?.status()).toBe(401);
      await context.close();
    });

    test('returns 401 with wrong username', async ({ browser }) => {
      const context = await browser.newContext({
        httpCredentials: {
          username: 'wronguser',
          password: process.env.ADMIN_PASSWORD || 'test-password',
        },
      });
      const page = await context.newPage();
      const response = await page.goto('/admin');
      expect(response?.status()).toBe(401);
      await context.close();
    });
  });

  test.describe('Authorized Access', () => {
    test('loads dashboard with valid credentials', async ({ browser }) => {
      const context = await browser.newContext({
        httpCredentials: {
          username: 'admin',
          password: process.env.ADMIN_PASSWORD || 'test-password',
        },
      });
      const page = await context.newPage();
      const response = await page.goto('/admin');
      expect(response?.status()).toBe(200);
      await context.close();
    });

    test('displays admin header', async ({ browser }) => {
      const context = await browser.newContext({
        httpCredentials: {
          username: 'admin',
          password: process.env.ADMIN_PASSWORD || 'test-password',
        },
      });
      const page = await context.newPage();
      await page.goto('/admin');
      const header = page.locator('.admin-header h1');
      await expect(header).toBeVisible();
      await expect(header).toContainText('Admin');
      await context.close();
    });

    test('displays View Site link in header', async ({ browser }) => {
      const context = await browser.newContext({
        httpCredentials: {
          username: 'admin',
          password: process.env.ADMIN_PASSWORD || 'test-password',
        },
      });
      const page = await context.newPage();
      await page.goto('/admin');
      const viewSiteLink = page.locator('.admin-header a');
      await expect(viewSiteLink).toBeVisible();
      await expect(viewSiteLink).toHaveAttribute('href', '/');
      await expect(viewSiteLink).toContainText('View Site');
      await context.close();
    });
  });

  test.describe('Admin Dashboard Navigation', () => {
    test('displays navigation tabs', async ({ browser }) => {
      const context = await browser.newContext({
        httpCredentials: {
          username: 'admin',
          password: process.env.ADMIN_PASSWORD || 'test-password',
        },
      });
      const page = await context.newPage();
      await page.goto('/admin');
      const nav = page.locator('.admin-nav');
      await expect(nav).toBeVisible();
      await context.close();
    });

    test('displays Gallery tab', async ({ browser }) => {
      const context = await browser.newContext({
        httpCredentials: {
          username: 'admin',
          password: process.env.ADMIN_PASSWORD || 'test-password',
        },
      });
      const page = await context.newPage();
      await page.goto('/admin');
      const galleryTab = page.locator('.admin-nav button', { hasText: 'Gallery' });
      await expect(galleryTab).toBeVisible();
      await context.close();
    });

    test('displays Commissions tab', async ({ browser }) => {
      const context = await browser.newContext({
        httpCredentials: {
          username: 'admin',
          password: process.env.ADMIN_PASSWORD || 'test-password',
        },
      });
      const page = await context.newPage();
      await page.goto('/admin');
      const commissionsTab = page.locator('.admin-nav button', { hasText: 'Commissions' });
      await expect(commissionsTab).toBeVisible();
      await context.close();
    });

    test('displays Settings tab', async ({ browser }) => {
      const context = await browser.newContext({
        httpCredentials: {
          username: 'admin',
          password: process.env.ADMIN_PASSWORD || 'test-password',
        },
      });
      const page = await context.newPage();
      await page.goto('/admin');
      const settingsTab = page.locator('.admin-nav button', { hasText: 'Settings' });
      await expect(settingsTab).toBeVisible();
      await context.close();
    });
  });
});
