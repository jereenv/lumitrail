/**
 * Region types for completion tracking.
 *
 * A place resolves to a hierarchy: city ⊂ region (state/province) ⊂ country.
 * Any level may be absent (e.g. a point in the open ocean resolves to nothing;
 * a rural point may have a country but no city).
 */
import type { Coordinates } from '@/domain/geo/types';

export type RegionKind = 'country' | 'region' | 'city';

export interface RegionRef {
  readonly id: string;
  readonly name: string;
  readonly kind: RegionKind;
  /**
   * Estimated number of revealable cells in this region at REVEAL_RESOLUTION,
   * used as the denominator for completion percentage. This is an approximation
   * (see ARCHITECTURE.md) — production bundles precomputed counts from a real
   * land-polygon dataset.
   */
  readonly targetCells: number;
}

export interface RegionPath {
  readonly country?: RegionRef;
  readonly region?: RegionRef;
  readonly city?: RegionRef;
}

/**
 * Resolves a coordinate to its region hierarchy. Implementations range from a
 * bounding-box seed (tests/demo) to a bundled offline polygon dataset
 * (production). Kept as an interface so the domain never hard-codes one.
 */
export interface RegionResolver {
  resolve(coords: Coordinates): RegionPath;
}
