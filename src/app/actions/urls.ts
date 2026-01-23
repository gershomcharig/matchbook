'use server';

/**
 * Server action to expand shortened Google Maps URLs
 * This runs server-side to avoid CORS restrictions
 */
export async function expandShortenedMapsUrl(
  shortUrl: string
): Promise<{ success: boolean; expandedUrl?: string; error?: string }> {
  try {
    // Validate input
    if (!shortUrl || typeof shortUrl !== 'string') {
      return { success: false, error: 'Invalid URL' };
    }

    // Check if it's a shortened URL pattern we handle
    const isShortenedUrl = /^https?:\/\/(goo\.gl\/maps\/|maps\.app\.goo\.gl\/)/i.test(shortUrl);
    if (!isShortenedUrl) {
      // Not a shortened URL, return as-is
      return { success: true, expandedUrl: shortUrl };
    }

    console.log('[URL Expansion] Expanding:', shortUrl);

    // Make a HEAD request to follow redirects
    const response = await fetch(shortUrl, {
      method: 'HEAD',
      redirect: 'follow',
    });

    // The final URL after redirects
    const expandedUrl = response.url;
    console.log('[URL Expansion] Expanded to:', expandedUrl);

    // Verify it looks like a Google Maps URL
    const isGoogleMaps = /google\..*\/maps|maps\.google\./i.test(expandedUrl);
    if (!isGoogleMaps) {
      return { success: false, error: 'Redirect did not lead to Google Maps' };
    }

    return { success: true, expandedUrl };
  } catch (error) {
    console.error('[URL Expansion] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to expand URL',
    };
  }
}
