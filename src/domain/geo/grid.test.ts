import {
  cellAreaKm2,
  cellCenter,
  cellForPoint,
  cellsAround,
  distanceMeters,
  isValidH3,
  pathLengthMeters,
} from './grid';
import type { GeoPoint } from './types';

const STOCKHOLM: GeoPoint = { latitude: 59.3293, longitude: 18.0686 };

describe('grid', () => {
  it('maps a point to a valid H3 cell and back to a nearby centre', () => {
    const cell = cellForPoint(STOCKHOLM);
    expect(isValidH3(cell)).toBe(true);
    const centre = cellCenter(cell);
    // The cell centre is within a couple hundred metres of the source point.
    expect(distanceMeters(centre, STOCKHOLM)).toBeLessThan(250);
  });

  it('cellsAround with ring 0 returns just the centre cell', () => {
    expect(cellsAround(STOCKHOLM, 0)).toEqual([cellForPoint(STOCKHOLM)]);
  });

  it('cellsAround with ring 1 returns 7 unique cells including the centre', () => {
    const cells = cellsAround(STOCKHOLM, 1);
    expect(cells).toHaveLength(7);
    expect(new Set(cells).size).toBe(7);
    expect(cells).toContain(cellForPoint(STOCKHOLM));
  });

  it('reports a plausible res-9 cell area', () => {
    const area = cellAreaKm2(cellForPoint(STOCKHOLM));
    expect(area).toBeGreaterThan(0.05);
    expect(area).toBeLessThan(0.2);
  });

  it('computes haversine distance symmetrically', () => {
    const other: GeoPoint = { latitude: 59.334, longitude: 18.07 };
    const there = distanceMeters(STOCKHOLM, other);
    const back = distanceMeters(other, STOCKHOLM);
    expect(there).toBeCloseTo(back, 6);
    expect(there).toBeGreaterThan(0);
  });

  it('sums a path length but excludes teleport segments', () => {
    const near: GeoPoint[] = [
      { latitude: 59.3293, longitude: 18.0686 },
      { latitude: 59.3303, longitude: 18.0686 },
      { latitude: 59.3313, longitude: 18.0686 },
    ];
    const withoutTeleport = pathLengthMeters(near, 5000);
    expect(withoutTeleport).toBeGreaterThan(150);

    const withJump: GeoPoint[] = [...near, { latitude: 40.0, longitude: -74.0 }];
    // The transatlantic jump must not be counted.
    expect(pathLengthMeters(withJump, 5000)).toBeCloseTo(withoutTeleport, 6);
  });
});
