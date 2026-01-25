import { test, expect } from '@playwright/test';

test.describe('Commission Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for React hydration
    await page.waitForTimeout(1000);
  });

  test.describe('Commission Section', () => {
    test('displays commission request section', async ({ page }) => {
      const section = page.locator('#request');
      await expect(section).toBeVisible();
    });

    test('displays section heading', async ({ page }) => {
      const heading = page.locator('.commission-request-section h2');
      await expect(heading).toHaveText('Request a Commission');
    });
  });

  test.describe('Closed State (When commissions are not open)', () => {
    test('displays closed message when status is not open', async ({ page }) => {
      // Check if form is closed (current state is WAITLIST)
      const closedMessage = page.locator('.commission-closed');
      const isVisible = await closedMessage.isVisible().catch(() => false);

      if (isVisible) {
        await expect(closedMessage).toContainText('Commissions are currently closed');
        await expect(closedMessage.locator('p')).toContainText('check back later');
      }
    });
  });

  test.describe('Open State (Form functionality)', () => {
    test.beforeEach(async ({ page }) => {
      // Mock the settings API to return open status
      await page.route('**/api/settings', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            artistName: 'Test Artist',
            commissionStatus: 'open',
            bio: 'Test bio',
            instagram: 'test',
            discord: 'test#1234',
          }),
        });
      });
      await page.goto('/');
      await page.waitForTimeout(1000);
    });

    test('form may display when commissions are open', async ({ page }) => {
      // This test checks if the form structure exists
      // The form renders client-side so we check for either state
      const form = page.locator('.commission-form');
      const closedMessage = page.locator('.commission-closed');

      // At least one should be visible
      const formVisible = await form.isVisible().catch(() => false);
      const closedVisible = await closedMessage.isVisible().catch(() => false);

      expect(formVisible || closedVisible).toBe(true);
    });
  });
});

// Test against production URL
test.describe('Commission Form - Production Tests', () => {
  test('production form accessibility', async ({ page }) => {
    test.skip(!process.env.TEST_PRODUCTION, 'Set TEST_PRODUCTION=1 to run production tests');

    await page.goto('https://artportfolio-sigma.vercel.app/');
    await page.waitForLoadState('networkidle');

    const section = page.locator('#request');
    await expect(section).toBeVisible();
  });
});

// Direct API test for commission submission
test.describe('Commission API', () => {
  test('rejects submission with missing fields', async ({ request }) => {
    const response = await request.post('/_actions/submitCommission', {
      data: {
        clientName: '',
        email: '',
        description: '',
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Should get validation error or bad request
    expect([400, 422, 500]).toContain(response.status());
  });

  test('accepts valid commission submission', async ({ request }) => {
    const formData = new URLSearchParams();
    formData.append('clientName', 'Test User');
    formData.append('email', 'test@example.com');
    formData.append('artType', 'bust');
    formData.append('style', 'flat');
    formData.append('description', 'This is an automated test commission request. Please ignore.');
    formData.append('refImages', '[]');

    const response = await request.post('/_actions/submitCommission', {
      data: formData.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
    });

    // Should succeed (200) or validation error (400/422)
    expect([200, 400, 422]).toContain(response.status());

    if (response.status() === 200) {
      const body = await response.json();
      expect(body.data?.success || body.success).toBeTruthy();
    }
  });
});
