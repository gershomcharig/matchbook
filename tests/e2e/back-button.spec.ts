import { test, expect } from './fixtures/auth';
import { waitForMapLoad, openCollectionsPanel } from './fixtures/test-helpers';

test.describe('Back button navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Wait for the app to load
    await waitForMapLoad(page);
  });

  test('collections panel closes on back', async ({ page }) => {
    // Open collections panel
    await openCollectionsPanel(page);

    // Verify panel is open
    await expect(page.locator('[data-testid="collections-panel"]')).toBeVisible();

    // Press browser back button
    await page.goBack();

    // Verify panel is closed
    await expect(page.locator('[data-testid="collections-panel"]')).not.toBeVisible();
  });

  test('collection drill-down navigates back to collections list', async ({ page }) => {
    // Open collections panel
    await openCollectionsPanel(page);

    // Check if there are any collections
    const collections = page.locator('[data-testid="collection-item"]');
    const collectionCount = await collections.count();

    if (collectionCount === 0) {
      test.skip(true, 'No collections available for testing');
      return;
    }

    // Click on the first collection to drill down
    await collections.first().click();

    // Verify we're in the collection places view (back button should be visible)
    await expect(page.locator('[data-testid="collection-back-button"]')).toBeVisible();

    // Press browser back button
    await page.goBack();

    // Verify we're back at collections list (back button should not be visible)
    await expect(page.locator('[data-testid="collection-back-button"]')).not.toBeVisible();

    // Collections panel should still be open
    await expect(page.locator('[data-testid="collections-panel"]')).toBeVisible();
  });

  test('place panel closes and returns to collection on back', async ({ page }) => {
    // Open collections panel
    await openCollectionsPanel(page);

    // Check if there are any collections
    const collections = page.locator('[data-testid="collection-item"]');
    const collectionCount = await collections.count();

    if (collectionCount === 0) {
      test.skip(true, 'No collections available for testing');
      return;
    }

    // Click on the first collection
    await collections.first().click();

    // Wait for places list to load
    await expect(page.locator('[data-testid="collection-back-button"]')).toBeVisible();

    // Check if there are any places in this collection
    const places = page.locator('[data-testid="place-item"]');
    const placeCount = await places.count();

    if (placeCount === 0) {
      test.skip(true, 'No places in collection for testing');
      return;
    }

    // Click on the first place
    await places.first().click();

    // Verify place details panel is open
    await expect(page.locator('[data-testid="place-details-panel"]')).toBeVisible();

    // Press browser back button
    await page.goBack();

    // Place panel should be closed
    await expect(page.locator('[data-testid="place-details-panel"]')).not.toBeVisible();

    // Should be back at the collection places list
    await expect(page.locator('[data-testid="collection-back-button"]')).toBeVisible();
  });

  test('multiple back presses close all panels', async ({ page }) => {
    // Open collections panel
    await openCollectionsPanel(page);

    // Check if there are any collections
    const collections = page.locator('[data-testid="collection-item"]');
    const collectionCount = await collections.count();

    if (collectionCount === 0) {
      test.skip(true, 'No collections available for testing');
      return;
    }

    // Drill into a collection
    await collections.first().click();
    await expect(page.locator('[data-testid="collection-back-button"]')).toBeVisible();

    // First back: return to collections list
    await page.goBack();
    await expect(page.locator('[data-testid="collection-back-button"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="collections-panel"]')).toBeVisible();

    // Second back: close panel entirely
    await page.goBack();
    await expect(page.locator('[data-testid="collections-panel"]')).not.toBeVisible();
  });
});
