/* eslint-disable @typescript-eslint/no-require-imports, import/first --
 * jest.mock() factories are hoisted above the imports, so they must use
 * require() and cannot reference imported bindings; the mocked map SDK is
 * therefore imported after the mocks are declared. Both are standard jest
 * idioms, intentional here, and confined to this test file. */
import React from 'react';
import { act, render } from '@testing-library/react-native';
import { gridDisk } from 'h3-js';

import { cellForPoint } from '@/domain/geo/grid';
import { createPlayerState } from '@/domain/loop/state';
import { useExplorationStore } from '@/app/store/useExplorationStore';

import MapScreen from './MapScreen';

// Prefixed with "mock" so jest.mock() factories (which are hoisted above imports
// by Babel) are allowed to reference it. Variables without that prefix are
// rejected at parse time by the babel-jest hoisting plugin.
const mockAnimateToRegion = jest.fn();

// --- Mock the native map SDK so the screen renders with no device. -----------
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Polygon = jest.fn(() => null);
  const Polyline = jest.fn(() => null);
  const MapView = React.forwardRef(
    (props: { children?: React.ReactNode }, ref: React.Ref<unknown>) => {
      React.useImperativeHandle(ref, () => ({ animateToRegion: mockAnimateToRegion }));
      return React.createElement(View, { testID: 'map-view' }, props.children);
    },
  );
  MapView.displayName = 'MockMapView';
  return { __esModule: true, default: MapView, Polygon, Polyline };
});

jest.mock('expo-location', () => ({
  __esModule: true,
  reverseGeocodeAsync: jest.fn().mockResolvedValue([{ city: 'Richmond' }]),
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { __esModule: true, SafeAreaView: View };
});

// The store is mocked so no service/native persistence is constructed.
jest.mock('@/app/store/useExplorationStore', () => ({
  useExplorationStore: jest.fn(),
}));

jest.mock('@/app/store/useNavigationStore', () => ({
  useNavigationStore: jest.fn(),
}));

import { Polygon } from 'react-native-maps';
import { useNavigationStore } from '@/app/store/useNavigationStore';

const PolygonMock = Polygon as unknown as jest.Mock;
const useStoreMock = useExplorationStore as unknown as jest.Mock;
const useNavStoreMock = useNavigationStore as unknown as jest.Mock;

/** Builds a player state with a ring of cells around central Stockholm (in the default view). */
function stockholmPlayerState() {
  const centre = cellForPoint({ latitude: 59.3293, longitude: 18.0686 });
  const cells = gridDisk(centre, 1);
  const base = createPlayerState('p', 'P');
  return {
    ...base,
    revealedCells: new Set(cells),
    stats: { ...base.stats, cellsRevealed: cells.length, distanceMeters: 1234, totalXp: 150 },
  };
}

function mockStore(overrides: Record<string, unknown> = {}): void {
  useStoreMock.mockReturnValue({
    playerState: stockholmPlayerState(),
    currentLocation: null,
    recentEvents: [],
    isDemoWalking: false,
    runDemoWalk: jest.fn(),
    locateMe: jest.fn(),
    ...overrides,
  });
}

function mockNavStore(overrides: Record<string, unknown> = {}): void {
  useNavStoreMock.mockReturnValue({
    focusTarget: null,
    clearMapFocus: jest.fn(),
    ...overrides,
  });
}

beforeEach(() => {
  PolygonMock.mockClear();
  useNavStoreMock.mockClear();
  mockAnimateToRegion.mockClear();
  mockStore();
  mockNavStore();
});

function holesDrawn(): number {
  return PolygonMock.mock.calls
    .map((call) => call[0] as { holes?: unknown[] })
    .filter((props) => Array.isArray(props.holes) && props.holes.length > 0).length;
}

describe('MapScreen', () => {
  it('renders the real map view (not a hand-rolled SVG)', async () => {
    const { getByTestId } = await render(<MapScreen />);
    expect(getByTestId('map-view')).toBeTruthy();
  });

  it('draws the fog as a polygon with holes over explored cells', async () => {
    await render(<MapScreen />);
    expect(holesDrawn()).toBeGreaterThan(0);
  });

  it('shows the "% uncovered" in the region banner on open', async () => {
    const { getByTestId } = await render(<MapScreen />);
    // The percentage is now shown in the bottom RegionBanner (e.g. "12.3%").
    expect(getByTestId('region-banner-percent')).toBeTruthy();
  });

  it('offers a demo walk control', async () => {
    const { getByLabelText } = await render(<MapScreen />);
    expect(getByLabelText(/demo walk/i)).toBeTruthy();
  });

  it('draws no holes when nothing is explored', async () => {
    mockStore({ playerState: createPlayerState('p', 'P') });
    await render(<MapScreen />);
    expect(holesDrawn()).toBe(0);
  });

  it('draws frontier Polylines for explored edges', async () => {
    const { Polyline } = require('react-native-maps');
    const PolylineMock = Polyline as jest.Mock;
    PolylineMock.mockClear();
    await render(<MapScreen />);
    expect(PolylineMock.mock.calls.length).toBeGreaterThan(0);
  });

  it('calls animateToRegion and clearMapFocus when focusTarget is set', async () => {
    const clearMapFocus = jest.fn();
    mockNavStore({
      focusTarget: { latitude: 59.33, longitude: 18.07, latitudeDelta: 0.04, longitudeDelta: 0.04 },
      clearMapFocus,
    });
    await render(<MapScreen />);
    expect(mockAnimateToRegion).toHaveBeenCalledWith(
      expect.objectContaining({ latitude: 59.33, longitude: 18.07 }),
      600,
    );
    expect(clearMapFocus).toHaveBeenCalled();
  });

  it('shows focus label immediately and hides it after 2 s', async () => {
    jest.useFakeTimers();
    const clearMapFocus = jest.fn();
    mockNavStore({
      focusTarget: {
        latitude: 59.33,
        longitude: 18.07,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
        label: 'London',
      },
      clearMapFocus,
    });

    const { getByText, queryByText } = await render(<MapScreen />);

    // Label must be visible immediately after fly-to.
    expect(getByText('London')).toBeTruthy();

    // Advance past the 2 s hide delay.
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    expect(queryByText('London')).toBeNull();

    jest.useRealTimers();
  });
});
