/* eslint-disable @typescript-eslint/no-require-imports, import/first --
 * jest.mock() factories are hoisted above the imports, so they must use
 * require() and cannot reference imported bindings; the mocked map SDK is
 * therefore imported after the mocks are declared. Both are standard jest
 * idioms, intentional here, and confined to this test file. */
import React from 'react';
import { render } from '@testing-library/react-native';
import { gridDisk } from 'h3-js';

import { cellForPoint } from '@/domain/geo/grid';
import { createPlayerState } from '@/domain/loop/state';
import { useExplorationStore } from '@/app/store/useExplorationStore';

import MapScreen from './MapScreen';

// --- Mock the native map SDK so the screen renders with no device. -----------
jest.mock('react-native-maps', () => {
  const ReactLib = require('react');
  const { View } = require('react-native');
  const Polygon = jest.fn(() => ReactLib.createElement(View, { testID: 'polygon' }));
  const MapView = ReactLib.forwardRef(
    (props: { children?: React.ReactNode }, ref: React.Ref<unknown>) => {
      ReactLib.useImperativeHandle(ref, () => ({ animateToRegion: () => undefined }));
      return ReactLib.createElement(View, { testID: 'map-view' }, props.children);
    },
  );
  return { __esModule: true, default: MapView, Polygon };
});

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { __esModule: true, SafeAreaView: View };
});

// The store is mocked so no service/native persistence is constructed.
jest.mock('@/app/store/useExplorationStore', () => ({
  useExplorationStore: jest.fn(),
}));

import { Polygon } from 'react-native-maps';

const PolygonMock = Polygon as unknown as jest.Mock;
const useStoreMock = useExplorationStore as unknown as jest.Mock;

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

beforeEach(() => {
  PolygonMock.mockClear();
  mockStore();
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

  it('shows the "% uncovered" HUD on open', async () => {
    const { getByText } = await render(<MapScreen />);
    expect(getByText(/of this area uncovered/i)).toBeTruthy();
    // The percentage is rendered as e.g. "12.3%".
    expect(getByText(/%$/)).toBeTruthy();
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
});
