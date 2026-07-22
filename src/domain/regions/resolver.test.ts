import { regionCenter } from './resolver';

test('regionCenter returns the box centre + padded span for a seeded id', () => {
  const c = regionCenter('GB-LDN'); // box 51.28..51.69, -0.51..0.33
  expect(c).not.toBeNull();
  expect(c!.latitude).toBeCloseTo((51.28 + 51.69) / 2, 5);
  expect(c!.longitude).toBeCloseTo((-0.51 + 0.33) / 2, 5);
  expect(c!.latitudeDelta).toBeGreaterThan(51.69 - 51.28); // padded
  expect(c!.longitudeDelta).toBeGreaterThan(0.33 - -0.51);
});

test('regionCenter returns null for an unknown id', () => {
  expect(regionCenter('ZZ')).toBeNull();
});

test('regionCenter enforces a minimum span for tiny boxes', () => {
  const c = regionCenter('SE-STHLM');
  expect(c!.latitudeDelta).toBeGreaterThanOrEqual(0.02);
});
