/**
 * Geocoding utilities for reverse geocoding using OpenStreetMap Nominatim API
 *
 * Nominatim is a free geocoding service provided by OpenStreetMap.
 * Usage Policy: https://operations.osmfoundation.org/policies/nominatim/
 * - Maximum 1 request per second
 * - Must include valid User-Agent header
 * - For production, consider setting up own Nominatim instance
 */

import type { Coordinates } from './maps';

/**
 * Place information returned from geocoding
 *
 * Extended fields (rating, openingHours, website, phone) are optional
 * and will typically be added manually by users in Phase 7.
 * These cannot be reliably extracted from free APIs.
 */
export interface PlaceInfo {
  name: string;
  address: string;
  displayName: string;
  lat: number;
  lng: number;
  placeType?: string;
  city?: string;
  country?: string;
  // Extended fields - user-provided in Phase 7 (Edit Place)
  // These cannot be reliably extracted without paid APIs (Google Places)
  rating?: number; // 1-5 scale
  openingHours?: string; // Free-form text for hours
  website?: string;
  phone?: string;
  // Source tracking
  googleMapsUrl?: string; // Original URL if pasted from Google Maps
  urlExtractedName?: string; // Name extracted from Google Maps URL (may differ from geocoded name)
}

/**
 * Nominatim API response structure (simplified)
 */
interface NominatimResponse {
  display_name: string;
  name?: string;
  address?: {
    amenity?: string;
    building?: string;
    shop?: string;
    tourism?: string;
    restaurant?: string;
    cafe?: string;
    pub?: string;
    road?: string;
    house_number?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  type?: string;
  lat: string;
  lon: string;
}

/**
 * Reverse geocodes coordinates to get place information
 *
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 * Rate limit: 1 request per second
 *
 * @param coordinates - The lat/lng coordinates to reverse geocode
 * @returns Place information or null if geocoding fails
 */
export async function reverseGeocode(
  coordinates: Coordinates
): Promise<PlaceInfo | null> {
  try {
    const { lat, lng } = coordinates;

    // Nominatim reverse geocoding endpoint
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('lat', lat.toString());
    url.searchParams.set('lon', lng.toString());
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('zoom', '18'); // Higher zoom for more precise results

    // Make request with proper headers
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Matchbook/1.0 (Personal place organizer)',
      },
    });

    if (!response.ok) {
      console.error('Nominatim API error:', response.status, response.statusText);
      return null;
    }

    const data: NominatimResponse = await response.json();

    // Extract place name (try various fields)
    const name =
      data.name ||
      data.address?.amenity ||
      data.address?.building ||
      data.address?.shop ||
      data.address?.tourism ||
      data.address?.restaurant ||
      data.address?.cafe ||
      data.address?.pub ||
      'Unnamed Place';

    // Build formatted address
    const addressParts: string[] = [];

    if (data.address) {
      const addr = data.address;

      // Add house number and road
      if (addr.house_number && addr.road) {
        addressParts.push(`${addr.house_number} ${addr.road}`);
      } else if (addr.road) {
        addressParts.push(addr.road);
      }

      // Add suburb/neighborhood
      if (addr.suburb) {
        addressParts.push(addr.suburb);
      }

      // Add city/town
      const locality = addr.city || addr.town || addr.village;
      if (locality) {
        addressParts.push(locality);
      }

      // Add postcode
      if (addr.postcode) {
        addressParts.push(addr.postcode);
      }

      // Add country
      if (addr.country) {
        addressParts.push(addr.country);
      }
    }

    const address = addressParts.length > 0 ? addressParts.join(', ') : data.display_name;

    return {
      name,
      address,
      displayName: data.display_name,
      lat: parseFloat(data.lat),
      lng: parseFloat(data.lon),
      placeType: data.type,
      city: data.address?.city || data.address?.town || data.address?.village,
      country: data.address?.country,
    };
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
}

/**
 * Forward geocodes an address string to get coordinates
 *
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 * Rate limit: 1 request per second
 *
 * @param address - The address string to geocode
 * @returns Coordinates and place info or null if geocoding fails
 */
export async function forwardGeocode(
  address: string
): Promise<PlaceInfo | null> {
  try {
    // Nominatim search endpoint
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', address);
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('limit', '1'); // Only get the best result

    // Make request with proper headers
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Matchbook/1.0 (Personal place organizer)',
      },
    });

    if (!response.ok) {
      console.error('Nominatim API error:', response.status, response.statusText);
      return null;
    }

    const data: NominatimResponse[] = await response.json();

    if (!data || data.length === 0) {
      console.warn('No geocoding results found for address:', address);
      return null;
    }

    const result = data[0];

    // Extract place name
    const name =
      result.name ||
      result.address?.amenity ||
      result.address?.building ||
      address.split(',')[0].trim();

    // Build formatted address
    const addressParts: string[] = [];

    if (result.address) {
      const addr = result.address;

      if (addr.house_number && addr.road) {
        addressParts.push(`${addr.house_number} ${addr.road}`);
      } else if (addr.road) {
        addressParts.push(addr.road);
      }

      if (addr.suburb) {
        addressParts.push(addr.suburb);
      }

      const locality = addr.city || addr.town || addr.village;
      if (locality) {
        addressParts.push(locality);
      }

      if (addr.postcode) {
        addressParts.push(addr.postcode);
      }

      if (addr.country) {
        addressParts.push(addr.country);
      }
    }

    const formattedAddress =
      addressParts.length > 0 ? addressParts.join(', ') : result.display_name;

    return {
      name,
      address: formattedAddress,
      displayName: result.display_name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      placeType: result.type,
      city: result.address?.city || result.address?.town || result.address?.village,
      country: result.address?.country,
    };
  } catch (error) {
    console.error('Error forward geocoding:', error);
    return null;
  }
}

/**
 * Delay helper to respect Nominatim rate limiting (1 req/sec)
 * @param ms - Milliseconds to delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
