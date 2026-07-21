import { gridDisk } from 'h3-js';

import { cellForPoint } from './grid';
import {
  approximateAreaKm2,
  boundingBoxAreaKm2,
  buildFogOverlay,
  computeFogGeometry,
  estimateCellsInBounds,
  RES9_CELL_AREA_KM2,
  revealedCellsInBounds,
  viewExploredPercent,
  type MapRegion,
} from './fog';
import type { H3Index } from './types';

const CENTER = cellForPoint({ latitude: 59.3293, longitude: 18.0686 });
const NEIGHBOURS = gridDisk(CENTER, 1).filter((c) => c !== CENTER);

describe('computeFogGeometry', () => {
  it('returns nothing for no cells', () => {
    expect(computeFogGeometry([])).toEqual({ revealedOutlines: [], fogIslands: [] });
  });

  it('yields one 6-vertex outline for a single hexagon', () => {
    const { revealedOutlines, fogIslands } = computeFogGeometry([CENTER]);
    expect(revealedOutlines).toHaveLength(1);
    expect(revealedOutlines[0]).toHaveLength(6);
    expect(fogIslands).toHaveLength(0);
  });

  it('merges two adjacent hexagons into a single outline (shared edge dissolved)', () => {
    const neighbour = NEIGHBOURS[0] as H3Index;
    const { revealedOutlines, fogIslands } = computeFogGeometry([CENTER, neighbour]);
    expect(revealedOutlines).toHaveLength(1);
    // Two hexes sharing one edge → 10 boundary vertices, definitely more than 6.
    expect(revealedOutlines[0]!.length).toBeGreaterThan(6);
    expect(fogIslands).toHaveLength(0);
  });

  it('produces a fog island for an unexplored pocket surrounded by explored cells', () => {
    // The six neighbours form a donut around the (unexplored) centre.
    const { revealedOutlines, fogIslands } = computeFogGeometry(NEIGHBOURS);
    expect(revealedOutlines).toHaveLength(1);
    expect(fogIslands).toHaveLength(1);
  });
});

describe('revealedCellsInBounds', () => {
  it('keeps only cells whose centre is inside the box', () => {
    const far = cellForPoint({ latitude: 40.0, longitude: -74.0 });
    const sw = { latitude: 59.3, longitude: 18.0 };
    const ne = { latitude: 59.4, longitude: 18.1 };
    const inside = revealedCellsInBounds([CENTER, far], sw, ne);
    expect(inside).toEqual([CENTER]);
  });
});

describe('area + percentage math', () => {
  it('computes a positive, latitude-scaled bounding-box area', () => {
    const area = boundingBoxAreaKm2(
      { latitude: 59.3, longitude: 18.0 },
      { latitude: 59.4, longitude: 18.1 },
    );
    expect(area).toBeGreaterThan(0);
    // A ~0.1° box near 59°N is a few dozen km².
    expect(area).toBeGreaterThan(20);
    expect(area).toBeLessThan(120);
  });

  it('estimates at least one cell and scales with area', () => {
    const small = estimateCellsInBounds(
      { latitude: 0, longitude: 0 },
      { latitude: 0.0001, longitude: 0.0001 },
    );
    const big = estimateCellsInBounds(
      { latitude: 0, longitude: 0 },
      { latitude: 0.2, longitude: 0.2 },
    );
    expect(small).toBeGreaterThanOrEqual(1);
    expect(big).toBeGreaterThan(small);
  });

  it('clamps the explored percentage to [0, 100]', () => {
    expect(viewExploredPercent(0, 100)).toBe(0);
    expect(viewExploredPercent(50, 100)).toBe(50);
    expect(viewExploredPercent(200, 100)).toBe(100);
    expect(viewExploredPercent(5, 0)).toBe(0);
  });

  it('approximates lifetime area from a cell count', () => {
    expect(approximateAreaKm2(0)).toBe(0);
    expect(approximateAreaKm2(10)).toBeCloseTo(10 * RES9_CELL_AREA_KM2, 6);
  });
});

describe('buildFogOverlay', () => {
  const region: MapRegion = {
    latitude: 59.3293,
    longitude: 18.0686,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  it('always produces a 4-corner outer fog ring', () => {
    expect(buildFogOverlay(region, []).outer).toHaveLength(4);
  });

  it('punches a hole when an explored cell is in view', () => {
    const overlay = buildFogOverlay(region, [CENTER]);
    expect(overlay.holes).toHaveLength(1);
    expect(overlay.exploredInView).toBe(1);
    expect(overlay.estimatedCellsInView).toBeGreaterThan(0);
  });

  it('punches no hole when explored cells are outside the view', () => {
    const elsewhere: MapRegion = { ...region, latitude: 40.0, longitude: -74.0 };
    const overlay = buildFogOverlay(elsewhere, [CENTER]);
    expect(overlay.holes).toHaveLength(0);
    expect(overlay.exploredInView).toBe(0);
  });
});
