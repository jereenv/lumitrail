/**
 * A bounding-box region resolver.
 *
 * This is a real, working resolver used by the demo and tests: it matches a
 * coordinate against a seed list of axis-aligned bounding boxes. It is
 * intentionally simple and honest about its limits — bounding boxes overlap and
 * ignore coastlines. Production swaps in a `PolygonRegionResolver` backed by a
 * bundled Natural Earth dataset with the same `RegionResolver` interface, so no
 * calling code changes. See ARCHITECTURE.md § Region resolution.
 */
import type { Coordinates } from '@/domain/geo/types';
import type { MapRegion } from '@/domain/geo/fog';

import type { RegionPath, RegionRef, RegionResolver } from './types';

interface BoundingBox {
  readonly minLat: number;
  readonly maxLat: number;
  readonly minLng: number;
  readonly maxLng: number;
}

interface SeedEntry {
  readonly ref: RegionRef;
  readonly box: BoundingBox;
  /** More specific entries (cities) should win over broader ones (countries). */
  readonly parentCountryId?: string;
  readonly parentRegionId?: string;
}

function contains(box: BoundingBox, c: Coordinates): boolean {
  return (
    c.latitude >= box.minLat &&
    c.latitude <= box.maxLat &&
    c.longitude >= box.minLng &&
    c.longitude <= box.maxLng
  );
}

/**
 * Seed dataset. Country target-cell counts are order-of-magnitude estimates of
 * land cells at res 9; city counts are smaller. These power the demo and tests;
 * they are not authoritative geography.
 */
const SEED: readonly SeedEntry[] = [
  {
    ref: { id: 'SE', name: 'Sweden', kind: 'country', targetCells: 4_500_000 },
    box: { minLat: 55.0, maxLat: 69.1, minLng: 10.9, maxLng: 24.2 },
  },
  {
    ref: { id: 'SE-AB', name: 'Stockholm County', kind: 'region', targetCells: 68_000 },
    box: { minLat: 58.8, maxLat: 60.2, minLng: 17.0, maxLng: 19.1 },
    parentCountryId: 'SE',
  },
  {
    ref: { id: 'SE-STHLM', name: 'Stockholm', kind: 'city', targetCells: 1_800 },
    box: { minLat: 59.24, maxLat: 59.43, minLng: 17.9, maxLng: 18.2 },
    parentCountryId: 'SE',
    parentRegionId: 'SE-AB',
  },
  {
    ref: { id: 'GB', name: 'United Kingdom', kind: 'country', targetCells: 2_400_000 },
    box: { minLat: 49.9, maxLat: 58.7, minLng: -8.2, maxLng: 1.8 },
  },
  {
    ref: { id: 'GB-LDN', name: 'London', kind: 'city', targetCells: 15_000 },
    box: { minLat: 51.28, maxLat: 51.69, minLng: -0.51, maxLng: 0.33 },
    parentCountryId: 'GB',
  },
  {
    ref: { id: 'US', name: 'United States', kind: 'country', targetCells: 90_000_000 },
    box: { minLat: 24.4, maxLat: 49.4, minLng: -125.0, maxLng: -66.9 },
  },
  {
    ref: { id: 'US-NYC', name: 'New York City', kind: 'city', targetCells: 12_000 },
    box: { minLat: 40.49, maxLat: 40.92, minLng: -74.26, maxLng: -73.7 },
    parentCountryId: 'US',
  },
];

const SPAN_PADDING = 1.15;
const MIN_SPAN_DEG = 0.02;

/**
 * Centre + span of a seeded region, suitable for `animateToRegion`. Returns
 * null when the id is not in the seed set. Coarse (bounding-box) but good
 * enough to fly the map to a region tapped in the Journey screen.
 */
export function regionCenter(id: string): MapRegion | null {
  const entry = SEED.find((e) => e.ref.id === id);
  if (!entry) return null;
  const { minLat, maxLat, minLng, maxLng } = entry.box;
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(MIN_SPAN_DEG, (maxLat - minLat) * SPAN_PADDING),
    longitudeDelta: Math.max(MIN_SPAN_DEG, (maxLng - minLng) * SPAN_PADDING),
  };
}

export class BoundingBoxRegionResolver implements RegionResolver {
  private readonly seed: readonly SeedEntry[];

  constructor(seed: readonly SeedEntry[] = SEED) {
    this.seed = seed;
  }

  resolve(coords: Coordinates): RegionPath {
    const matches = this.seed.filter((entry) => contains(entry.box, coords));
    const path: {
      country?: RegionRef;
      region?: RegionRef;
      city?: RegionRef;
    } = {};

    for (const entry of matches) {
      if (entry.ref.kind === 'country') {
        path.country = entry.ref;
      } else if (entry.ref.kind === 'region') {
        path.region = entry.ref;
      } else {
        path.city = entry.ref;
      }
    }
    return path;
  }
}

/** Convenience singleton for the demo and default wiring. */
export const defaultRegionResolver: RegionResolver = new BoundingBoxRegionResolver();
