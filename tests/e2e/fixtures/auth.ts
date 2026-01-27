import { test as base, expect } from '@playwright/test';

/**
 * Extended test fixture that handles authentication.
 * Auto-logs in before each test using the TEST_PASSWORD environment variable.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // Go to login page
    await page.goto('/login');

    // Check if we're on login page (may already be authenticated)
    const isLoginPage = await page.locator('input#password').isVisible().catch(() => false);

    if (isLoginPage) {
      const testPassword = process.env.TEST_PASSWORD;
      if (!testPassword) {
        throw new Error('TEST_PASSWORD environment variable is required for E2E tests');
      }

      // Fill in password and submit
      await page.locator('input#password').fill(testPassword);
      await page.locator('button[type="submit"]').click();

      // Wait for navigation to home page
      await page.waitForURL('/');
    }

    await use(page);
  },
});

export { expect };
