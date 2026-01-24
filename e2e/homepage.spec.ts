import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('loads successfully', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
  });

  test.describe('Hero Section', () => {
    test('displays profile image', async ({ page }) => {
      await page.goto('/');
      const profileImage = page.locator('.profile-pic');
      await expect(profileImage).toBeVisible();
      await expect(profileImage).toHaveAttribute('src', '/assets/profile.jpg');
    });

    test('displays artist name heading', async ({ page }) => {
      await page.goto('/');
      const heading = page.locator('.hero h1');
      await expect(heading).toBeVisible();
      await expect(heading).toContainText('Commissions');
    });

    test('displays commission status badge', async ({ page }) => {
      await page.goto('/');
      const statusBadge = page.locator('.status-badge');
      await expect(statusBadge).toBeVisible();
      await expect(statusBadge).toContainText('Status:');
    });

    test('displays artist bio', async ({ page }) => {
      await page.goto('/');
      const bio = page.locator('.hero .intro');
      await expect(bio).toBeVisible();
    });
  });

  test.describe('Pricing Section', () => {
    test('has 4 price cards', async ({ page }) => {
      await page.goto('/');
      const priceCards = page.locator('.price-card');
      await expect(priceCards).toHaveCount(4);
    });

    test('displays pricing section heading', async ({ page }) => {
      await page.goto('/');
      const pricingHeading = page.locator('.pricing-section h2');
      await expect(pricingHeading).toBeVisible();
      await expect(pricingHeading).toHaveText('Commission Rates');
    });

    test('displays correct price card types', async ({ page }) => {
      await page.goto('/');
      const cardTitles = page.locator('.price-card h3');
      await expect(cardTitles.nth(0)).toHaveText('Bust / Headshot');
      await expect(cardTitles.nth(1)).toHaveText('Half Body');
      await expect(cardTitles.nth(2)).toHaveText('Full Body');
      await expect(cardTitles.nth(3)).toHaveText('Chibi Style');
    });
  });

  test.describe('Terms of Service Section', () => {
    test('displays TOS section', async ({ page }) => {
      await page.goto('/');
      const tosSection = page.locator('#tos');
      await expect(tosSection).toBeVisible();
    });

    test('displays TOS heading', async ({ page }) => {
      await page.goto('/');
      const tosHeading = page.locator('.tos-section h2');
      await expect(tosHeading).toBeVisible();
      await expect(tosHeading).toHaveText('Terms of Service');
    });

    test('displays TOS list items', async ({ page }) => {
      await page.goto('/');
      const tosItems = page.locator('.tos-list li');
      await expect(tosItems).toHaveCount(5);
    });
  });

  test.describe('Dos and Donts Section', () => {
    test('displays Dos column', async ({ page }) => {
      await page.goto('/');
      const dosColumn = page.locator('.col.do');
      await expect(dosColumn).toBeVisible();
      await expect(dosColumn.locator('h3')).toContainText('DOs');
    });

    test('displays Donts column', async ({ page }) => {
      await page.goto('/');
      const dontsColumn = page.locator('.col.dont');
      await expect(dontsColumn).toBeVisible();
      await expect(dontsColumn.locator('h3')).toContainText("DON'Ts");
    });
  });

  test.describe('Footer', () => {
    test('has social links', async ({ page }) => {
      await page.goto('/');
      const footer = page.locator('footer');
      await expect(footer).toBeVisible();

      const socialLinks = footer.locator('.social-links');
      await expect(socialLinks).toBeVisible();
    });

    test('has Instagram link', async ({ page }) => {
      await page.goto('/');
      const instagramLink = page.locator('footer .social-links a[href*="instagram.com"]');
      await expect(instagramLink).toBeVisible();
      await expect(instagramLink).toContainText('Instagram:');
    });

    test('has Discord copy button', async ({ page }) => {
      await page.goto('/');
      const discordButton = page.locator('#discordBtn');
      await expect(discordButton).toBeVisible();
      await expect(discordButton).toContainText('Discord:');
    });

    test('displays contact heading', async ({ page }) => {
      await page.goto('/');
      const contactHeading = page.locator('footer h3');
      await expect(contactHeading).toBeVisible();
      await expect(contactHeading).toHaveText('Contact Me');
    });
  });
});
