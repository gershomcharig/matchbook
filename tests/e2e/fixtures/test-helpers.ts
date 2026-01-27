import { Page, expect } from '@playwright/test';

/**
 * Wait for the map to be loaded and interactive.
 */
export async function waitForMapLoad(page: Page): Promise<void> {
  // Wait for the map container to be visible
  await page.locator('.mapboxgl-map').waitFor({ state: 'visible', timeout: 30000 });
  // Give the map a moment to finish loading tiles
  await page.waitForTimeout(1000);
}

/**
 * Open the collections panel.
 */
export async function openCollectionsPanel(page: Page): Promise<void> {
  await page.locator('[data-testid="collections-button"]').click();
  await expect(page.locator('[data-testid="collections-panel"]')).toBeVisible();
}

/**
 * Close the collections panel by clicking the backdrop.
 */
export async function closeCollectionsPanel(page: Page): Promise<void> {
  // Click outside the panel to close it
  await page.locator('[data-testid="collections-backdrop"]').click();
  await expect(page.locator('[data-testid="collections-panel"]')).not.toBeVisible();
}

/**
 * Click on a collection in the collections list.
 */
export async function selectCollection(page: Page, collectionName: string): Promise<void> {
  const collectionItem = page.locator('[data-testid="collection-item"]').filter({
    hasText: collectionName,
  });
  await collectionItem.click();
}

/**
 * Click on a place in the places list.
 */
export async function selectPlace(page: Page, placeName: string): Promise<void> {
  const placeItem = page.locator('[data-testid="place-item"]').filter({
    hasText: placeName,
  });
  await placeItem.click();
}
