/**
 * RegionCard — component unit tests.
 *
 * Test 1: pressing the card calls `onPress`, which in the parent is wired to
 *         `focusMap`; we verify that the spy passed as onPress is called.
 * Test 2: the card renders name, kind badge, and percentage text correctly.
 *
 * Note: render() is async in @testing-library/react-native v14+ (React 19).
 */
/* eslint-disable @typescript-eslint/no-require-imports */
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { regionCenter } from '@/domain/regions/resolver';
import { useNavigationStore } from '@/app/store/useNavigationStore';
import RegionCard from './RegionCard';
import type { RegionRow } from './RegionCard';

// ---------------------------------------------------------------------------
// Mock useNavigationStore
// ---------------------------------------------------------------------------

jest.mock('@/app/store/useNavigationStore', () => ({
  useNavigationStore: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeLondonRow(): RegionRow {
  return {
    id: 'GB-LDN',
    tally: {
      ref: {
        id: 'GB-LDN',
        name: 'London',
        kind: 'city',
        targetCells: 15_000,
      },
      revealedCells: 7_500,
    },
    percent: 50,
  };
}

function mockNavigationStore(mockFocusMap: jest.Mock): void {
  (useNavigationStore as unknown as jest.Mock).mockImplementation((selector) =>
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

describe('RegionCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls onPress when tapped, and regionCenter returns a valid center for GB-LDN', async () => {
    const mockFocusMap = jest.fn();
    mockNavigationStore(mockFocusMap);

    const row = makeLondonRow();
    const center = regionCenter(row.id);

    // Verify regionCenter knows about GB-LDN (the store wiring relies on this)
    expect(center).not.toBeNull();
    expect(center?.latitude).toBeCloseTo((51.28 + 51.69) / 2, 2);
    expect(center?.longitude).toBeCloseTo((-0.51 + 0.33) / 2, 2);

    const onPress = jest.fn();
    const { getByTestId } = await render(
      <RegionCard row={row} onPress={onPress} testID="region-card-london" />,
    );

    fireEvent.press(getByTestId('region-card-london'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders region name, kind badge, and percent', async () => {
    const mockFocusMap = jest.fn();
    mockNavigationStore(mockFocusMap);

    const row = makeLondonRow();
    const { getByText } = await render(<RegionCard row={row} onPress={jest.fn()} />);

    expect(getByText('London')).toBeTruthy();
    expect(getByText('city')).toBeTruthy();
    expect(getByText('50.0%')).toBeTruthy();
  });
});
