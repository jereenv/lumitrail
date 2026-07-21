/**
 * applyFix — the single pure transition at the heart of Lumitrail.
 *
 * Given the current PlayerState and one location fix, it computes everything
 * that fix causes — newly revealed cells, region tallies, distance, streak, XP,
 * level-ups, and achievement unlocks — and returns a *new* PlayerState plus the
 * list of domain events that occurred. It performs no I/O and mutates nothing
 * it was given, which is exactly why the full game loop can be tested with a
 * handful of hand-written points and no device.
 */
import { MAX_TRAVEL_SEGMENT_METERS } from '@/config/constants';

import { evaluateAchievements } from '@/domain/achievements/catalog';
import { DEFAULT_REVEAL_OPTIONS, revealAt, type RevealOptions } from '@/domain/exploration/reveal';
import { cellCenter, distanceMeters } from '@/domain/geo/grid';
import type { GeoPoint, H3Index } from '@/domain/geo/types';
import { levelForXp } from '@/domain/progression/levels';
import { dayOrdinal, recordActiveDay } from '@/domain/progression/streak';
import { combineXp } from '@/domain/progression/xp';
import { explorationPercent } from '@/domain/regions/exploration';
import type { RegionRef, RegionResolver } from '@/domain/regions/types';

import type { DomainEvent } from './events';
import type { PlayerState, RegionTally } from './state';

export interface FixContext {
  readonly resolver: RegionResolver;
  /** Local-time offset (minutes to add to UTC) for streak day bucketing. */
  readonly tzOffsetMinutes: number;
  readonly revealOptions?: RevealOptions;
}

export interface FixResult {
  readonly state: PlayerState;
  readonly events: DomainEvent[];
}

/** Increments per-region tallies for the regions a cell centre falls in. */
function tallyRegionsForCell(
  cell: H3Index,
  resolver: RegionResolver,
  working: Map<string, RegionTally>,
): void {
  const path = resolver.resolve(cellCenter(cell));
  const refs: (RegionRef | undefined)[] = [path.country, path.region, path.city];
  for (const ref of refs) {
    if (ref === undefined) {
      continue;
    }
    const existing = working.get(ref.id);
    working.set(ref.id, {
      ref,
      revealedCells: (existing?.revealedCells ?? 0) + 1,
    });
  }
}

function countByKind(regions: ReadonlyMap<string, RegionTally>, kind: RegionRef['kind']): number {
  let count = 0;
  for (const tally of regions.values()) {
    if (tally.ref.kind === kind) {
      count += 1;
    }
  }
  return count;
}

export function applyFix(state: PlayerState, point: GeoPoint, ctx: FixContext): FixResult {
  const options = ctx.revealOptions ?? DEFAULT_REVEAL_OPTIONS;
  const events: DomainEvent[] = [];

  const reveal = revealAt(state.revealedCells, point, options);
  if (reveal.rejected) {
    return { state, events: [{ type: 'fixRejected', reason: 'inaccurate' }] };
  }

  // 1. Distance travelled since the last accepted fix (teleports excluded).
  let segmentMeters = 0;
  if (state.lastPoint !== null) {
    const d = distanceMeters(state.lastPoint, point);
    if (d <= MAX_TRAVEL_SEGMENT_METERS) {
      segmentMeters = d;
    }
  }

  // 2. Fold newly revealed cells into the known set and per-region tallies,
  //    capturing which regions cross 100% for completion events.
  const revealedCells = new Set(state.revealedCells);
  const regions = new Map(state.regions);
  const beforePercent = new Map<string, number>();
  for (const cell of reveal.newCells) {
    revealedCells.add(cell);
    // Snapshot pre-increment percentages once per touched region.
    const path = ctx.resolver.resolve(cellCenter(cell));
    for (const ref of [path.country, path.region, path.city]) {
      if (ref && !beforePercent.has(ref.id)) {
        const current = regions.get(ref.id)?.revealedCells ?? 0;
        beforePercent.set(ref.id, explorationPercent(current, ref.targetCells));
      }
    }
    tallyRegionsForCell(cell, ctx.resolver, regions);
  }
  if (reveal.newCells.length > 0) {
    events.push({ type: 'cellsRevealed', cells: reveal.newCells });
  }

  // 3. Streak (only when the fix carries a timestamp).
  let streak = state.streak;
  let awardedStreakDay = 0;
  let activeDays = state.stats.activeDays;
  if (point.timestamp !== undefined) {
    const today = dayOrdinal(point.timestamp, ctx.tzOffsetMinutes);
    const update = recordActiveDay(streak, today);
    streak = update.state;
    awardedStreakDay = update.awardedStreakDay;
    if (awardedStreakDay > 0) {
      activeDays += 1;
      events.push({ type: 'streakExtended', days: streak.currentStreak });
    }
  }

  // 4. XP from all sources this tick.
  const xp = combineXp({
    newCellCount: reveal.newCells.length,
    distanceMeters: segmentMeters,
    streakDayAwarded: awardedStreakDay,
  });
  if (xp.total > 0) {
    events.push({ type: 'xpGained', breakdown: xp });
  }

  // 5. Recompute derived stats and detect a level-up.
  const previousLevel = state.stats.level;
  const totalXp = state.stats.totalXp + xp.total;
  const level = levelForXp(totalXp).level;
  if (level > previousLevel) {
    events.push({ type: 'leveledUp', from: previousLevel, to: level });
  }

  const nextStats = {
    cellsRevealed: state.stats.cellsRevealed + reveal.newCells.length,
    distanceMeters: state.stats.distanceMeters + segmentMeters,
    countriesVisited: countByKind(regions, 'country'),
    regionsVisited: countByKind(regions, 'region'),
    citiesVisited: countByKind(regions, 'city'),
    currentStreakDays: streak.currentStreak,
    longestStreakDays: streak.longestStreak,
    activeDays,
    totalXp,
    level,
  };

  // 6. Region-completion events (crossed to 100% this tick).
  for (const [regionId, before] of beforePercent) {
    const tally = regions.get(regionId);
    if (tally === undefined) {
      continue;
    }
    const after = explorationPercent(tally.revealedCells, tally.ref.targetCells);
    if (before < 100 && after >= 100) {
      events.push({ type: 'regionCompleted', regionId, regionName: tally.ref.name });
    }
  }

  // 7. Achievements newly satisfied by the updated stats.
  const unlockedAchievements = new Set(state.unlockedAchievements);
  for (const id of evaluateAchievements(nextStats, unlockedAchievements)) {
    unlockedAchievements.add(id);
    events.push({ type: 'achievementUnlocked', achievementId: id });
  }

  const nextState: PlayerState = {
    playerId: state.playerId,
    displayName: state.displayName,
    revealedCells,
    regions,
    stats: nextStats,
    streak,
    unlockedAchievements,
    lastPoint: point,
  };

  return { state: nextState, events };
}
