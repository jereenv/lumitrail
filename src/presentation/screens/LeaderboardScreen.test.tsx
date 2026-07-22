/**
 * LeaderboardScreen tests — TDD-first spec.
 *
 * All four cases test the public contract of the screen: what names appear,
 * how re-ranking after a metric change updates the display, how the Crew
 * filter narrows the list, and that the current player's row is always
 * reachable and properly decorated.
 */
import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import { useExplorationStore } from '@/app/store/useExplorationStore';
import { createPlayerState } from '@/domain/loop/state';
import { INITIAL_STATS } from '@/domain/player/stats';

import LeaderboardScreen from './LeaderboardScreen';

// ---------------------------------------------------------------------------
// Module mocks — hoisted by Jest before imports, so require() is used inside.
// ---------------------------------------------------------------------------

jest.mock('@/app/store/useExplorationStore', () => ({
  useExplorationStore: jest.fn(),
}));

jest.mock('react-native-maps', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  const MapView = (props: { children?: React.ReactNode }) =>
    React.createElement(View, { testID: 'map-view' }, props.children);
  MapView.displayName = 'MockMapView';
  return { __esModule: true, default: MapView };
});

jest.mock('react-native-safe-area-context', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  return { __esModule: true, SafeAreaView: View };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const useStoreMock = useExplorationStore as unknown as jest.Mock;

/** A test player with low stats — ranks last in all metrics. */
function makeTestPlayerState() {
  const base = createPlayerState('testplayer', 'TestPlayer');
  return {
    ...base,
    stats: {
      ...INITIAL_STATS,
      cellsRevealed: 5,
      distanceMeters: 500,
      countriesVisited: 0,
      totalXp: 50,
      level: 1,
      longestStreakDays: 1,
    },
  };
}

function mockStore(): void {
  useStoreMock.mockReturnValue({
    playerState: makeTestPlayerState(),
  });
}

beforeEach(() => {
  mockStore();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LeaderboardScreen', () => {
  it('renders the top-3 podium names for default metric (cells)', async () => {
    const { getByText } = await render(<LeaderboardScreen />);

    // By cellsRevealed default: Noor(880) > Maya(340) > Kofi(120) > Alex(55) > TestPlayer(5)
    expect(getByText('Noor')).toBeTruthy();
    expect(getByText('Maya')).toBeTruthy();
    expect(getByText('Kofi')).toBeTruthy();
  });

  it('re-ranks when XP metric chip is pressed; Noor still #1 and value text updates', async () => {
    const { getByText } = await render(<LeaderboardScreen />);

    await act(async () => {
      fireEvent.press(getByText('⚡ XP'));
    });

    // Noor has 11000 XP — highest — so she must appear.
    expect(getByText('Noor')).toBeTruthy();
    // Value text for Noor (rank 1, podium) should reflect XP.
    expect(getByText('11000 XP')).toBeTruthy();
  });

  it('filters to Crew members only when Crew tab is pressed', async () => {
    const { getByText, queryByText } = await render(<LeaderboardScreen />);

    await act(async () => {
      fireEvent.press(getByText('Crew'));
    });

    // Crew = {maya, kofi} + current player (testplayer). Noor and Alex excluded.
    expect(getByText('Maya')).toBeTruthy();
    expect(getByText('Kofi')).toBeTruthy();
    expect(queryByText('Noor')).toBeNull();
    expect(queryByText('Alex')).toBeNull();
  });

  it('always renders current player with "(you)" label and coral testID', async () => {
    const { getByText, getByTestId } = await render(<LeaderboardScreen />);

    // Current player is TestPlayer — ranked last.
    expect(getByText('TestPlayer (you)')).toBeTruthy();
    // Their row must carry the coral testID so a11y / tests can target it.
    expect(getByTestId('ranked-bar-you')).toBeTruthy();
  });
});
