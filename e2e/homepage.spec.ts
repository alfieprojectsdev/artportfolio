import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('loads successfully', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
  });

  test.describe('Hero Section', () => {
    // playwright.config.ts sets fullyParallel: true, which schedules every
    // test independently regardless of file or describe grouping — tests in
    // one file are NOT guaranteed to run in order just because they're in the
    // same file. The two avatar tests below share the site_settings row's
    // avatar_url column, so without this they can interleave: one test's PUT
    // window can be live while the other's page.goto() reads the same field,
    // producing an intermittent failure that has nothing to do with the code
    // under test. Same hazard admin-settings.spec.ts already guards against.
    test.describe.configure({ mode: 'serial' });

    test('displays profile image, falling back to the bundled default', async ({ page }) => {
      // site_settings.avatar_url is null in the seeded row, so this exercises
      // resolveSiteConfig's fallback rather than a hardcoded path — see the
      // "renders an uploaded avatar" test below for the non-default path.
      await page.goto('/');
      const profileImage = page.locator('.profile-pic');
      await expect(profileImage).toBeVisible();
      await expect(profileImage).toHaveAttribute('src', '/assets/profile.jpg');
    });

    test('renders an uploaded avatar and reverts to the default on removal', async ({ page, request }) => {
      // No real Cloudinary upload here — same limitation as the gallery image
      // widgets, which have no e2e coverage of the upload flow itself. This
      // exercises the read path: PUT a URL, confirm it renders, then PUT null
      // and confirm the fallback returns. Mirrors commission-form.spec.ts's
      // use of `request` for direct API calls.
      const auth = 'Basic ' + Buffer.from(`admin:${process.env.ADMIN_PASSWORD || 'test-password'}`).toString('base64');
      const uploadedUrl = 'https://res.cloudinary.com/demo/image/upload/w_200,h_200,c_fill/e2e-avatar-test.jpg';

      const put = await request.put('/api/settings', {
        headers: { Authorization: auth, 'Content-Type': 'application/json' },
        data: { avatarUrl: uploadedUrl },
      });
      expect(put.ok()).toBeTruthy();

      try {
        await page.goto('/');
        await expect(page.locator('.profile-pic')).toHaveAttribute('src', uploadedUrl);
      } finally {
        // Always revert, even if the assertion above fails, so this test
        // cannot leave the settings row in a state that breaks other tests.
        const reset = await request.put('/api/settings', {
          headers: { Authorization: auth, 'Content-Type': 'application/json' },
          data: { avatarUrl: null },
        });
        expect(reset.ok()).toBeTruthy();
      }

      await page.goto('/');
      await expect(page.locator('.profile-pic')).toHaveAttribute('src', '/assets/profile.jpg');
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
      await expect(cardTitles.nth(0)).toHaveText('Bust');
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
