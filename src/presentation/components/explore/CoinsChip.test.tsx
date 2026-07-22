import { deriveCoins } from './CoinsChip';

describe('deriveCoins', () => {
  it('returns 0 for 0 XP', () => {
    expect(deriveCoins(0)).toBe(0);
  });

  it('floors to the nearest 10 XP', () => {
    expect(deriveCoins(9)).toBe(0);
    expect(deriveCoins(10)).toBe(1);
    expect(deriveCoins(19)).toBe(1);
    expect(deriveCoins(100)).toBe(10);
  });

  it('handles large XP values', () => {
    expect(deriveCoins(15000)).toBe(1500);
  });
});
