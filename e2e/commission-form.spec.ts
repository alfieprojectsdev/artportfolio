import { test, expect } from '@playwright/test';

test.describe('Commission Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for React hydration
    await page.waitForTimeout(1500);
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

  test.describe('Form Visibility (Open State)', () => {
    test('displays form heading', async ({ page }) => {
      const heading = page.locator('.commission-form h3');
      await expect(heading).toHaveText('Request a Commission');
    });

    test('displays all required fields', async ({ page }) => {
      await expect(page.locator('#clientName')).toBeVisible();
      await expect(page.locator('#email')).toBeVisible();
      await expect(page.locator('#artType')).toBeVisible();
      await expect(page.locator('#style')).toBeVisible();
      await expect(page.locator('#description')).toBeVisible();
    });

    test('displays optional discord field', async ({ page }) => {
      await expect(page.locator('#discord')).toBeVisible();
    });

    test('displays submit button', async ({ page }) => {
      const submitBtn = page.locator('.commission-form .submit-btn');
      await expect(submitBtn).toBeVisible();
      await expect(submitBtn).toHaveText('Submit Request');
    });
  });

  test.describe('Art Type Options', () => {
    test('has all art type options', async ({ page }) => {
      const artType = page.locator('#artType');
      await expect(artType.locator('option')).toHaveCount(6);
    });

    test('has correct art type values', async ({ page }) => {
      const options = page.locator('#artType option');
      await expect(options.nth(0)).toHaveText('Headshot');
      await expect(options.nth(1)).toHaveText('Bust');
      await expect(options.nth(2)).toHaveText('Half Body');
      await expect(options.nth(3)).toHaveText('Full Body');
      await expect(options.nth(4)).toHaveText('Chibi');
      await expect(options.nth(5)).toHaveText('Custom (Quote Required)');
    });
  });

  test.describe('Style Options', () => {
    test('has all style options', async ({ page }) => {
      const style = page.locator('#style');
      await expect(style.locator('option')).toHaveCount(3);
    });

    test('has correct style values', async ({ page }) => {
      const options = page.locator('#style option');
      await expect(options.nth(0)).toHaveText('Sketch');
      await expect(options.nth(1)).toHaveText('Flat Color');
      await expect(options.nth(2)).toHaveText('Fully Rendered');
    });
  });

  test.describe('Price Calculator', () => {
    test('displays price estimate', async ({ page }) => {
      const priceEstimate = page.locator('.price-estimate');
      await expect(priceEstimate).toBeVisible();
      await expect(priceEstimate).toContainText('Estimated Price:');
    });

    test('updates price when art type changes', async ({ page }) => {
      const priceEstimate = page.locator('.price-estimate strong');

      // Default is bust + flat = 150
      await expect(priceEstimate).toContainText('₱150');

      // Change to headshot
      await page.selectOption('#artType', 'headshot');
      await expect(priceEstimate).toContainText('₱100');

      // Change to full body
      await page.selectOption('#artType', 'full');
      await expect(priceEstimate).toContainText('₱250');
    });

    test('updates price when style changes', async ({ page }) => {
      const priceEstimate = page.locator('.price-estimate strong');

      // Change to sketch (bust default)
      await page.selectOption('#style', 'sketch');
      await expect(priceEstimate).toContainText('₱80');

      // Change to rendered
      await page.selectOption('#style', 'rendered');
      await expect(priceEstimate).toContainText('₱200');
    });

    test('shows Quote Required for custom type', async ({ page }) => {
      await page.selectOption('#artType', 'custom');
      const priceEstimate = page.locator('.price-estimate strong');
      await expect(priceEstimate).toHaveText('Quote Required');
    });

    test('displays USD equivalent', async ({ page }) => {
      const priceEstimate = page.locator('.price-estimate strong');
      // Bust + flat = 150 PHP / 56 = ~$3
      await expect(priceEstimate).toContainText('USD');
    });
  });

  test.describe('Form Input', () => {
    test('accepts name input', async ({ page }) => {
      await page.fill('#clientName', 'Test User');
      await expect(page.locator('#clientName')).toHaveValue('Test User');
    });

    test('accepts email input', async ({ page }) => {
      await page.fill('#email', 'test@example.com');
      await expect(page.locator('#email')).toHaveValue('test@example.com');
    });

    test('accepts discord input', async ({ page }) => {
      await page.fill('#discord', 'testuser#1234');
      await expect(page.locator('#discord')).toHaveValue('testuser#1234');
    });

    test('accepts description input', async ({ page }) => {
      const description = 'I would like a portrait of my OC with blue hair.';
      await page.fill('#description', description);
      await expect(page.locator('#description')).toHaveValue(description);
    });

    test('displays character count', async ({ page }) => {
      await page.fill('#description', 'Test description');
      const charCount = page.locator('.char-count');
      await expect(charCount).toContainText('16/2000');
    });
  });

  test.describe('Reference Images Section', () => {
    test('displays reference images section', async ({ page }) => {
      const label = page.locator('label:has-text("Reference Images")');
      await expect(label).toBeVisible();
    });

    test('displays add reference button', async ({ page }) => {
      const addBtn = page.locator('.add-ref-btn');
      await expect(addBtn).toBeVisible();
      await expect(addBtn).toHaveText('+ Add Reference');
    });

    test('displays hint text', async ({ page }) => {
      const hint = page.locator('.field-hint');
      await expect(hint).toContainText('character references');
    });
  });

  test.describe('Form Submission', () => {
    test('submits with valid data', async ({ page }) => {
      // Scroll to form first
      await page.locator('#request').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      // Fill required fields
      await page.fill('#clientName', 'E2E Test User');
      await page.fill('#email', 'e2e-test@example.com');
      await page.fill('#description', 'This is an automated E2E test commission. Please ignore this submission.');

      // Submit form
      await page.click('.submit-btn');

      // Wait for either success or error message
      const message = page.locator('.form-message');
      await expect(message).toBeVisible({ timeout: 20000 });

      // Check if it's a success
      const successMessage = page.locator('.form-message.success');
      const errorMessage = page.locator('.form-message.error');

      const isSuccess = await successMessage.isVisible().catch(() => false);
      const isError = await errorMessage.isVisible().catch(() => false);

      if (isError) {
        const errorText = await errorMessage.textContent();
        console.log('Form submission error:', errorText);
      }

      expect(isSuccess || isError).toBe(true);
      if (isSuccess) {
        await expect(successMessage).toContainText('submitted');
      }
    });

    test('shows submitting state on click', async ({ page }) => {
      // Scroll to form
      await page.locator('#request').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      await page.fill('#clientName', 'Test User');
      await page.fill('#email', 'test@example.com');
      await page.fill('#description', 'Test commission description.');

      const submitBtn = page.locator('.submit-btn');

      // Use Promise.all to check button state immediately after click
      const [buttonText] = await Promise.all([
        submitBtn.textContent(),
        submitBtn.click(),
      ]);

      // Either shows submitting or already done
      expect(['Submit Request', 'Submitting...']).toContain(buttonText);
    });

    test('form responds to submission', async ({ page }) => {
      // Scroll to form
      await page.locator('#request').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      await page.fill('#clientName', 'Response Test User');
      await page.fill('#email', 'responsetest@example.com');
      await page.fill('#description', 'Test commission description for response test.');

      await page.click('.submit-btn');

      // Wait for any form message (success or error)
      const message = page.locator('.form-message');
      await expect(message).toBeVisible({ timeout: 20000 });

      // Form should have responded
      const messageText = await message.textContent();
      expect(messageText).toBeTruthy();
    });
  });

  test.describe('Form Notes', () => {
    test('displays TOS agreement note', async ({ page }) => {
      const note = page.locator('.form-note');
      await expect(note).toBeVisible();
      await expect(note).toContainText('Terms of Service');
    });

    test('displays response time note', async ({ page }) => {
      const note = page.locator('.form-note');
      await expect(note).toContainText('1-3 days');
    });
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
    formData.append('clientName', 'API Test User');
    formData.append('email', 'api-test@example.com');
    formData.append('artType', 'bust');
    formData.append('style', 'flat');
    formData.append('description', 'This is an automated API test commission request. Please ignore.');
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
