import { cellForPoint } from '@/domain/geo/grid';
import type { GeoPoint, H3Index } from '@/domain/geo/types';

import { revealAt } from './reveal';

const POINT: GeoPoint = { latitude: 59.3293, longitude: 18.0686, accuracy: 10 };

describe('revealAt', () => {
  it('reveals a full ring of new cells from an empty known set', () => {
    const result = revealAt(new Set<H3Index>(), POINT);
    expect(result.rejected).toBe(false);
    expect(result.newCells).toHaveLength(7);
    expect(result.alreadyKnown).toHaveLength(0);
  });

  it('does not re-reveal cells that are already known', () => {
    const known = new Set<H3Index>([cellForPoint(POINT)]);
    const result = revealAt(known, POINT);
    expect(result.newCells).toHaveLength(6);
    expect(result.alreadyKnown).toEqual([cellForPoint(POINT)]);
  });

  it('reveals only the centre cell for a poor-but-usable fix', () => {
    const poor: GeoPoint = { ...POINT, accuracy: 120 };
    const result = revealAt(new Set<H3Index>(), poor);
    expect(result.rejected).toBe(false);
    expect(result.newCells).toEqual([cellForPoint(poor)]);
  });

  it('rejects a fix that is too inaccurate to trust', () => {
    const bad: GeoPoint = { ...POINT, accuracy: 500 };
    const result = revealAt(new Set<H3Index>(), bad);
    expect(result.rejected).toBe(true);
    expect(result.newCells).toHaveLength(0);
  });

  it('treats a missing accuracy value as trustworthy (full ring)', () => {
    const noAccuracy: GeoPoint = { latitude: 59.3293, longitude: 18.0686 };
    expect(revealAt(new Set<H3Index>(), noAccuracy).newCells).toHaveLength(7);
  });
});
