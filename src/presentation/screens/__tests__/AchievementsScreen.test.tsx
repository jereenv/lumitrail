/**
 * AchievementsScreen — behavioural render tests.
 *
 * Asserts on testIDs, accessible labels, and text content — never on colours.
 * useExplorationStore is mocked so we control PlayerState precisely.
 * The real ACHIEVEMENTS catalog is used (not mocked).
 */
import React from 'react';
import { render, within } from '@testing-library/react-native';

import AchievementsScreen from '../AchievementsScreen';
import { useExplorationStore } from '@/app/store/useExplorationStore';
import { ACHIEVEMENTS } from '@/domain/achievements/catalog';
import type { PlayerStats } from '@/domain/player/stats';

// ---------------------------------------------------------------------------
// Mock the store — the component calls useExplorationStore() in its body.
// ---------------------------------------------------------------------------

jest.mock('@/app/store/useExplorationStore');

const mockStore = useExplorationStore as jest.Mock;

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const mockStatsAllLocked: PlayerStats = {
  cellsRevealed: 0,
  distanceMeters: 0,
  countriesVisited: 0,
  regionsVisited: 0,
  citiesVisited: 0,
  currentStreakDays: 0,
  longestStreakDays: 0,
  activeDays: 0,
  totalXp: 0,
  level: 1,
};

// cellsRevealed=150 unlocks first-light (threshold 1) and pathfinder (threshold 100)
// distanceMeters=5000 does NOT unlock first-mile (threshold 1000) — wait, 5000 > 1000, so first-mile IS unlocked.
// We only pass first-light and pathfinder in unlockedAchievements for the partial unlock tests,
// so the store mock controls what's considered unlocked — not the stats alone.
const mockStatsPartialUnlock: PlayerStats = {
  cellsRevealed: 150,
  distanceMeters: 5000,
  countriesVisited: 0,
  regionsVisited: 0,
  citiesVisited: 0,
  currentStreakDays: 1,
  longestStreakDays: 1,
  activeDays: 3,
  totalXp: 500,
  level: 3,
};

// ---------------------------------------------------------------------------
// Helper: build a default store shape with overrides
// ---------------------------------------------------------------------------

function makeStore(
  stats: PlayerStats,
  unlockedAchievements: ReadonlySet<string>,
): void {
  mockStore.mockReturnValue({
    playerState: {
      playerId: 'test-player',
      displayName: 'Tester',
      revealedCells: new Set<string>(),
      regions: new Map<string, unknown>(),
      stats,
      streak: { currentStreakDays: 0, longestStreakDays: 0, lastActiveDateKey: null },
      unlockedAchievements,
      lastPoint: null,
    },
    recentEvents: [],
    currentLocation: null,
    isDeviceBacked: false,
    isInitialized: true,
    isTracking: false,
    isDemoWalking: false,
    error: null,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AchievementsScreen', () => {
  beforeEach(() => {
    makeStore(mockStatsAllLocked, new Set<string>());
  });

  // 1 -----------------------------------------------------------------------
  it('shows "0 of N unlocked" when all locked', async () => {
    makeStore(mockStatsAllLocked, new Set<string>());

    const { getByText, getByTestId } = await render(
      <AchievementsScreen />,
    );

    expect(getByText(`0 of ${ACHIEVEMENTS.length} unlocked`)).toBeTruthy();
    expect(getByTestId('trophies-header')).toBeTruthy();
  });

  // 2 -----------------------------------------------------------------------
  it('shows "2 of N unlocked" when two achievements are unlocked', async () => {
    makeStore(mockStatsPartialUnlock, new Set(['first-light', 'pathfinder']));

    const { getByText } = await render(
      <AchievementsScreen />,
    );

    expect(getByText(`2 of ${ACHIEVEMENTS.length} unlocked`)).toBeTruthy();
  });

  // 3 -----------------------------------------------------------------------
  it('renders the header progress ring', async () => {
    const { getByTestId } = await render(
      <AchievementsScreen />,
    );

    expect(getByTestId('header-ring')).toBeTruthy();
  });

  // 4 -----------------------------------------------------------------------
  it('renders section headers for all five categories', async () => {
    const { getAllByText } = await render(
      <AchievementsScreen />,
    );

    // getAllByText because category names may appear more than once (header + chip).
    expect(getAllByText('Discovery').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('Distance').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('World').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('Streak').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('Progression').length).toBeGreaterThanOrEqual(1);
  });

  // 5 -----------------------------------------------------------------------
  it('shows an unlocked bronze medal accessible label', async () => {
    makeStore(mockStatsPartialUnlock, new Set(['first-light', 'pathfinder']));

    const { getByLabelText } = await render(
      <AchievementsScreen />,
    );

    // First Light is bronze and unlocked.
    expect(getByLabelText(/bronze medal - unlocked/)).toBeTruthy();
  });

  // 6 -----------------------------------------------------------------------
  it('shows a locked gold medal accessible label', async () => {
    makeStore(mockStatsPartialUnlock, new Set(['first-light', 'pathfinder']));

    const { getAllByLabelText } = await render(
      <AchievementsScreen />,
    );

    // Multiple gold locked medals exist (Cartographer, Long Hauler, etc.).
    // Assert that at least one is present.
    expect(getAllByLabelText(/gold medal - locked/).length).toBeGreaterThanOrEqual(1);
  });

  // 7 -----------------------------------------------------------------------
  it('shows progress fraction "150 / 1000" for the discovery next-goal card', async () => {
    makeStore(mockStatsPartialUnlock, new Set(['first-light', 'pathfinder']));

    const { getByText, getByTestId } = await render(
      <AchievementsScreen />,
    );

    // Cartographer is the next discovery goal (threshold 1000); player has 150.
    const card = getByTestId('next-goal-card-discovery');
    expect(within(card).getByText('150 / 1000')).toBeTruthy();
  });

  // 8 -----------------------------------------------------------------------
  it('shows "All Streak trophies unlocked!" when all streak achievements are unlocked', async () => {
    const allStreakIds = ACHIEVEMENTS
      .filter((a) => a.category === 'streak')
      .map((a) => a.id);

    makeStore(mockStatsAllLocked, new Set(allStreakIds));

    const { getByText } = await render(
      <AchievementsScreen />,
    );

    expect(getByText('All Streak trophies unlocked!')).toBeTruthy();
  });
});
