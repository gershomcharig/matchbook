/**
 * Distance calculation utilities using the Haversine formula
 */

/**
 * Calculates the distance between two geographic coordinates using the Haversine formula
 *
 * @param lat1 - Latitude of the first point in degrees
 * @param lng1 - Longitude of the first point in degrees
 * @param lat2 - Latitude of the second point in degrees
 * @param lng2 - Longitude of the second point in degrees
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters

  const toRadians = (degrees: number) => degrees * (Math.PI / 180);

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
