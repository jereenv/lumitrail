import { BoundingBoxRegionResolver, defaultRegionResolver } from './resolver';
import {
  explorationPercent,
  regionCompletion,
  worldwidePercent,
  WORLD_LAND_CELLS,
} from './exploration';

describe('explorationPercent', () => {
  it('is 0 when nothing is revealed or the target is invalid', () => {
    expect(explorationPercent(0, 100)).toBe(0);
    expect(explorationPercent(50, 0)).toBe(0);
  });

  it('is proportional and clamped to 100', () => {
    expect(explorationPercent(25, 100)).toBe(25);
    expect(explorationPercent(150, 100)).toBe(100);
  });

  it('marks a region complete only at 100%', () => {
    const region = { id: 'X', name: 'X', kind: 'city' as const, targetCells: 100 };
    expect(regionCompletion(region, 99).complete).toBe(false);
    expect(regionCompletion(region, 100).complete).toBe(true);
  });

  it('computes a tiny but non-zero worldwide percentage for real exploration', () => {
    const pct = worldwidePercent(1_400_000);
    expect(pct).toBeCloseTo((1_400_000 / WORLD_LAND_CELLS) * 100, 6);
    expect(pct).toBeGreaterThan(0);
  });
});

describe('region resolver', () => {
  it('resolves Stockholm to country, region and city', () => {
    const path = defaultRegionResolver.resolve({ latitude: 59.33, longitude: 18.06 });
    expect(path.country?.id).toBe('SE');
    expect(path.region?.id).toBe('SE-AB');
    expect(path.city?.id).toBe('SE-STHLM');
  });

  it('resolves a rural point to a country with no city', () => {
    const path = defaultRegionResolver.resolve({ latitude: 64.0, longitude: 16.0 });
    expect(path.country?.id).toBe('SE');
    expect(path.city).toBeUndefined();
  });

  it('resolves open ocean to nothing', () => {
    const path = defaultRegionResolver.resolve({ latitude: 0, longitude: -30 });
    expect(path.country).toBeUndefined();
  });

  it('accepts a custom seed', () => {
    const resolver = new BoundingBoxRegionResolver([
      {
        ref: { id: 'ZZ', name: 'Testland', kind: 'country', targetCells: 10 },
        box: { minLat: -1, maxLat: 1, minLng: -1, maxLng: 1 },
      },
    ]);
    expect(resolver.resolve({ latitude: 0, longitude: 0 }).country?.id).toBe('ZZ');
  });
});
