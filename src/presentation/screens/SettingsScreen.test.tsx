/**
 * SettingsScreen.test.tsx — test suite for the gamified Settings screen.
 */
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { createPlayerState } from '@/domain/loop/state';
import { useExplorationStore } from '@/app/store/useExplorationStore';

import SettingsScreen from './SettingsScreen';

// --- Mock the store so tests don't require the full app bootstrap. -----------

jest.mock('@/app/store/useExplorationStore', () => ({
  useExplorationStore: jest.fn(),
}));

const useStoreMock = useExplorationStore as unknown as jest.Mock;

/**
 * Builds a minimal player state for testing.
 * Includes Ada as the display name and some sample stats.
 */
function testPlayerState() {
  const base = createPlayerState('test-player', 'Ada');
  return {
    ...base,
    stats: {
      ...base.stats,
      totalXp: 200,
      cellsRevealed: 42,
    },
  };
}

/**
 * Mock the store with a default test player state and empty handlers.
 */
function mockStore(overrides: Record<string, unknown> = {}): void {
  useStoreMock.mockReturnValue({
    playerState: testPlayerState(),
    exportData: jest.fn().mockResolvedValue(undefined),
    deleteAllData: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  });
}

beforeEach(() => {
  mockStore();
});

describe('SettingsScreen', () => {
  it('renders the About You card', async () => {
    const { getByTestId } = await render(<SettingsScreen />);
    expect(getByTestId('settings-card-about')).toBeTruthy();
  });

  it('renders the Sharing card', async () => {
    const { getByTestId } = await render(<SettingsScreen />);
    expect(getByTestId('settings-card-sharing')).toBeTruthy();
  });

  it('renders the Location card', async () => {
    const { getByTestId } = await render(<SettingsScreen />);
    expect(getByTestId('settings-card-location')).toBeTruthy();
  });

  it('renders the Data card', async () => {
    const { getByTestId } = await render(<SettingsScreen />);
    expect(getByTestId('settings-card-data')).toBeTruthy();
  });

  it('renders the App Info card', async () => {
    const { getByTestId } = await render(<SettingsScreen />);
    expect(getByTestId('settings-card-appinfo')).toBeTruthy();
  });

  it('shows player display name', async () => {
    const { getByText } = await render(<SettingsScreen />);
    expect(getByText('Ada')).toBeTruthy();
  });

  it('export button fires exportData when pressed', async () => {
    const mockExportData = jest.fn().mockResolvedValue(undefined);
    mockStore({ exportData: mockExportData });

    const { getByLabelText } = await render(<SettingsScreen />);
    const exportButton = getByLabelText(/export my exploration data/i);

    fireEvent.press(exportButton);
    expect(mockExportData).toHaveBeenCalledTimes(1);
  });
});
