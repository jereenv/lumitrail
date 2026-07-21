/**
 * XP calculation — how exploration converts into experience points.
 *
 * Pure functions, one per XP source, plus a combinator. Splitting them out
 * keeps each rule independently testable and lets the UI attribute XP to a
 * source ("+40 XP for 1 km walked").
 */
import {
  MAX_TRAVEL_SEGMENT_METERS,
  STREAK_MULTIPLIER_CAP,
  XP_PER_100M,
  XP_PER_NEW_CELL,
  XP_STREAK_DAY_BASE,
} from '@/config/constants';

import { pathLengthMeters } from '@/domain/geo/grid';
import type { GeoPoint } from '@/domain/geo/types';

/** XP for discovering `count` brand-new cells. */
export function xpForNewCells(count: number): number {
  return Math.max(0, Math.floor(count)) * XP_PER_NEW_CELL;
}

/** XP for `meters` of travel, awarded per completed 100 m. */
export function xpForDistance(meters: number): number {
  if (!Number.isFinite(meters) || meters <= 0) {
    return 0;
  }
  return Math.floor(meters / 100) * XP_PER_100M;
}

/** Convenience: distance XP for a full path of fixes (teleports excluded). */
export function xpForPath(points: readonly GeoPoint[]): number {
  return xpForDistance(pathLengthMeters(points, MAX_TRAVEL_SEGMENT_METERS));
}

/**
 * XP for extending a daily streak to `streakDays`. Longer streaks pay more, up
 * to a cap so the reward stays bounded.
 */
export function xpForStreakDay(streakDays: number): number {
  if (streakDays <= 0) {
    return 0;
  }
  const multiplier = Math.min(streakDays, STREAK_MULTIPLIER_CAP);
  return XP_STREAK_DAY_BASE * multiplier;
}

export interface XpBreakdown {
  readonly fromCells: number;
  readonly fromDistance: number;
  readonly fromStreak: number;
  readonly total: number;
}

/** Combines every XP source for a single game-loop tick into one breakdown. */
export function combineXp(input: {
  newCellCount: number;
  distanceMeters: number;
  streakDayAwarded?: number;
}): XpBreakdown {
  const fromCells = xpForNewCells(input.newCellCount);
  const fromDistance = xpForDistance(input.distanceMeters);
  const fromStreak = input.streakDayAwarded ? xpForStreakDay(input.streakDayAwarded) : 0;
  return {
    fromCells,
    fromDistance,
    fromStreak,
    total: fromCells + fromDistance + fromStreak,
  };
}
