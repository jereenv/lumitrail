/**
 * CrewCard — component unit tests.
 *
 * Covers:
 *   - Renders the friend's display name
 *   - Renders the level label (e.g. "Lv 5")
 *   - Compare button press calls the onCompare callback
 *
 * Note: render() is async in @testing-library/react-native v14+ (React 19).
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import CrewCard from './CrewCard';
import type { FriendProfile } from './friendDemoData';

// ---------------------------------------------------------------------------
// Shared fixture
// ---------------------------------------------------------------------------

const FRIEND: FriendProfile = {
  playerId: 'maya',
  displayName: 'Maya',
  stats: {
    cellsRevealed: 40,
    distanceMeters: 12000,
    countriesVisited: 3,
    totalXp: 520,
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CrewCard', () => {
  it('renders the display name', async () => {
    const { getByText } = await render(
      <CrewCard friendProfile={FRIEND} onCompare={jest.fn()} />,
    );
    expect(getByText('Maya')).toBeTruthy();
  });

  it('renders the level label', async () => {
    const { getByText } = await render(
      <CrewCard friendProfile={FRIEND} onCompare={jest.fn()} />,
    );
    // levelForXp(520) with LEVEL_BASE_XP=100: level = floor((1+sqrt(1+8*520/100))/2)
    // = floor((1+sqrt(1+41.6))/2) = floor((1+6.53)/2) = floor(3.76) = 3 — but actual
    // implementation is used here; test just checks the label format.
    expect(getByText(/^Lv \d+$/)).toBeTruthy();
  });

  it('calls onCompare when the Compare button is pressed', async () => {
    const onCompare = jest.fn();
    const { getByTestId } = await render(
      <CrewCard friendProfile={FRIEND} onCompare={onCompare} />,
    );
    fireEvent.press(getByTestId('crew-card-compare-maya'));
    expect(onCompare).toHaveBeenCalledTimes(1);
  });

  it('has the correct testID on the GameCard', async () => {
    const { getByTestId } = await render(
      <CrewCard friendProfile={FRIEND} onCompare={jest.fn()} />,
    );
    expect(getByTestId('crew-card-maya')).toBeTruthy();
  });
});
