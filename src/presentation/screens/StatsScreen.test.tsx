/**
 * StatsScreen — integration tests.
 *
 * Focuses on the press → focusMap integration: tapping a RegionCard in the
 * region list calls `focusMap` on the navigation store with the correct center
 * coordinates and label from `regionCenter`.
 *
 * Note: render() is async in @testing-library/react-native v14+ (React 19).
 */
/* eslint-disable @typescript-eslint/no-require-imports */
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { createPlayerState } from '@/domain/loop/state';
import { useExplorationStore } from '@/app/store/useExplorationStore';
import { useNavigationStore } from '@/app/store/useNavigationStore';
import { regionCenter } from '@/domain/regions/resolver';

import StatsScreen from './StatsScreen';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/app/store/useExplorationStore', () => ({
  useExplorationStore: jest.fn(),
}));

jest.mock('@/app/store/useNavigationStore', () => ({
  useNavigationStore: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a player state that has one revealed region: London (GB-LDN). */
function makePlayerStateWithLondon() {
  const base = createPlayerState('p1', 'Jereen');
  const regions = new Map(base.regions);
  regions.set('GB-LDN', {
    ref: { id: 'GB-LDN', name: 'London', kind: 'city', targetCells: 15_000 },
    revealedCells: 7_500,
  });
  return { ...base, regions };
}

function mockExplorationStore(overrides: Record<string, unknown> = {}): void {
  (useExplorationStore as jest.Mock).mockImplementation(() => ({
    playerState: makePlayerStateWithLondon(),
    currentLocation: null,
    recentEvents: [],
    isDemoWalking: false,
    runDemoWalk: jest.fn(),
    locateMe: jest.fn(),
    ...overrides,
  }));
}

function mockNavigationStore(mockFocusMap: jest.Mock): void {
  (useNavigationStore as jest.Mock).mockImplementation((selector) =>
    selector({
      focusMap: mockFocusMap,
      activeTab: 'stats' as const,
      setActiveTab: jest.fn(),
      focusTarget: null,
      clearMapFocus: jest.fn(),
    }),
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('StatsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', async () => {
    const mockFocusMap = jest.fn();
    mockExplorationStore();
    mockNavigationStore(mockFocusMap);

    const { getByText } = await render(<StatsScreen />);
    expect(getByText('Your Exploration')).toBeTruthy();
  });

  it('renders the Regions Explored section header', async () => {
    const mockFocusMap = jest.fn();
    mockExplorationStore();
    mockNavigationStore(mockFocusMap);

    const { getByText } = await render(<StatsScreen />);
    expect(getByText('Regions Explored')).toBeTruthy();
  });

  it('pressing a region card calls focusMap with the correct center and label', async () => {
    const mockFocusMap = jest.fn();
    mockExplorationStore();
    mockNavigationStore(mockFocusMap);

    const { getByTestId } = await render(<StatsScreen />);

    // The card is rendered with testID="region-card-GB-LDN"
    fireEvent.press(getByTestId('region-card-GB-LDN'));

    // regionCenter('GB-LDN') must return a non-null result for this test to be meaningful
    const center = regionCenter('GB-LDN');
    expect(center).not.toBeNull();

    expect(mockFocusMap).toHaveBeenCalledTimes(1);
    expect(mockFocusMap).toHaveBeenCalledWith({
      ...center,
      label: 'London',
    });
  });

  it('shows empty state when no regions are explored', async () => {
    const mockFocusMap = jest.fn();
    (useExplorationStore as jest.Mock).mockImplementation(() => ({
      playerState: createPlayerState('p1', 'Jereen'),
      currentLocation: null,
      recentEvents: [],
      isDemoWalking: false,
      runDemoWalk: jest.fn(),
      locateMe: jest.fn(),
    }));
    mockNavigationStore(mockFocusMap);

    const { getByText } = await render(<StatsScreen />);
    expect(getByText('Explore new places to see region breakdown here.')).toBeTruthy();
  });
});
