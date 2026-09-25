import { test, expect, type APIRequestContext } from '@playwright/test';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Same env loading as admin-ui.spec.ts, so ADMIN_PASSWORD comes from .env.local.
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

/**
 * Status changes used to save (and email the client) the moment the row's
 * dropdown changed. They now wait for a confirm dialog with an email opt-out.
 *
 * Self-contained: creates its own commission, never touches site settings
 * (the waitlist toggle would break commission-form.spec.ts running in
 * parallel), and deletes the row afterwards. The guard keeps RESEND_API_KEY
 * unset, so no email can actually leave.
 */

const password = process.env.ADMIN_PASSWORD || 'test-password';
const authHeader = { Authorization: 'Basic ' + Buffer.from(`admin:${password}`).toString('base64') };

async function findCommission(request: APIRequestContext, email: string) {
  const res = await request.get('/api/commissions', { headers: authHeader });
  expect(res.ok()).toBeTruthy();
  const rows: { id: number; email: string; status: string }[] = await res.json();
  return rows.find(r => r.email === email);
}

test.describe('Admin status change confirmation', () => {
  test.describe.configure({ mode: 'serial' });

  const email = `status-confirm-${Date.now()}@example.com`;
  let id: number | undefined;

  test.beforeAll(async ({ request }) => {
    const form = new URLSearchParams({
      clientName: 'Status Confirm Test',
      email,
      artType: 'bust',
      style: 'flat',
      description: 'Automated e2e request for the status confirmation dialog. Please ignore.',
    });
    const res = await request.post('/_actions/submitCommission', {
      data: form.toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    });
    // 403 means availability is `closed` on the test branch; nothing to test against.
    test.skip(res.status() === 403, 'Commissions are closed on this database');
    expect(res.ok()).toBeTruthy();
    id = (await findCommission(request, email))?.id;
    expect(id).toBeDefined();
  });

  test.afterAll(async ({ request }) => {
    if (id !== undefined) {
      await request.delete(`/api/commissions/${id}`, { headers: authHeader });
    }
  });

  test('PATCH rejects an unknown status', async ({ request }) => {
    const res = await request.patch(`/api/commissions/${id}`, {
      headers: { ...authHeader, 'Content-Type': 'application/json' },
      data: { status: 'bogus' },
    });
    expect(res.status()).toBe(400);
  });

  test('dropdown asks first; Cancel leaves the status alone', async ({ browser, request }) => {
    const context = await browser.newContext({ httpCredentials: { username: 'admin', password } });
    const page = await context.newPage();
    await page.goto('/admin');
    await page.waitForSelector('.admin-nav', { state: 'visible', timeout: 10000 });
    await page.click('.admin-nav button:has-text("Commissions")');

    const row = page.locator('.commissions-table tr', { hasText: email });
    const select = row.locator('.status-select');
    const initial = await select.inputValue();

    await select.selectOption('completed');
    const dialog = page.locator('.status-confirm');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(`Change #${id} to Completed?`);
    await expect(dialog.locator('#status-email-toggle')).toBeChecked();

    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();
    await expect(select).toHaveValue(initial);
    expect((await findCommission(request, email))?.status).toBe(initial);

    await context.close();
  });

  test('unticking the email saves the status without sending', async ({ browser, request }) => {
    const context = await browser.newContext({ httpCredentials: { username: 'admin', password } });
    const page = await context.newPage();
    await page.goto('/admin');
    await page.waitForSelector('.admin-nav', { state: 'visible', timeout: 10000 });
    await page.click('.admin-nav button:has-text("Commissions")');

    const row = page.locator('.commissions-table tr', { hasText: email });
    await row.locator('.status-select').selectOption('accepted');

    const dialog = page.locator('.status-confirm');
    await dialog.locator('#status-email-toggle').uncheck();
    await expect(dialog.locator('#status-note')).toBeHidden();

    const patch = page.waitForResponse(r => r.url().includes(`/api/commissions/${id}`) && r.request().method() === 'PATCH');
    await dialog.getByRole('button', { name: 'Save', exact: true }).click();
    const res = await patch;
    expect(res.request().postDataJSON()).toMatchObject({ status: 'accepted', sendEmail: false });
    expect(res.headers()['x-status-email']).toBe('none');

    await expect(page.locator('.admin-notice')).toContainText('No email sent');
    expect((await findCommission(request, email))?.status).toBe('accepted');

    await context.close();
  });

  test('statuses without an email template say so', async ({ browser }) => {
    const context = await browser.newContext({ httpCredentials: { username: 'admin', password } });
    const page = await context.newPage();
    await page.goto('/admin');
    await page.waitForSelector('.admin-nav', { state: 'visible', timeout: 10000 });
    await page.click('.admin-nav button:has-text("Commissions")');

    const row = page.locator('.commissions-table tr', { hasText: email });
    await row.locator('.status-select').selectOption('waitlisted');

    const dialog = page.locator('.status-confirm');
    await expect(dialog).toContainText('No email is sent for this status.');
    await expect(dialog.locator('#status-email-toggle')).toHaveCount(0);
    await dialog.getByRole('button', { name: 'Save', exact: true }).click();

    await expect(row.locator('.status-badge')).toHaveText('waitlisted');
    await context.close();
  });
});
