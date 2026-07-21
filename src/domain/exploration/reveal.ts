/**
 * The reveal engine: turning a location fix into newly-uncovered fog cells.
 *
 * This is deliberately pure — it takes the set of already-known cells and a
 * point, and returns which cells are *newly* revealed. It never mutates state
 * or touches storage; the caller decides what to persist. That makes the core
 * "walk → unfog" behaviour trivial to unit-test with hand-written points.
 */
import {
  GOOD_ACCURACY_METERS,
  MAX_ACCEPTABLE_ACCURACY_METERS,
  REVEAL_RESOLUTION,
  REVEAL_RING_SIZE,
} from '@/config/constants';

import { cellsAround } from '@/domain/geo/grid';
import type { GeoPoint, H3Index, H3Resolution } from '@/domain/geo/types';

export interface RevealOptions {
  readonly resolution: H3Resolution;
  /** Rings revealed around a good-accuracy fix. */
  readonly ringSize: number;
  /** Fixes better (smaller) than this accuracy get the full ring. */
  readonly goodAccuracyMeters: number;
  /** Fixes worse than this accuracy are rejected entirely. */
  readonly maxAccuracyMeters: number;
}

export const DEFAULT_REVEAL_OPTIONS: RevealOptions = {
  resolution: REVEAL_RESOLUTION,
  ringSize: REVEAL_RING_SIZE,
  goodAccuracyMeters: GOOD_ACCURACY_METERS,
  maxAccuracyMeters: MAX_ACCEPTABLE_ACCURACY_METERS,
};

export interface RevealResult {
  /** Cells revealed for the first time by this fix (empty if none). */
  readonly newCells: H3Index[];
  /** Candidate cells that were already known. */
  readonly alreadyKnown: H3Index[];
  /** True if the fix was rejected for being too inaccurate. */
  readonly rejected: boolean;
}

const EMPTY_RESULT: RevealResult = { newCells: [], alreadyKnown: [], rejected: false };

/**
 * Computes the cells a single fix would reveal, given what is already known.
 *
 * Accuracy gating is a core reliability feature: a wildly inaccurate fix must
 * not paint fog the user never actually visited (a common complaint about the
 * originals). Poor-but-usable fixes reveal only the centre cell; good fixes
 * reveal a generous ring.
 */
export function revealAt(
  knownCells: ReadonlySet<H3Index>,
  point: GeoPoint,
  options: RevealOptions = DEFAULT_REVEAL_OPTIONS,
): RevealResult {
  const accuracy = point.accuracy;
  if (accuracy !== undefined && accuracy > options.maxAccuracyMeters) {
    return { ...EMPTY_RESULT, rejected: true };
  }

  const useRing =
    accuracy === undefined || accuracy <= options.goodAccuracyMeters ? options.ringSize : 0;
  const candidates = cellsAround(point, useRing, options.resolution);

  const newCells: H3Index[] = [];
  const alreadyKnown: H3Index[] = [];
  for (const cell of candidates) {
    if (knownCells.has(cell)) {
      alreadyKnown.push(cell);
    } else {
      newCells.push(cell);
    }
  }
  return { newCells, alreadyKnown, rejected: false };
}
