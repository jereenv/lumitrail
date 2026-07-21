import type { GeoPoint } from '@/domain/geo/types';
import { defaultRegionResolver } from '@/domain/regions/resolver';

import { applyFix, type FixContext } from './applyFix';
import type { DomainEvent } from './events';
import { createPlayerState, type PlayerState } from './state';

const CTX: FixContext = { resolver: defaultRegionResolver, tzOffsetMinutes: 120 };
const DAY0 = Date.UTC(2026, 6, 20, 10, 0, 0);
const DAY1 = Date.UTC(2026, 6, 21, 10, 0, 0);

const P1: GeoPoint = { latitude: 59.3293, longitude: 18.0686, accuracy: 10, timestamp: DAY0 };
// ~300 m north of P1, the following day.
const P2: GeoPoint = { latitude: 59.332, longitude: 18.0686, accuracy: 10, timestamp: DAY1 };

function types(events: readonly DomainEvent[]): string[] {
  return events.map((e) => e.type);
}

describe('applyFix — the core game loop', () => {
  it('reveals fog, awards XP, tracks regions and unlocks achievements on the first fix', () => {
    const start = createPlayerState('me', 'Explorer');
    const { state, events } = applyFix(start, P1, CTX);

    // move → unfog
    expect(state.stats.cellsRevealed).toBe(7);
    expect(types(events)).toContain('cellsRevealed');

    // region tracking
    expect(state.stats.countriesVisited).toBe(1);
    expect(state.stats.regionsVisited).toBe(1);
    expect(state.stats.citiesVisited).toBe(1);

    // XP: 7 cells * 10 + streak day 1 (25), no distance on the first fix.
    expect(state.stats.totalXp).toBe(95);
    expect(state.stats.level).toBe(1);

    // streak + achievements
    expect(state.stats.currentStreakDays).toBe(1);
    const unlocked = events.filter((e) => e.type === 'achievementUnlocked');
    expect(unlocked).toEqual(
      expect.arrayContaining([
        { type: 'achievementUnlocked', achievementId: 'first-light' },
        { type: 'achievementUnlocked', achievementId: 'first-border' },
      ]),
    );
  });

  it('accumulates distance, extends the streak and levels up across days', () => {
    const s1 = applyFix(createPlayerState('me', 'Explorer'), P1, CTX).state;
    const { state, events } = applyFix(s1, P2, CTX);

    // move → unfog (some new cells, some overlap with the first ring)
    expect(state.stats.cellsRevealed).toBeGreaterThan(s1.stats.cellsRevealed);
    expect(state.stats.cellsRevealed).toBeLessThanOrEqual(14);

    // distance accrued between the two fixes
    expect(state.stats.distanceMeters).toBeGreaterThan(250);

    // streak extended to day 2
    expect(state.stats.currentStreakDays).toBe(2);
    expect(types(events)).toContain('streakExtended');

    // crossed 100 XP → level 2 → level up
    expect(state.stats.level).toBeGreaterThanOrEqual(2);
    expect(types(events)).toContain('leveledUp');
    const levelUp = events.find((e) => e.type === 'leveledUp');
    expect(levelUp).toMatchObject({ from: 1, to: 2 });
  });

  it('rejects an inaccurate fix without mutating state', () => {
    const start = createPlayerState('me', 'Explorer');
    const bad: GeoPoint = { ...P1, accuracy: 500 };
    const { state, events } = applyFix(start, bad, CTX);

    expect(state).toBe(start);
    expect(events).toEqual([{ type: 'fixRejected', reason: 'inaccurate' }]);
  });

  it('excludes teleport jumps from distance but still reveals the new place', () => {
    const s1 = applyFix(createPlayerState('me', 'Explorer'), P1, CTX).state;
    const farAway: GeoPoint = {
      latitude: 40.7128,
      longitude: -74.006,
      accuracy: 10,
      timestamp: DAY0,
    };
    const { state } = applyFix(s1, farAway, CTX);

    // New York is revealed and counted as a new country...
    expect(state.stats.countriesVisited).toBe(2);
    // ...but the transatlantic jump adds no distance.
    expect(state.stats.distanceMeters).toBe(s1.stats.distanceMeters);
  });

  it('is idempotent for a repeated fix at the same place and time', () => {
    const s1 = applyFix(createPlayerState('me', 'Explorer'), P1, CTX).state;
    const { state, events } = applyFix(s1, P1, CTX);

    expect(state.stats.cellsRevealed).toBe(s1.stats.cellsRevealed);
    expect(state.stats.totalXp).toBe(s1.stats.totalXp);
    expect(events).toEqual([]);
  });

  it('never mutates the input state (immutability)', () => {
    const start: PlayerState = createPlayerState('me', 'Explorer');
    applyFix(start, P1, CTX);
    expect(start.stats.cellsRevealed).toBe(0);
    expect(start.revealedCells.size).toBe(0);
  });
});
