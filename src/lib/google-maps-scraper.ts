import puppeteer, { Browser, Page } from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

/**
 * Scraped data from a Google Maps place page
 */
export interface ScrapedPlaceData {
  name: string | null;
  address: string | null;
  rating?: string;
  priceLevel?: string;
  phone?: string;
  website?: string;
  openingHours?: string;
}

// Singleton browser instance for reuse
let browserInstance: Browser | null = null;
let browserLastUsed = 0;
const BROWSER_TIMEOUT = 60000; // Close browser after 1 minute of inactivity

async function getBrowser(): Promise<Browser> {
  browserLastUsed = Date.now();

  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }

  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    // Vercel serverless: use @sparticuz/chromium
    browserInstance = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  } else {
    // Local development: use system Chrome
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
      ],
      executablePath: process.platform === 'darwin'
        ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        : process.platform === 'win32'
          ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
          : '/usr/bin/google-chrome',
    });
  }

  // Auto-close browser after inactivity
  const checkAndClose = () => {
    if (Date.now() - browserLastUsed > BROWSER_TIMEOUT && browserInstance?.connected) {
      browserInstance.close().catch(() => {});
      browserInstance = null;
    } else if (browserInstance?.connected) {
      setTimeout(checkAndClose, 10000);
    }
  };
  setTimeout(checkAndClose, BROWSER_TIMEOUT);

  return browserInstance;
}

/**
 * Handle Google consent page if we land on it
 * Improved to detect consent forms in page content, not just URL
 */
async function handleConsentPage(page: Page): Promise<void> {
  const url = page.url();

  // Check URL for consent page
  const isConsentUrl = url.includes('consent.google.com');

  // Also check page content for consent forms (some regions show inline consent)
  const hasConsentForm = await page.evaluate(() => {
    // Check for common consent form indicators
    const consentIndicators = [
      'form[action*="consent"]',
      '#L2AGLb', // Google's "Accept all" button ID
      'button[aria-label*="Accept"]',
      'button[aria-label*="Agree"]',
      '[data-ved] button', // Google's consent buttons often have data-ved
    ];

    for (const selector of consentIndicators) {
      if (document.querySelector(selector)) {
        return true;
      }
    }

    // Check for consent-related text
    const bodyText = document.body?.innerText?.toLowerCase() || '';
    return bodyText.includes('before you continue') ||
           bodyText.includes('accept all') ||
           bodyText.includes('consent');
  }).catch(() => false);

  if (!isConsentUrl && !hasConsentForm) {
    return;
  }

  console.log('[Scraper] Handling consent page...');

  try {
    // Try multiple consent button selectors
    const consentClicked = await page.evaluate(() => {
      // Priority-ordered list of consent button selectors
      const buttonSelectors = [
        '#L2AGLb', // Google's "Accept all" button ID (most reliable)
        'button[aria-label*="Accept all"]',
        'button[aria-label*="Accept"]',
        'button[aria-label*="Agree"]',
        'form[action*="consent"] button[type="submit"]',
        'form[action*="consent"] button',
      ];

      for (const selector of buttonSelectors) {
        const btn = document.querySelector(selector);
        if (btn instanceof HTMLElement) {
          console.log('[Scraper] Clicking consent button:', selector);
          btn.click();
          return true;
        }
      }

      // Fallback: find any button with accept/agree text
      const buttons = Array.from(document.querySelectorAll('button'));
      for (const btn of buttons) {
        const text = btn.textContent?.toLowerCase() || '';
        const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
        if (text.includes('accept') || text.includes('agree') ||
            ariaLabel.includes('accept') || ariaLabel.includes('agree')) {
          btn.click();
          return true;
        }
      }

      return false;
    });

    if (consentClicked) {
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {
        console.log('[Scraper] Navigation after consent timed out, continuing...');
      });
    }
  } catch (error) {
    console.log('[Scraper] Consent handling error:', error);
  }
}

/**
 * Scrape place data from a Google Maps URL using Puppeteer
 *
 * @param mapsUrl - A Google Maps URL (can be shortened or full)
 * @returns Scraped place data including exact name and address
 */
