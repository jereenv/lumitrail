import type { GeoPoint } from '@/domain/geo/types';

import { MockLocationProvider } from './MockLocationProvider';

const FIX: GeoPoint = { latitude: 59.3293, longitude: 18.0686, accuracy: 8, timestamp: 0 };

describe('MockLocationProvider', () => {
  it('delivers fed fixes to active watchers', async () => {
    const provider = new MockLocationProvider();
    const received: GeoPoint[] = [];
    await provider.watchPosition((p) => received.push(p));

    provider.feedAll([FIX, { ...FIX, latitude: 59.33 }]);
    expect(received).toHaveLength(2);
  });

  it('stops delivering after the subscription is removed', async () => {
    const provider = new MockLocationProvider();
    const received: GeoPoint[] = [];
    const sub = await provider.watchPosition((p) => received.push(p));

    provider.feed(FIX);
    sub.remove();
    provider.feed(FIX);
    expect(received).toHaveLength(1);
    expect(provider.watcherCount).toBe(0);
  });

  it('rejects getCurrentPosition when permission is denied', async () => {
    const provider = new MockLocationProvider({ foregroundPermission: 'denied' });
    await expect(provider.getCurrentPosition()).rejects.toThrow(/permission/i);
  });

  it('models GPS signal loss', async () => {
    const provider = new MockLocationProvider();
    provider.feed(FIX);
    await expect(provider.getCurrentPosition()).resolves.toEqual(FIX);

    provider.simulateSignalLoss();
    await expect(provider.getCurrentPosition()).rejects.toThrow(/GPS/i);
  });

  it('refuses to start background updates without background permission', async () => {
    const provider = new MockLocationProvider({ backgroundPermission: 'denied' });
    await expect(provider.startBackgroundUpdates()).rejects.toThrow(/permission/i);
    expect(await provider.isBackgroundActive()).toBe(false);
  });
});
