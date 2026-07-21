import { mapStyle } from './mapStyle';

describe('mapStyle', () => {
  it('is a non-empty array of well-formed style elements', () => {
    expect(Array.isArray(mapStyle)).toBe(true);
    expect(mapStyle.length).toBeGreaterThan(0);
    for (const element of mapStyle) {
      expect(Array.isArray(element.stylers)).toBe(true);
      expect(element.stylers.length).toBeGreaterThan(0);
    }
  });

  it('hides business POIs and transit to reduce clutter', () => {
    const hidden = mapStyle.filter(
      (e) =>
        (e.featureType === 'poi' || e.featureType === 'transit') &&
        e.stylers.some((s) => s.visibility === 'off'),
    );
    expect(hidden.length).toBeGreaterThanOrEqual(2);
  });
});
