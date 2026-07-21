/**
 * Level curve — mapping cumulative XP to a level and progress bar.
 *
 * Design: the cost to advance from level L to L+1 is `LEVEL_BASE_XP * L`, so
 * the cumulative XP required to *reach* level L is a closed-form quadratic:
 *
 *   xpToReachLevel(L) = LEVEL_BASE_XP * (L - 1) * L / 2
 *
 * Early levels arrive quickly (a satisfying onboarding), while later levels
 * require progressively more real-world exploration. Because the formula is
 * closed-form we can invert it directly instead of looping.
 */
import { LEVEL_BASE_XP } from '@/config/constants';

/** Cumulative XP required to reach the start of `level` (level 1 = 0 XP). */
export function xpToReachLevel(level: number): number {
  if (level <= 1) {
    return 0;
  }
  return (LEVEL_BASE_XP * (level - 1) * level) / 2;
}

export interface LevelProgress {
  /** Current level (starts at 1). */
  readonly level: number;
  /** Total lifetime XP this progress was derived from. */
  readonly totalXp: number;
  /** XP earned since the start of the current level. */
  readonly xpIntoLevel: number;
  /** XP needed to span the current level (from this level to the next). */
  readonly xpForLevelSpan: number;
  /** Fraction [0, 1] of the way to the next level. */
  readonly progress: number;
  /** XP still required to reach the next level. */
  readonly xpToNextLevel: number;
}

/**
 * Derives level and progress from a total XP value by inverting the quadratic.
 *
 * Solving `base * (L-1) * L / 2 <= xp` for the largest integer L gives, via the
 * quadratic formula, `L = floor((1 + sqrt(1 + 8 * xp / base)) / 2)`.
 */
export function levelForXp(totalXp: number): LevelProgress {
  const xp = Math.max(0, Math.floor(totalXp));
  const level = Math.max(1, Math.floor((1 + Math.sqrt(1 + (8 * xp) / LEVEL_BASE_XP)) / 2));

  const levelStart = xpToReachLevel(level);
  const nextLevelStart = xpToReachLevel(level + 1);
  const xpForLevelSpan = nextLevelStart - levelStart;
  const xpIntoLevel = xp - levelStart;
  const xpToNextLevel = nextLevelStart - xp;
  const progress = xpForLevelSpan === 0 ? 0 : xpIntoLevel / xpForLevelSpan;

  return {
    level,
    totalXp: xp,
    xpIntoLevel,
    xpForLevelSpan,
    progress,
    xpToNextLevel,
  };
}
