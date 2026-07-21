/**
 * Grid math — the bridge between raw coordinates and the discrete hexagonal
 * cells the game reasons about.
 *
 * Every function here is pure and wraps the `h3-js` library behind our own
 * types, so the rest of the domain never imports h3 directly. If we ever swap
 * the indexing scheme (e.g. to S2 cells), only this file changes.
 */
import {
  cellArea,
  cellToBoundary,
  cellToLatLng,
  greatCircleDistance,
  gridDisk,
  isValidCell,
  latLngToCell,
} from 'h3-js';

import { REVEAL_RESOLUTION } from '@/config/constants';

import type { Coordinates, GeoPoint, H3Index, H3Resolution } from './types';

/** Returns the H3 cell that contains the given point at the given resolution. */
export function cellForPoint(
  point: Coordinates,
  resolution: H3Resolution = REVEAL_RESOLUTION,
): H3Index {
  return latLngToCell(point.latitude, point.longitude, resolution);
}

/**
 * Returns the cell containing the point plus every cell within `ringSize` rings
 * of it (a filled hexagonal disc). `ringSize` 0 yields just the centre cell,
 * `ringSize` 1 yields 7 cells, `ringSize` 2 yields 19, and so on.
 */
export function cellsAround(
  point: Coordinates,
  ringSize: number,
  resolution: H3Resolution = REVEAL_RESOLUTION,
): H3Index[] {
  const centre = cellForPoint(point, resolution);
  if (ringSize <= 0) {
    return [centre];
  }
  return gridDisk(centre, ringSize);
}

/** Returns the geographic centre (lat/lng) of a cell. */
export function cellCenter(cell: H3Index): Coordinates {
  const [latitude, longitude] = cellToLatLng(cell);
  return { latitude, longitude };
}

/**
 * Returns the cell's boundary as a closed ring of coordinates, suitable for
 * drawing the hexagon as a map overlay or SVG polygon.
 */
export function cellPolygon(cell: H3Index): Coordinates[] {
  return cellToBoundary(cell).map(([latitude, longitude]) => ({ latitude, longitude }));
}

/** Area of a single cell in square kilometres. */
export function cellAreaKm2(cell: H3Index): number {
  return cellArea(cell, 'km2');
}

/** True if the string is a structurally valid H3 index. */
export function isValidH3(cell: string): cell is H3Index {
  return isValidCell(cell);
}

/**
 * Great-circle (haversine) distance between two points in metres.
 *
 * Used for distance-based XP and for rejecting "teleport" jumps between fixes.
 */
export function distanceMeters(a: Coordinates, b: Coordinates): number {
  return greatCircleDistance([a.latitude, a.longitude], [b.latitude, b.longitude], 'm');
}

/**
 * Total path length in metres for an ordered list of points, ignoring any
 * single segment longer than `maxSegmentMeters` (treated as a teleport rather
 * than real travel).
 */
export function pathLengthMeters(points: readonly GeoPoint[], maxSegmentMeters: number): number {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const curr = points[i];
    if (prev === undefined || curr === undefined) {
      continue;
    }
    const segment = distanceMeters(prev, curr);
    if (segment <= maxSegmentMeters) {
      total += segment;
    }
  }
  return total;
}
