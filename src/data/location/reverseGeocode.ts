/**
 * Turns a coordinate into a human locality name (e.g. "Richmond") for the
 * region banner. Wrapped behind a `Geocoder` interface so it is trivially
 * mockable in tests and decoupled from expo-location. The cached variant avoids
 * re-querying while the map pans within a small radius, and fails soft to the
 * last known locality so the banner never goes blank offline.
 */
export interface GeocodedAddress {
  city?: string | null;
  district?: string | null;
  subregion?: string | null;
  region?: string | null;
  name?: string | null;
}

export interface Geocoder {
  reverseGeocodeAsync(location: {
    latitude: number;
    longitude: number;
  }): Promise<GeocodedAddress[]>;
}

interface LatLng {
  latitude: number;
  longitude: number;
}

export function localityFromAddress(address: GeocodedAddress | undefined): string | null {
  if (address === undefined) return null;
  return (
    address.city ?? address.district ?? address.subregion ?? address.region ?? address.name ?? null
  );
}

/** Rough great-circle distance in metres (equirectangular approximation). */
function approxDistanceMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const x = toRad(b.longitude - a.longitude) * Math.cos(toRad((a.latitude + b.latitude) / 2));
  const y = toRad(b.latitude - a.latitude);
  return Math.sqrt(x * x + y * y) * R;
}

export function createCachedReverseGeocoder(
  geocoder: Geocoder,
  options: { minMoveMeters?: number } = {},
): (point: LatLng) => Promise<string | null> {
  const minMove = options.minMoveMeters ?? 500;
  let lastPoint: LatLng | null = null;
  let lastLocality: string | null = null;

  return async (point: LatLng): Promise<string | null> => {
    if (lastPoint !== null && approxDistanceMeters(lastPoint, point) < minMove) {
      return lastLocality;
    }
    try {
      const results = await geocoder.reverseGeocodeAsync({
        latitude: point.latitude,
        longitude: point.longitude,
      });
      lastLocality = localityFromAddress(results[0]);
      lastPoint = point;
      return lastLocality;
    } catch {
      return lastLocality;
    }
  };
}
