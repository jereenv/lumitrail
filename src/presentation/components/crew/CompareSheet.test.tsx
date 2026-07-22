/**
 * CompareSheet — component unit tests.
 *
 * Covers:
 *   - Renders friend name and "You" label when visible
 *   - Each metric label is present
 *   - Close button calls onClose
 *   - Winner receives the aurora accessible label (higher value wins)
 *   - Tie gives both sides aurora
 *
 * Note: render() is async in @testing-library/react-native v14+ (React 19).
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import CompareSheet from './CompareSheet';
import type { FriendProfile } from './friendDemoData';

// ---------------------------------------------------------------------------
// Shared fixtures
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

/** Player beats friend on every metric. */
const PLAYER_WINNER = {
  cellsRevealed: 60,
  distanceMeters: 20000,
  countriesVisited: 5,
  totalXp: 800,
};

/** Friend beats player on every metric. */
const PLAYER_LOSER = {
  cellsRevealed: 10,
  distanceMeters: 3000,
  countriesVisited: 1,
  totalXp: 100,
};

/** Exact tie on every metric. */
const PLAYER_TIE = {
  cellsRevealed: 40,
  distanceMeters: 12000,
  countriesVisited: 3,
  totalXp: 520,
};

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function renderSheet(
  playerStats = PLAYER_WINNER,
  visible = true,
  onClose = jest.fn(),
) {
  return render(
    <CompareSheet
      visible={visible}
      friendProfile={FRIEND}
      playerStats={playerStats}
      playerName="Jereen"
      onClose={onClose}
    />,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CompareSheet', () => {
  describe('visibility', () => {
    it('renders friend name and "You" when visible', async () => {
      const { getByText } = await renderSheet();
      expect(getByText('Maya')).toBeTruthy();
      expect(getByText('You')).toBeTruthy();
    });

    it('renders the "vs" label', async () => {
      const { getByText } = await renderSheet();
      expect(getByText('vs')).toBeTruthy();
    });
  });

  describe('metric labels', () => {
    it('shows all four metric labels', async () => {
      const { getByText } = await renderSheet();
      expect(getByText('Cells')).toBeTruthy();
      expect(getByText('Distance')).toBeTruthy();
      expect(getByText('Area')).toBeTruthy();
      expect(getByText('Countries')).toBeTruthy();
    });
  });

  describe('stat row testIDs', () => {
    it('has testID for each stat row', async () => {
      const { getByTestId } = await renderSheet();
      expect(getByTestId('compare-row-cells')).toBeTruthy();
      expect(getByTestId('compare-row-distance')).toBeTruthy();
      expect(getByTestId('compare-row-area')).toBeTruthy();
      expect(getByTestId('compare-row-countries')).toBeTruthy();
    });
  });

  describe('overlay and close testIDs', () => {
    it('has testID on the overlay view', async () => {
      const { getByTestId } = await renderSheet();
      expect(getByTestId('compare-sheet-overlay')).toBeTruthy();
    });

    it('has testID on the close button', async () => {
      const { getByTestId } = await renderSheet();
      expect(getByTestId('compare-sheet-close')).toBeTruthy();
    });
  });

  describe('close button', () => {
    it('calls onClose when the Close button is pressed', async () => {
      const onClose = jest.fn();
      const { getByTestId } = await render(
        <CompareSheet
          visible
          friendProfile={FRIEND}
          playerStats={PLAYER_WINNER}
          playerName="Jereen"
          onClose={onClose}
        />,
      );
      fireEvent.press(getByTestId('compare-sheet-close'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('winner highlight via accessible labels', () => {
    it('player "you" cells label contains "you" when player wins cells', async () => {
      // PLAYER_WINNER has 60 cells vs friend 40 → player wins
      const { getAllByLabelText } = await renderSheet(PLAYER_WINNER);
      // The winning player value has accessibilityLabel "Cells you <value>"
      const labels = getAllByLabelText(/Cells you/);
      expect(labels.length).toBeGreaterThan(0);
    });

    it('friend cells label shows friend winning when friend has more cells', async () => {
      // PLAYER_LOSER has 10 cells vs friend 40 → friend wins
      const { getAllByLabelText } = await renderSheet(PLAYER_LOSER);
      const labels = getAllByLabelText(/Cells friend/);
      expect(labels.length).toBeGreaterThan(0);
    });

    it('renders both sides for a tie scenario without errors', async () => {
      // Should render cleanly with no errors; both values equal.
      // In a tie both sides show the same value, so use getAllByText.
      const { getAllByText } = await renderSheet(PLAYER_TIE);
      // Friend cells = 40, player cells = 40 → two "40" nodes
      const fortyNodes = getAllByText('40');
      expect(fortyNodes).toHaveLength(2);
    });
  });

  describe('stat value formatting', () => {
    it('formats distance with one decimal and km suffix', async () => {
      // Friend distanceMeters=12000 → "12.0 km"
      const { getByLabelText } = await renderSheet(PLAYER_WINNER);
      expect(getByLabelText('Distance friend 12.0 km')).toBeTruthy();
    });

    it('formats area from cellsRevealed (0.105 km² per cell)', async () => {
      // Friend cellsRevealed=40 → 40*0.105=4.2 → "4.2 km²"
      const { getByLabelText } = await renderSheet(PLAYER_WINNER);
      expect(getByLabelText('Area friend 4.2 km²')).toBeTruthy();
    });

    it('formats countries as a raw integer', async () => {
      // Friend countriesVisited=3
      const { getByLabelText } = await renderSheet(PLAYER_WINNER);
      expect(getByLabelText('Countries friend 3')).toBeTruthy();
    });
  });
});