export async function scrapeGoogleMapsPlace(mapsUrl: string): Promise<ScrapedPlaceData> {
  console.log('[Scraper] Scraping:', mapsUrl);

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Set consent cookie to try to bypass consent page
    await page.setCookie({
      name: 'CONSENT',
      value: 'YES+cb.20210720-07-p0.en+FX+410',
      domain: '.google.com',
    });

    // Set realistic user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Navigate to the URL
    await page.goto(mapsUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Handle consent page if needed
    await handleConsentPage(page);

    // Wait for content to load
    await page.waitForSelector('h1', { timeout: 10000 }).catch(() => {});

    // Increased wait time from 1.5s to 2.5s for more dynamic content to load
    await new Promise(r => setTimeout(r, 2500));

    // Try to wait specifically for address element (with timeout)
    await page.waitForSelector('button[data-item-id="address"], [data-item-id="address"], div[data-section-id="ad"] button', {
      timeout: 3000
    }).catch(() => {
      console.log('[Scraper] Address selector not found within timeout, continuing...');
    });

    // Log the final URL for debugging
    const finalUrl = page.url();
    console.log('[Scraper] Final URL after load:', finalUrl);

    // Extract place data with fallback selectors
    const data = await page.evaluate((): ScrapedPlaceData => {
      const result: ScrapedPlaceData = {
        name: null,
        address: null,
      };

      // Get place name from h1
      const h1 = document.querySelector('h1');
      if (h1) {
        result.name = h1.textContent?.trim() || null;
      }

      // Get address using multiple fallback selectors
      const addressSelectors = [
        'button[data-item-id="address"]',         // Primary selector
        '[data-item-id="address"]',               // Any element with this data attribute
        'div[data-section-id="ad"] button',       // Address section button
        'button[aria-label*="Address"]',          // Button with Address in aria-label
        'button[aria-label*="address"]',          // Lowercase variant
        '[data-tooltip*="address" i]',            // Element with address tooltip
      ];

      for (const selector of addressSelectors) {
        try {
          const addressEl = document.querySelector(selector);
          if (addressEl) {
            const text = addressEl.textContent?.trim();
            // Validate it looks like an address (has numbers or common address words)
            if (text && (
              /\d/.test(text) ||                    // Contains numbers
              /street|road|lane|ave|blvd/i.test(text) ||  // Common road words
              /,/.test(text)                        // Contains comma (city, state)
            )) {
              result.address = text;
              console.log('[Scraper] Address found via:', selector);
              break;
            }
          }
        } catch {
          // Selector syntax error, skip
        }
      }

      // Fallback: Extract address from aria-label on the address section
      if (!result.address) {
        const allButtons = document.querySelectorAll('button[aria-label]');
        for (const btn of allButtons) {
          const label = btn.getAttribute('aria-label') || '';
          // Look for labels that contain "Address:" prefix
          if (label.toLowerCase().includes('address:')) {
            const addressPart = label.replace(/^address:\s*/i, '').trim();
            if (addressPart) {
              result.address = addressPart;
              console.log('[Scraper] Address found via aria-label');
              break;
            }
          }
        }
      }

      // Get rating
      const ratingSpan = document.querySelector('span[aria-hidden="true"]');
      if (ratingSpan && /^\d\.\d$/.test(ratingSpan.textContent?.trim() || '')) {
        result.rating = ratingSpan.textContent?.trim();
      }

      // Get phone
      const phoneBtn = document.querySelector('button[data-item-id^="phone"]');
      if (phoneBtn) {
        result.phone = phoneBtn.textContent?.trim() || undefined;
      }

      // Get website
      const websiteLink = document.querySelector('a[data-item-id="authority"]');
      if (websiteLink) {
        result.website = websiteLink.getAttribute('href') || undefined;
      }

      // Get opening hours from the hours button
      const hoursBtn = document.querySelector('button[data-item-id^="oh"]');
      if (hoursBtn) {
        const hoursText = hoursBtn.textContent?.trim();
        if (hoursText) {
          result.openingHours = hoursText;
        }
      }

      return result;
    });

    // If address is still null, try to extract from URL path as final fallback
    if (!data.address && finalUrl.includes('/place/')) {
      const placeMatch = finalUrl.match(/\/place\/([^/@]+)/);
      if (placeMatch) {
        try {
          const urlAddress = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
          // Only use if it looks like an address (has number or comma)
          if (/\d/.test(urlAddress) || urlAddress.includes(',')) {
            data.address = urlAddress;
            console.log('[Scraper] Address extracted from URL path:', urlAddress);
          }
        } catch {
          // Decode error, ignore
        }
      }
    }

    console.log('[Scraper] Extracted:', data);
    return data;

  } finally {
    await page.close();
  }
}

/**
 * Expand a shortened Google Maps URL and scrape place data
 *
 * @param shortUrl - A shortened Google Maps URL (maps.app.goo.gl or goo.gl/maps)
 * @returns Object containing expanded URL and scraped place data
 */
