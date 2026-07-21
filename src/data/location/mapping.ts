/**
 * Converts Expo's LocationObject into our framework-free GeoPoint.
 *
 * Isolating this mapping keeps every other module ignorant of Expo's shape and
 * gives us one place to normalise units (Expo already reports metres and epoch
 * milliseconds, so it is a straight copy, but the boundary still belongs here).
 */
import type { LocationObject } from 'expo-location';

import type { GeoPoint } from '@/domain/geo/types';

export function geoPointFromLocation(location: LocationObject): GeoPoint {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy ?? undefined,
    timestamp: location.timestamp,
  };
}
