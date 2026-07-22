/**
 * SnapshotCard — component unit tests.
 *
 * Covers:
 *   - Renders playerName
 *   - Renders level as text
 *   - Renders cells / distance / countries values
 *   - Renders the correct level title string
 *   - Share button is present (testID)
 *
 * Note: render() is async in @testing-library/react-native v14+ (React 19).
 */
import React from 'react';
import { render } from '@testing-library/react-native';

import SnapshotCard from './SnapshotCard';

// ---------------------------------------------------------------------------
// Mocks — prevent native module errors in Jest
// ---------------------------------------------------------------------------

jest.mock('expo-sharing', () => ({ isAvailableAsync: jest.fn().mockResolvedValue(true) }));
jest.mock('react-native/Libraries/Share/Share', () => ({
  share: jest.fn().mockResolvedValue({ action: 'sharedAction' }),
}));

// ---------------------------------------------------------------------------
// Shared fixture
// ---------------------------------------------------------------------------

const BASE_PROPS = {
  playerName: 'Alex',
  level: 7,
  stats: {
    cellsRevealed: 250,
    distanceMeters: 45000,
    countriesVisited: 5,
    totalXp: 1800,
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SnapshotCard', () => {
  it('renders the player name', async () => {
    const { getByText } = await render(<SnapshotCard {...BASE_PROPS} />);
    expect(getByText('Alex')).toBeTruthy();
  });

  it('renders the level as text inside the component', async () => {
    const { getByText } = await render(<SnapshotCard {...BASE_PROPS} />);
    // The level badge inside Avatar shows level 7
    expect(getByText('7')).toBeTruthy();
  });

  it('renders the cells revealed value', async () => {
    const { getByText } = await render(<SnapshotCard {...BASE_PROPS} />);
    // toLocaleString() on 250 yields "250" on every test environment
    expect(getByText('250')).toBeTruthy();
  });

  it('renders the distance in km', async () => {
    const { getByText } = await render(<SnapshotCard {...BASE_PROPS} />);
    // 45000m → "45.0"
    expect(getByText('45.0')).toBeTruthy();
  });

  it('renders the countries visited value', async () => {
    const { getByText } = await render(<SnapshotCard {...BASE_PROPS} />);
    expect(getByText('5')).toBeTruthy();
  });

  it('renders the correct level title — Pathfinder for level 7', async () => {
    const { getByText } = await render(<SnapshotCard {...BASE_PROPS} />);
    expect(getByText('Pathfinder')).toBeTruthy();
  });

  it('renders Wanderer for level 3', async () => {
    const { getByText } = await render(<SnapshotCard {...BASE_PROPS} level={3} />);
    expect(getByText('Wanderer')).toBeTruthy();
  });

  it('renders Trailblazer for level 10', async () => {
    const { getByText } = await render(<SnapshotCard {...BASE_PROPS} level={10} />);
    expect(getByText('Trailblazer')).toBeTruthy();
  });

  it('renders Voyager for level 20', async () => {
    const { getByText } = await render(<SnapshotCard {...BASE_PROPS} level={20} />);
    expect(getByText('Voyager')).toBeTruthy();
  });

  it('has a share button with the correct testID', async () => {
    const { getByTestId } = await render(<SnapshotCard {...BASE_PROPS} />);
    expect(getByTestId('snapshot-share-btn')).toBeTruthy();
  });

  it('has the snapshot-card testID on the outer GameCard', async () => {
    const { getByTestId } = await render(<SnapshotCard {...BASE_PROPS} />);
    expect(getByTestId('snapshot-card')).toBeTruthy();
  });
});