export async function expandAndScrapeGoogleMapsUrl(shortUrl: string): Promise<{
  success: boolean;
  expandedUrl?: string;
  data?: ScrapedPlaceData;
  error?: string;
}> {
  try {
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
      // Set consent cookie
      await page.setCookie({
        name: 'CONSENT',
        value: 'YES+cb.20210720-07-p0.en+FX+410',
        domain: '.google.com',
      });

      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      // Navigate - this will follow redirects
      await page.goto(shortUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Handle consent if needed
      await handleConsentPage(page);

      // Get the final URL after redirects
      const expandedUrl = page.url();
      console.log('[Scraper] Expanded URL:', expandedUrl);

      // Verify it's a Google Maps URL
      if (!expandedUrl.includes('google.com/maps') && !expandedUrl.includes('maps.google')) {
        return {
          success: false,
          error: 'Redirect did not lead to Google Maps'
        };
      }

      // Wait for content
      await page.waitForSelector('h1', { timeout: 10000 }).catch(() => {});

      // Increased wait time from 1.5s to 2.5s for more dynamic content to load
      await new Promise(r => setTimeout(r, 2500));

      // Try to wait specifically for address element (with timeout)
      await page.waitForSelector('button[data-item-id="address"], [data-item-id="address"], div[data-section-id="ad"] button', {
        timeout: 3000
      }).catch(() => {
        console.log('[Scraper] Address selector not found within timeout, continuing...');
      });

      // Extract data with fallback selectors
      const data = await page.evaluate((): ScrapedPlaceData => {
        const result: ScrapedPlaceData = {
          name: null,
          address: null,
        };

        const h1 = document.querySelector('h1');
        if (h1) {
          result.name = h1.textContent?.trim() || null;
        }

        // Get address using multiple fallback selectors
        const addressSelectors = [
          'button[data-item-id="address"]',         // Primary selector
          '[data-item-id="address"]',               // Any element with this data attribute
          'div[data-section-id="ad"] button',       // Address section button
          'button[aria-label*="Address"]',          // Button with Address in aria-label
          'button[aria-label*="address"]',          // Lowercase variant
        ];

        for (const selector of addressSelectors) {
          try {
            const addressEl = document.querySelector(selector);
            if (addressEl) {
              const text = addressEl.textContent?.trim();
              // Validate it looks like an address (has numbers or common address words)
              if (text && (
                /\d/.test(text) ||                    // Contains numbers
                /street|road|lane|ave|blvd/i.test(text) ||  // Common road words
                /,/.test(text)                        // Contains comma (city, state)
              )) {
                result.address = text;
                break;
              }
            }
          } catch {
            // Selector syntax error, skip
          }
        }

        // Fallback: Extract address from aria-label on buttons
        if (!result.address) {
          const allButtons = document.querySelectorAll('button[aria-label]');
          for (const btn of allButtons) {
            const label = btn.getAttribute('aria-label') || '';
            if (label.toLowerCase().includes('address:')) {
              const addressPart = label.replace(/^address:\s*/i, '').trim();
              if (addressPart) {
                result.address = addressPart;
                break;
              }
            }
          }
        }

        // Get phone
        const phoneBtn = document.querySelector('button[data-item-id^="phone"]');
        if (phoneBtn) {
          result.phone = phoneBtn.textContent?.trim() || undefined;
        }

        // Get website
        const websiteLink = document.querySelector('a[data-item-id="authority"]');
        if (websiteLink) {
          result.website = websiteLink.getAttribute('href') || undefined;
        }

        // Get opening hours
        const hoursBtn = document.querySelector('button[data-item-id^="oh"]');
        if (hoursBtn) {
          result.openingHours = hoursBtn.textContent?.trim() || undefined;
        }

        return result;
      });

      // If address is still null, try to extract from URL path as final fallback
      if (!data.address && expandedUrl.includes('/place/')) {
        const placeMatch = expandedUrl.match(/\/place\/([^/@]+)/);
        if (placeMatch) {
          try {
            const urlAddress = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
            // Only use if it looks like an address (has number or comma)
            if (/\d/.test(urlAddress) || urlAddress.includes(',')) {
              data.address = urlAddress;
              console.log('[Scraper] Address extracted from URL path:', urlAddress);
            }
          } catch {
            // Decode error, ignore
          }
        }
      }

      return {
        success: true,
        expandedUrl,
        data,
      };

    } finally {
      await page.close();
    }

  } catch (error) {
    console.error('[Scraper] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Scraping failed',
    };
  }
}
