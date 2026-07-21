/**
 * Exploration-percentage math.
 *
 * Completion is `revealedCells / targetCells`, clamped to [0, 100]. Per-region
 * revealed counts are maintained incrementally by the game loop (each newly
 * revealed cell increments the counts for whichever country/region/city its
 * centre falls in). This module holds the pure functions that turn those counts
 * into percentages and a worldwide roll-up.
 */
import type { RegionRef } from './types';

/**
 * Approximate number of land cells on Earth at REVEAL_RESOLUTION (res 9).
 * Earth's land area (~149M km²) divided by the ~0.105 km² area of a res-9 cell.
 * Used only as the worldwide-completion denominator; being an estimate is fine
 * because worldwide completion is a "chase forever" number by design.
 */
export const WORLD_LAND_CELLS = 1_400_000_000;

/** Clamps a completion percentage to a sane [0, 100] with fixed precision. */
export function explorationPercent(revealedCells: number, targetCells: number): number {
  if (targetCells <= 0) {
    return 0;
  }
  const pct = (revealedCells / targetCells) * 100;
  return Math.min(100, Math.max(0, pct));
}

export interface RegionCompletion {
  readonly region: RegionRef;
  readonly revealedCells: number;
  readonly percent: number;
  readonly complete: boolean;
}

/** Builds a completion record for a region given how many of its cells are revealed. */
export function regionCompletion(region: RegionRef, revealedCells: number): RegionCompletion {
  const percent = explorationPercent(revealedCells, region.targetCells);
  return {
    region,
    revealedCells,
    percent,
    complete: percent >= 100,
  };
}

/** Worldwide completion percentage from the total revealed-cell count. */
export function worldwidePercent(totalRevealedCells: number): number {
  return explorationPercent(totalRevealedCells, WORLD_LAND_CELLS);
}
