/**
 * Fog-overlay geometry — the pure math behind rendering fog-of-war on a real map.
 *
 * The map SDK draws the basemap (streets, labels) and owns the projection. On
 * top of it we draw ONE dark polygon covering the viewport and punch a HOLE for
 * every explored area, so the real streets show through where you've been. This
 * module computes those holes from the set of revealed H3 cells — with zero
 * dependency on React Native or the map SDK, so it is fully unit-testable.
 *
 * Merging is done with h3's `cellsToMultiPolygon`, which dissolves the shared
 * edges between adjacent hexagons into a single smooth outline (and yields inner
 * rings for any unexplored pockets fully surrounded by explored cells — those
 * become "fog islands" drawn back on top).
 */
import { cellsToMultiPolygon } from 'h3-js';

import { cellCenter } from './grid';
import type { Coordinates, H3Index } from './types';

/** A closed-ish ring of coordinates (the map SDK auto-closes it). */
export type Ring = Coordinates[];

/**
 * Average area of an H3 resolution-9 cell in km². H3 res-9 cells vary only
 * slightly with latitude, so a constant is accurate enough for HUD readouts and
 * avoids an h3 call per cell. (Earth res-9 average ≈ 0.105 km².)
 */
export const RES9_CELL_AREA_KM2 = 0.105;

const KM_PER_DEG_LAT = 110.574;
const KM_PER_DEG_LNG_AT_EQUATOR = 111.32;

export interface FogGeometry {
  /** Outlines of explored areas — each becomes a hole in the fog polygon. */
  readonly revealedOutlines: Ring[];
  /** Unexplored pockets surrounded by explored area — drawn as fog on top. */
  readonly fogIslands: Ring[];
}

function toCoordinates(loop: number[][]): Ring {
  return loop.map(([latitude, longitude]) => ({
    latitude: latitude ?? 0,
    longitude: longitude ?? 0,
  }));
}

/**
 * Dissolves a set of revealed cells into smooth merged outlines. Contiguous
 * hexagons merge into one outline; a hole in the explored area yields a fog
 * island.
 */
export function computeFogGeometry(cells: readonly H3Index[]): FogGeometry {
  if (cells.length === 0) {
    return { revealedOutlines: [], fogIslands: [] };
  }
  // h3 returns [lat, lng] loops: loop[0] is the outer ring, the rest are holes.
  const multiPolygon = cellsToMultiPolygon(cells as H3Index[]);
  const revealedOutlines: Ring[] = [];
  const fogIslands: Ring[] = [];
  for (const polygon of multiPolygon) {
    polygon.forEach((loop, index) => {
      if (index === 0) {
        revealedOutlines.push(toCoordinates(loop));
      } else {
        fogIslands.push(toCoordinates(loop));
      }
    });
  }
  return { revealedOutlines, fogIslands };
}

/** Filters revealed cells to those whose centre falls inside a lat/lng box. */
export function revealedCellsInBounds(
  cells: readonly H3Index[],
  sw: Coordinates,
  ne: Coordinates,
): H3Index[] {
  const result: H3Index[] = [];
  for (const cell of cells) {
    const c = cellCenter(cell);
    if (
      c.latitude >= sw.latitude &&
      c.latitude <= ne.latitude &&
      c.longitude >= sw.longitude &&
      c.longitude <= ne.longitude
    ) {
      result.push(cell);
    }
  }
  return result;
}

/** Approximate area of a lat/lng bounding box in km² (small-box flat-earth). */
export function boundingBoxAreaKm2(sw: Coordinates, ne: Coordinates): number {
  const midLat = (sw.latitude + ne.latitude) / 2;
  const heightKm = Math.max(0, ne.latitude - sw.latitude) * KM_PER_DEG_LAT;
  const widthKm =
    Math.max(0, ne.longitude - sw.longitude) *
    KM_PER_DEG_LNG_AT_EQUATOR *
    Math.cos((midLat * Math.PI) / 180);
  return heightKm * widthKm;
}

/** Estimated number of res-9 cells needed to tile a bounding box (min 1). */
export function estimateCellsInBounds(sw: Coordinates, ne: Coordinates): number {
  return Math.max(1, Math.round(boundingBoxAreaKm2(sw, ne) / RES9_CELL_AREA_KM2));
}

/** Percentage of the visible area that has been uncovered, clamped to [0, 100]. */
export function viewExploredPercent(exploredInView: number, estimatedTotalInView: number): number {
  if (estimatedTotalInView <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, (exploredInView / estimatedTotalInView) * 100));
}

/** Approximate lifetime area covered, in km², from a revealed-cell count. */
export function approximateAreaKm2(cellCount: number): number {
  return Math.max(0, cellCount) * RES9_CELL_AREA_KM2;
}

/** A map viewport: centre + span, matching the map SDK's Region shape. */
export interface MapRegion {
  readonly latitude: number;
  readonly longitude: number;
  readonly latitudeDelta: number;
  readonly longitudeDelta: number;
}

export interface FogOverlay {
  /** Outer ring of the fog polygon (covers the viewport with a margin). */
  readonly outer: Ring;
  /** Holes punched in the fog, revealing the basemap where explored. */
  readonly holes: Ring[];
  /** Fog islands drawn on top (unexplored pockets inside explored areas). */
  readonly islands: Ring[];
  /** Revealed cells within the (expanded) viewport. */
  readonly exploredInView: number;
  /** Estimated total cells that would tile the (expanded) viewport. */
  readonly estimatedCellsInView: number;
}

/** How much larger than the visible region the fog polygon is drawn. */
const VIEWPORT_MARGIN = 1.2;

/**
 * Builds everything the map needs to render the fog overlay for a viewport:
 * the outer polygon, the holes (explored outlines), fog islands, and the
 * explored-vs-total counts for the "% uncovered" HUD.
 */
export function buildFogOverlay(region: MapRegion, cells: readonly H3Index[]): FogOverlay {
  const halfLat = (region.latitudeDelta / 2) * VIEWPORT_MARGIN;
  const halfLng = (region.longitudeDelta / 2) * VIEWPORT_MARGIN;
  const sw: Coordinates = {
    latitude: region.latitude - halfLat,
    longitude: region.longitude - halfLng,
  };
  const ne: Coordinates = {
    latitude: region.latitude + halfLat,
    longitude: region.longitude + halfLng,
  };

  const outer: Ring = [
    { latitude: ne.latitude, longitude: sw.longitude },
    { latitude: ne.latitude, longitude: ne.longitude },
    { latitude: sw.latitude, longitude: ne.longitude },
    { latitude: sw.latitude, longitude: sw.longitude },
  ];

  const inView = revealedCellsInBounds(cells, sw, ne);
  const geometry = computeFogGeometry(inView);

  return {
    outer,
    holes: geometry.revealedOutlines,
    islands: geometry.fogIslands,
    exploredInView: inView.length,
    estimatedCellsInView: estimateCellsInBounds(sw, ne),
  };
}
