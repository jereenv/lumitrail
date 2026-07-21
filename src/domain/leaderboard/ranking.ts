/**
 * Leaderboard ranking — pure, metric-agnostic.
 *
 * Given a list of players' scores on a chosen metric, produce a ranked table.
 * The same function powers the global board and the friends-only board; the
 * caller just filters the input list first.
 */
import type { PlayerStats } from '@/domain/player/stats';

/** Any PlayerStats field that is a "higher is better" number can be ranked. */
export type LeaderboardMetric = Extract<
  keyof PlayerStats,
  'cellsRevealed' | 'distanceMeters' | 'countriesVisited' | 'totalXp' | 'longestStreakDays'
>;

export interface LeaderboardCandidate {
  readonly playerId: string;
  readonly displayName: string;
  readonly stats: PlayerStats;
}

export interface LeaderboardEntry {
  readonly rank: number;
  readonly playerId: string;
  readonly displayName: string;
  readonly value: number;
}

/**
 * Ranks candidates on `metric`, descending. Ties share a rank and the next
 * rank skips accordingly (standard competition ranking: 1, 2, 2, 4). Ordering
 * within a tie is stabilised by playerId so results are deterministic.
 */
export function rankBy(
  candidates: readonly LeaderboardCandidate[],
  metric: LeaderboardMetric,
): LeaderboardEntry[] {
  const sorted = [...candidates].sort((a, b) => {
    const diff = b.stats[metric] - a.stats[metric];
    if (diff !== 0) {
      return diff;
    }
    return a.playerId < b.playerId ? -1 : a.playerId > b.playerId ? 1 : 0;
  });

  const entries: LeaderboardEntry[] = [];
  let previousValue: number | null = null;
  let previousRank = 0;
  sorted.forEach((candidate, index) => {
    const value = candidate.stats[metric];
    const rank = previousValue !== null && value === previousValue ? previousRank : index + 1;
    entries.push({
      rank,
      playerId: candidate.playerId,
      displayName: candidate.displayName,
      value,
    });
    previousValue = value;
    previousRank = rank;
  });
  return entries;
}

/**
 * Restricts candidates to a player and their friends, then ranks them. Used for
 * the friends-only board.
 */
export function rankFriends(
  candidates: readonly LeaderboardCandidate[],
  metric: LeaderboardMetric,
  playerId: string,
  friendIds: ReadonlySet<string>,
): LeaderboardEntry[] {
  const circle = candidates.filter((c) => c.playerId === playerId || friendIds.has(c.playerId));
  return rankBy(circle, metric);
}
