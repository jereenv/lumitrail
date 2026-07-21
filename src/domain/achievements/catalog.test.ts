import { INITIAL_STATS, type PlayerStats } from '@/domain/player/stats';

import {
  ACHIEVEMENTS,
  ACHIEVEMENTS_BY_ID,
  evaluateAchievements,
  nextAchievementInCategory,
} from './catalog';

function statsWith(overrides: Partial<PlayerStats>): PlayerStats {
  return { ...INITIAL_STATS, ...overrides };
}

describe('achievement catalog', () => {
  it('has unique ids', () => {
    expect(ACHIEVEMENTS_BY_ID.size).toBe(ACHIEVEMENTS.length);
  });

  it('unlocks First Light on the very first cell', () => {
    const unlocked = evaluateAchievements(statsWith({ cellsRevealed: 1 }), new Set());
    expect(unlocked).toContain('first-light');
  });

  it('does not re-report already-unlocked achievements', () => {
    const stats = statsWith({ cellsRevealed: 1 });
    const unlocked = evaluateAchievements(stats, new Set(['first-light']));
    expect(unlocked).not.toContain('first-light');
  });

  it('unlocks multiple tiers at once when thresholds are crossed together', () => {
    const unlocked = evaluateAchievements(
      statsWith({ cellsRevealed: 1_000, distanceMeters: 1_000 }),
      new Set(),
    );
    expect(unlocked).toEqual(
      expect.arrayContaining(['first-light', 'pathfinder', 'cartographer', 'first-mile']),
    );
    expect(unlocked).not.toContain('grand-surveyor');
  });

  it('suggests the nearest next goal in a category', () => {
    const next = nextAchievementInCategory(
      'distance',
      statsWith({ distanceMeters: 2_000 }),
      new Set(),
    );
    expect(next?.id).toBe('first-mile');
  });
});
