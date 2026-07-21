/**
 * Repository interfaces — the persistence contracts the app depends on.
 *
 * Splitting revealed cells (huge, append-only) from the player snapshot (small,
 * frequently overwritten) reflects how they are actually accessed and stored.
 * Both have an in-memory implementation (tests) and a SQLite one (device).
 */
import type { Coordinates, H3Index } from '@/domain/geo/types';

import type { PlayerSnapshot } from './snapshot';

/**
 * Stores the grow-only set of revealed cells. Modelled as a G-Set CRDT: the
 * only mutation is adding cells, which makes multi-device merge conflict-free
 * (see SyncEngine).
 */
export interface RevealRepository {
  /** Loads the full set of revealed cells into memory. */
  loadAll(): Promise<Set<H3Index>>;
  /** Adds cells; adding an existing cell is a no-op. Returns count actually added. */
  add(cells: readonly H3Index[]): Promise<number>;
  /** Total number of revealed cells. */
  count(): Promise<number>;
  /**
   * Cells whose centre falls within a lat/lng bounding box, for viewport
   * rendering. Keeps the map smooth regardless of total history size.
   */
  inBounds(sw: Coordinates, ne: Coordinates): Promise<H3Index[]>;
}

/** Stores the single local player's snapshot. */
export interface PlayerRepository {
  load(playerId: string): Promise<PlayerSnapshot | null>;
  save(snapshot: PlayerSnapshot): Promise<void>;
  /** Deletes all data for the player (privacy: "delete my data"). */
  clear(playerId: string): Promise<void>;
}
