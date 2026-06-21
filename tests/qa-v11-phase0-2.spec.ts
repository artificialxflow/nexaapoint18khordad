import { expect, test } from '@playwright/test';

const BASE_URL = process.env.QA_BASE_URL ?? process.env.SMOKE_BASE_URL ?? 'http://localhost:3000';
const USERNAME = process.env.SMOKE_BOOTSTRAP_USER ?? 'artificialxflow';
const PASSWORD = process.env.SMOKE_BOOTSTRAP_PASS ?? 'Ronak#123Ronak';

async function expectNoRuntimeOverlay(page: import('@playwright/test').Page) {
  const body = await page.locator('body').innerText();
  await expect(page.locator('[data-nextjs-dialog-overlay]')).toHaveCount(0);
  expect(body).not.toMatch(/Unhandled Runtime Error|Hydration failed|Application error/i);
}

async function expectNoBrokenImages(page: import('@playwright/test').Page) {
  const broken = await page.evaluate(() =>
    [...document.images]
      .filter((img) => img.complete && img.naturalWidth === 0)
      .map((img) => img.currentSrc || img.src)
      .filter(Boolean)
  );
  expect(broken).toEqual([]);
}

async function login(page: import('@playwright/test').Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByLabel('نام کاربری').fill(USERNAME);
  await page.getByLabel('رمز عبور').fill(PASSWORD);
  await page.getByRole('button', { name: /^ورود$/ }).click();
  await page.waitForURL(/\/businesses|\/change-password/, { timeout: 30000 });
}

test.describe('v11 phase 0-2 browser QA', () => {
  test('phase 0: public pages open without runtime overlay or broken images', async ({ page }) => {
    for (const path of ['/', '/login']) {
      await page.goto(`${BASE_URL}${path}`);
      await expectNoRuntimeOverlay(page);
      await expectNoBrokenImages(page);
    }
  });

  test('phase 1: auth, session persistence, invalid login, logout, route protection', async ({ page, context }) => {
    await page.goto(`${BASE_URL}/dashboard/tasks`);
    await page.waitForURL(/\/login/, { timeout: 30000 });

    await login(page);
    await expect(page).toHaveURL(/\/businesses|\/change-password/);

    const me = await page.evaluate(async () => {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      return { ok: res.ok, json: await res.json().catch(() => null) };
    });
    expect(me.ok).toBe(true);
    expect(me.json?.ok).toBe(true);

    await page.reload();
    await expect(page).toHaveURL(/\/businesses|\/change-password/);

    await page.goto(`${BASE_URL}/login`);
    await page.waitForURL(/\/businesses|\/change-password/, { timeout: 30000 });

    const cookies = await context.cookies(BASE_URL);
    const session = cookies.find((c) => c.name === 'nexa_session');
    expect(session).toBeTruthy();
    expect(session?.expires ?? 0).toBeGreaterThan(Date.now() / 1000);

    await page.evaluate(() => fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }));
    await page.goto(`${BASE_URL}/login`);
    await page.getByLabel('نام کاربری').fill('wrong-user');
    await page.getByLabel('رمز عبور').fill('wrong-pass');
    await page.getByRole('button', { name: /^ورود$/ }).click();
    await expect(page.locator('body')).toContainText(/اشتباه|ناموفق/);

    await login(page);
    await page.goto(`${BASE_URL}/dashboard/dashboard`);
    await page.getByText('خروج', { exact: false }).click();
    await page.waitForURL(/\/login/, { timeout: 30000 });
    await page.goto(`${BASE_URL}/businesses`);
    await page.waitForURL(/\/login/, { timeout: 30000 });
  });

  test('phase 2: create, persist, enter, and archive business through UI', async ({ page }) => {
    const businessName = `QA_V11_${Date.now()}`;

    await login(page);
    await page.goto(`${BASE_URL}/businesses/new`);
    await page.getByPlaceholder('مثال: فروشگاه مرکزی نکسا').fill(businessName);
    await page.getByRole('button', { name: 'بعدی' }).click();
    await page.waitForURL(/\/dashboard\/dashboard/, { timeout: 30000 });

    await page.goto(`${BASE_URL}/businesses`);
    await expect(page.getByText(businessName)).toBeVisible({ timeout: 30000 });
    await page.reload();
    await expect(page.getByText(businessName)).toBeVisible({ timeout: 30000 });

    const card = page.locator('.nexa-card').filter({ hasText: businessName }).first();
    await card.getByRole('button', { name: 'حذف' }).click();
    await expect(page.getByText('حذف کسب‌وکار')).toBeVisible();
    await page.getByRole('button', { name: /^حذف$/ }).click();
    await expect(page.getByText(businessName)).toHaveCount(0, { timeout: 30000 });
  });
});
