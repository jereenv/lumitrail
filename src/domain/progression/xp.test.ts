import { combineXp, xpForDistance, xpForNewCells, xpForStreakDay } from './xp';

describe('xp', () => {
  it('awards fixed XP per new cell', () => {
    expect(xpForNewCells(0)).toBe(0);
    expect(xpForNewCells(7)).toBe(70);
  });

  it('ignores fractional or negative cell counts safely', () => {
    expect(xpForNewCells(-3)).toBe(0);
    expect(xpForNewCells(2.9)).toBe(20);
  });

  it('awards distance XP per completed 100 m only', () => {
    expect(xpForDistance(0)).toBe(0);
    expect(xpForDistance(99)).toBe(0);
    expect(xpForDistance(100)).toBe(4);
    expect(xpForDistance(250)).toBe(8);
  });

  it('guards against non-finite distances', () => {
    expect(xpForDistance(Number.NaN)).toBe(0);
    expect(xpForDistance(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it('scales streak XP up to the multiplier cap', () => {
    expect(xpForStreakDay(0)).toBe(0);
    expect(xpForStreakDay(1)).toBe(25);
    expect(xpForStreakDay(7)).toBe(175);
    // Beyond the cap (7) the multiplier stops growing.
    expect(xpForStreakDay(30)).toBe(175);
  });

  it('combines all sources into a total breakdown', () => {
    const breakdown = combineXp({ newCellCount: 5, distanceMeters: 300, streakDayAwarded: 2 });
    expect(breakdown.fromCells).toBe(50);
    expect(breakdown.fromDistance).toBe(12);
    expect(breakdown.fromStreak).toBe(50);
    expect(breakdown.total).toBe(112);
  });

  it('omits streak XP when no streak day was awarded', () => {
    const breakdown = combineXp({ newCellCount: 1, distanceMeters: 0 });
    expect(breakdown.fromStreak).toBe(0);
    expect(breakdown.total).toBe(10);
  });
});
