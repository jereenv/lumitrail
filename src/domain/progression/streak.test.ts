import { dayOrdinal, INITIAL_STREAK, recordActiveDay } from './streak';

describe('dayOrdinal', () => {
  it('buckets two timestamps on the same local day to the same ordinal', () => {
    const morning = Date.UTC(2026, 6, 20, 8, 0, 0);
    const evening = Date.UTC(2026, 6, 20, 20, 0, 0);
    expect(dayOrdinal(morning, 120)).toBe(dayOrdinal(evening, 120));
  });

  it('respects the timezone offset at day boundaries', () => {
    // 23:30 UTC on the 20th is already the 21st at UTC+2.
    const lateUtc = Date.UTC(2026, 6, 20, 23, 30, 0);
    const utc = dayOrdinal(lateUtc, 0);
    const plus2 = dayOrdinal(lateUtc, 120);
    expect(plus2).toBe(utc + 1);
  });
});

describe('recordActiveDay', () => {
  it('starts a streak at 1 on the first active day', () => {
    const { state, awardedStreakDay } = recordActiveDay(INITIAL_STREAK, 100);
    expect(state.currentStreak).toBe(1);
    expect(state.longestStreak).toBe(1);
    expect(awardedStreakDay).toBe(1);
  });

  it('does nothing when the same day is recorded twice', () => {
    const first = recordActiveDay(INITIAL_STREAK, 100);
    const second = recordActiveDay(first.state, 100);
    expect(second.state).toBe(first.state);
    expect(second.awardedStreakDay).toBe(0);
  });

  it('extends the streak on a consecutive day', () => {
    const day1 = recordActiveDay(INITIAL_STREAK, 100);
    const day2 = recordActiveDay(day1.state, 101);
    expect(day2.state.currentStreak).toBe(2);
    expect(day2.awardedStreakDay).toBe(2);
  });

  it('resets the streak after a gap but keeps the longest record', () => {
    let state = recordActiveDay(INITIAL_STREAK, 100).state;
    state = recordActiveDay(state, 101).state;
    state = recordActiveDay(state, 102).state;
    expect(state.currentStreak).toBe(3);

    const afterGap = recordActiveDay(state, 110);
    expect(afterGap.state.currentStreak).toBe(1);
    expect(afterGap.state.longestStreak).toBe(3);
  });
});
