/**
 * PlayerStats — the aggregate scoreboard the rest of the game reads from.
 *
 * This is the single source of truth for "how much has this player explored".
 * Achievements evaluate against it, leaderboards rank on it, and the stats
 * dashboard renders it. Every field is a running total so it can be updated
 * incrementally as fixes arrive, without recomputing from full history.
 */
export interface PlayerStats {
  /** Distinct hexagons ever revealed. */
  readonly cellsRevealed: number;
  /** Total distance travelled while tracking, in metres. */
  readonly distanceMeters: number;
  /** Distinct countries touched. */
  readonly countriesVisited: number;
  /** Distinct sub-national regions (states/provinces) touched. */
  readonly regionsVisited: number;
  /** Distinct cities touched. */
  readonly citiesVisited: number;
  /** Current consecutive-day streak. */
  readonly currentStreakDays: number;
  /** Best streak ever achieved. */
  readonly longestStreakDays: number;
  /** Distinct calendar days the player was active. */
  readonly activeDays: number;
  /** Lifetime XP. */
  readonly totalXp: number;
  /** Current level (derived from totalXp, cached here for cheap reads). */
  readonly level: number;
}

export const INITIAL_STATS: PlayerStats = {
  cellsRevealed: 0,
  distanceMeters: 0,
  countriesVisited: 0,
  regionsVisited: 0,
  citiesVisited: 0,
  currentStreakDays: 0,
  longestStreakDays: 0,
  activeDays: 0,
  totalXp: 0,
  level: 1,
};
