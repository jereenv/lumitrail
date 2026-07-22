import { chaikinRing, smoothRings } from './smooth';

const square = [
  { latitude: 0, longitude: 0 },
  { latitude: 0, longitude: 10 },
  { latitude: 10, longitude: 10 },
  { latitude: 10, longitude: 0 },
];

test('one iteration of a closed ring doubles the vertex count', () => {
  expect(chaikinRing(square, 1)).toHaveLength(8);
});

test('new points sit at 1/4 and 3/4 along each edge (incl. the wrap edge)', () => {
  const r = chaikinRing(square, 1);
  // First edge (0,0)->(0,10): Q=0.75A+0.25B, R=0.25A+0.75B
  expect(r[0]).toEqual({ latitude: 0, longitude: 2.5 });
  expect(r[1]).toEqual({ latitude: 0, longitude: 7.5 });
  // Wrap edge (10,0)->(0,0) produces the final two points
  expect(r[6]).toEqual({ latitude: 7.5, longitude: 0 });
  expect(r[7]).toEqual({ latitude: 2.5, longitude: 0 });
});

test('two iterations → 16 points; all points stay within the bounding box', () => {
  const r = chaikinRing(square, 2);
  expect(r).toHaveLength(16);
  for (const p of r) {
    expect(p.latitude).toBeGreaterThanOrEqual(0);
    expect(p.latitude).toBeLessThanOrEqual(10);
    expect(p.longitude).toBeGreaterThanOrEqual(0);
    expect(p.longitude).toBeLessThanOrEqual(10);
  }
});

test('rings with fewer than 3 points are returned unchanged', () => {
  expect(chaikinRing([], 2)).toEqual([]);
  expect(chaikinRing([square[0]], 2)).toEqual([square[0]]);
  expect(chaikinRing([square[0], square[1]], 2)).toHaveLength(2);
});

test('smoothRings maps over a list and skips short rings', () => {
  const out = smoothRings([square, []], 1);
  expect(out[0]).toHaveLength(8);
  expect(out[1]).toEqual([]);
});
