import { levelForXp, xpToReachLevel } from './levels';

describe('levels', () => {
  it('starts every player at level 1 with 0 XP', () => {
    const progress = levelForXp(0);
    expect(progress.level).toBe(1);
    expect(progress.xpIntoLevel).toBe(0);
    expect(progress.progress).toBe(0);
  });

  it('uses the documented quadratic cumulative curve', () => {
    // LEVEL_BASE_XP = 100 → reach L costs 100 * (L-1) * L / 2.
    expect(xpToReachLevel(1)).toBe(0);
    expect(xpToReachLevel(2)).toBe(100);
    expect(xpToReachLevel(3)).toBe(300);
    expect(xpToReachLevel(5)).toBe(1000);
  });

  it('inverts the curve so XP thresholds land on the right level', () => {
    expect(levelForXp(99).level).toBe(1);
    expect(levelForXp(100).level).toBe(2);
    expect(levelForXp(299).level).toBe(2);
    expect(levelForXp(300).level).toBe(3);
  });

  it('reports coherent progress within a level', () => {
    // 200 XP is halfway between level 2 (100) and level 3 (300).
    const progress = levelForXp(200);
    expect(progress.level).toBe(2);
    expect(progress.xpIntoLevel).toBe(100);
    expect(progress.xpForLevelSpan).toBe(200);
    expect(progress.xpToNextLevel).toBe(100);
    expect(progress.progress).toBeCloseTo(0.5, 6);
  });

  it('round-trips: the level for xpToReachLevel(n) is exactly n', () => {
    for (let n = 1; n <= 60; n += 1) {
      expect(levelForXp(xpToReachLevel(n)).level).toBe(n);
    }
  });
});
