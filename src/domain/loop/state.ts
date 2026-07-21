/**
 * PlayerState — the full in-memory aggregate the game loop transitions.
 *
 * It is a plain, serialisable object (Sets/Maps aside) that the data layer
 * hydrates from storage and persists back. Keeping it separate from the loop
 * logic lets tests construct precise starting states.
 */
import type { GeoPoint, H3Index } from '@/domain/geo/types';
import { INITIAL_STATS, type PlayerStats } from '@/domain/player/stats';
import { INITIAL_STREAK, type StreakState } from '@/domain/progression/streak';
import type { RegionRef } from '@/domain/regions/types';

export interface RegionTally {
  readonly ref: RegionRef;
  readonly revealedCells: number;
}

export interface PlayerState {
  readonly playerId: string;
  readonly displayName: string;
  /** Every revealed cell. Backed durably by the repository. */
  readonly revealedCells: ReadonlySet<H3Index>;
  /** Per-region revealed-cell tallies, keyed by region id (all kinds). */
  readonly regions: ReadonlyMap<string, RegionTally>;
  readonly stats: PlayerStats;
  readonly streak: StreakState;
  readonly unlockedAchievements: ReadonlySet<string>;
  /** Previous accepted fix, for distance computation. */
  readonly lastPoint: GeoPoint | null;
}

export function createPlayerState(playerId: string, displayName: string): PlayerState {
  return {
    playerId,
    displayName,
    revealedCells: new Set<H3Index>(),
    regions: new Map<string, RegionTally>(),
    stats: INITIAL_STATS,
    streak: INITIAL_STREAK,
    unlockedAchievements: new Set<string>(),
    lastPoint: null,
  };
}
