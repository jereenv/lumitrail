/**
 * Daily streak logic.
 *
 * Streaks are one of the strongest retention levers (Duolingo, Snapchat), so we
 * model them carefully. The unit is a "day ordinal" — an integer count of local
 * days since the Unix epoch — which sidesteps timezone and DST hazards in the
 * comparison logic: all the branching happens on plain integers.
 */

const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 86_400_000;

/**
 * Converts an epoch-millisecond timestamp to a local day ordinal.
 *
 * `tzOffsetMinutes` is the offset to add to UTC to get local time (e.g. -420
 * for UTC-7). Two timestamps on the same local calendar day yield the same
 * ordinal regardless of the time of day.
 */
export function dayOrdinal(timestampMs: number, tzOffsetMinutes: number): number {
  return Math.floor((timestampMs + tzOffsetMinutes * MS_PER_MINUTE) / MS_PER_DAY);
}

export interface StreakState {
  readonly currentStreak: number;
  readonly longestStreak: number;
  /** Day ordinal of the most recent active day, or null if never active. */
  readonly lastActiveDay: number | null;
}

export const INITIAL_STREAK: StreakState = {
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDay: null,
};

export interface StreakUpdate {
  readonly state: StreakState;
  /**
   * The streak length awarded *today*, or 0 if today was already counted.
   * Callers use this to decide whether to grant streak XP (once per day).
   */
  readonly awardedStreakDay: number;
}

/**
 * Records activity on `today` (a day ordinal) and returns the new streak state.
 *
 * - Same day as last active  → no change, nothing awarded.
 * - Exactly one day later     → streak extends by one.
 * - A gap of two or more days → streak resets to one (today counts).
 */
export function recordActiveDay(prev: StreakState, today: number): StreakUpdate {
  if (prev.lastActiveDay === today) {
    return { state: prev, awardedStreakDay: 0 };
  }

  const isConsecutive = prev.lastActiveDay !== null && today === prev.lastActiveDay + 1;
  const currentStreak = isConsecutive ? prev.currentStreak + 1 : 1;
  const longestStreak = Math.max(prev.longestStreak, currentStreak);

  return {
    state: { currentStreak, longestStreak, lastActiveDay: today },
    awardedStreakDay: currentStreak,
  };
}
