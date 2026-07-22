/**
 * FriendsScreen — behavioral integration tests.
 *
 * Exercises the full screen render by composing the new crew components.
 * No implementation details (no color assertions, no testID internals) —
 * only observable user-facing behavior.
 *
 * Note: render() is async in @testing-library/react-native v14+ (React 19).
 */
import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import FriendsScreen from './FriendsScreen';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/app/store/useExplorationStore', () => ({
  useExplorationStore: () => ({
    playerState: {
      playerId: 'test-player',
      displayName: 'Test Player',
      stats: {
        cellsRevealed: 25,
        distanceMeters: 8000,
        countriesVisited: 2,
        currentStreakDays: 3,
        totalXp: 300,
        level: 3,
      },
    },
  }),
}));

jest.mock('expo-sharing', () => ({ isAvailableAsync: jest.fn().mockResolvedValue(true) }));
jest.mock('react-native/Libraries/Share/Share', () => ({
  share: jest.fn().mockResolvedValue({ action: 'sharedAction' }),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FriendsScreen', () => {
  it('renders the crew list', async () => {
    const { getByText } = await render(<FriendsScreen />);
    // Maya and Kofi are seeded as accepted friends (req-1 and req-2)
    expect(getByText('Maya')).toBeTruthy();
    expect(getByText('Kofi')).toBeTruthy();
  });

  it('renders incoming request', async () => {
    const { getByTestId } = await render(<FriendsScreen />);
    // Priya is seeded as a pending request (req-3); RequestCard uses testID "request-card-req-3"
    expect(getByTestId('request-card-req-3')).toBeTruthy();
  });

  it('accepting a request moves it to the crew', async () => {
    const { getByTestId, getByText } = await render(<FriendsScreen />);

    await act(async () => {
      fireEvent.press(getByTestId('request-accept-req-3'));
    });

    // Priya should now appear in the crew list (still visible somewhere)
    expect(getByText('Priya')).toBeTruthy();

    // The request card for req-3 should no longer be present
    expect(() => getByTestId('request-card-req-3')).toThrow();
  });

  it('declining a request removes it', async () => {
    const { getByTestId, queryByTestId } = await render(<FriendsScreen />);

    await act(async () => {
      fireEvent.press(getByTestId('request-decline-req-3'));
    });

    // The request card for req-3 should no longer be present
    expect(queryByTestId('request-card-req-3')).toBeNull();
  });

  it('compare sheet opens for a crew member', async () => {
    const { getByTestId, getByText } = await render(<FriendsScreen />);

    await act(async () => {
      fireEvent.press(getByTestId('crew-card-compare-maya'));
    });

    // CompareSheet becomes visible — the "vs" label is rendered inside the modal
    expect(getByText('vs')).toBeTruthy();
  });

  it('snapshot card renders player figures', async () => {
    const { getByText } = await render(<FriendsScreen />);
    // SnapshotCard receives playerName="Test Player" from the mocked store
    expect(getByText('Test Player')).toBeTruthy();
    // Level 3 yields "Wanderer" title (from explorerTitle function)
    expect(getByText('Wanderer')).toBeTruthy();
    // cellsRevealed is 25 (mocked as .toLocaleString() which renders as "25")
    expect(getByText('25')).toBeTruthy();
  });
});
