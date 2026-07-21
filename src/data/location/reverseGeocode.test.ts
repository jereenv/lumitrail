import { createCachedReverseGeocoder, localityFromAddress, type Geocoder } from './reverseGeocode';

describe('localityFromAddress', () => {
  it('prefers city, then falls back through district/subregion/region/name', () => {
    expect(localityFromAddress({ city: 'Richmond', region: 'VA' })).toBe('Richmond');
    expect(localityFromAddress({ district: 'Manchester' })).toBe('Manchester');
    expect(localityFromAddress({ region: 'Virginia' })).toBe('Virginia');
    expect(localityFromAddress({})).toBeNull();
    expect(localityFromAddress(undefined)).toBeNull();
  });
});

describe('createCachedReverseGeocoder', () => {
  const richmond = { latitude: 37.5407, longitude: -77.436 };

  it('returns the locality from the geocoder', async () => {
    const geocoder: Geocoder = {
      reverseGeocodeAsync: jest.fn().mockResolvedValue([{ city: 'Richmond' }]),
    };
    const lookup = createCachedReverseGeocoder(geocoder);
    expect(await lookup(richmond)).toBe('Richmond');
  });

  it('caches within minMoveMeters (no second geocoder call)', async () => {
    const spy = jest.fn().mockResolvedValue([{ city: 'Richmond' }]);
    const lookup = createCachedReverseGeocoder(
      { reverseGeocodeAsync: spy },
      { minMoveMeters: 500 },
    );
    await lookup(richmond);
    await lookup({ latitude: 37.5408, longitude: -77.4361 }); // ~15 m away
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('re-queries when moved beyond the threshold', async () => {
    const spy = jest
      .fn()
      .mockResolvedValueOnce([{ city: 'Richmond' }])
      .mockResolvedValueOnce([{ city: 'Petersburg' }]);
    const lookup = createCachedReverseGeocoder(
      { reverseGeocodeAsync: spy },
      { minMoveMeters: 500 },
    );
    expect(await lookup(richmond)).toBe('Richmond');
    expect(await lookup({ latitude: 37.227, longitude: -77.402 })).toBe('Petersburg'); // ~35 km
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('fails soft to the last known locality on error', async () => {
    const spy = jest
      .fn()
      .mockResolvedValueOnce([{ city: 'Richmond' }])
      .mockRejectedValueOnce(new Error('offline'));
    const lookup = createCachedReverseGeocoder({ reverseGeocodeAsync: spy }, { minMoveMeters: 0 });
    expect(await lookup(richmond)).toBe('Richmond');
    expect(await lookup({ latitude: 40, longitude: -80 })).toBe('Richmond');
  });
});
