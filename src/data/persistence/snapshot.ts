/**
 * Serialisation between the live PlayerState (which uses Sets and Maps) and a
 * flat, JSON/SQLite-friendly PlayerSnapshot.
 *
 * Revealed cells are deliberately *not* part of the snapshot: there can be
 * hundreds of thousands of them, so they live in their own append-only store
 * (RevealRepository) and are rehydrated separately. This keeps the snapshot
 * small and cheap to write on every change.
 */
import type { GeoPoint, H3Index } from '@/domain/geo/types';
import type { PlayerState, RegionTally } from '@/domain/loop/state';
import type { PlayerStats } from '@/domain/player/stats';
import type { StreakState } from '@/domain/progression/streak';

export interface PlayerSnapshot {
  readonly playerId: string;
  readonly displayName: string;
  readonly regions: readonly RegionTally[];
  readonly stats: PlayerStats;
  readonly streak: StreakState;
  readonly unlockedAchievements: readonly string[];
  readonly lastPoint: GeoPoint | null;
}

/** Flattens a PlayerState into a storable snapshot (minus revealed cells). */
export function toSnapshot(state: PlayerState): PlayerSnapshot {
  return {
    playerId: state.playerId,
    displayName: state.displayName,
    regions: [...state.regions.values()],
    stats: state.stats,
    streak: state.streak,
    unlockedAchievements: [...state.unlockedAchievements],
    lastPoint: state.lastPoint,
  };
}

/** Rebuilds a PlayerState from a snapshot and a separately-loaded cell set. */
export function fromSnapshot(
  snapshot: PlayerSnapshot,
  revealedCells: ReadonlySet<H3Index>,
): PlayerState {
  const regions = new Map<string, RegionTally>();
  for (const tally of snapshot.regions) {
    regions.set(tally.ref.id, tally);
  }
  return {
    playerId: snapshot.playerId,
    displayName: snapshot.displayName,
    revealedCells,
    regions,
    stats: snapshot.stats,
    streak: snapshot.streak,
    unlockedAchievements: new Set(snapshot.unlockedAchievements),
    lastPoint: snapshot.lastPoint,
  };
}
