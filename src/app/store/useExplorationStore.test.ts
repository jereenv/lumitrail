/**
 * Store-level test for the scripted demo walk.
 *
 * The demo walk exists so a first-time user (with no real GPS trail yet) can
 * press one button and watch the fog peel away. For that to be visible, the map
 * camera must travel to wherever the walk is revealing cells — otherwise the
 * cells are revealed correctly in the data but off-screen, and the map looks
 * frozen. The camera is driven by `currentLocation`, so `runDemoWalk` must keep
 * `currentLocation` in step with the fix it is currently processing.
 */

// Force the in-memory fallback stack: make the native device-stack imports fail
// so `init()` falls back to the deterministic MockLocationProvider + in-memory
// repositories. Under jest there is no real GPS, so `currentLocation` starts null.
jest.mock('@/data/location/ExpoLocationProvider', () => {
  throw new Error('native module unavailable in test');
});

import { useExplorationStore } from './useExplorationStore';

// Final point of the scripted route (Day 3 — London, 5th good fix).
const LAST_FIX = { latitude: 51.5074 + 4 * 0.0015, longitude: -0.1278 + 4 * 0.0012 };

describe('useExplorationStore.runDemoWalk', () => {
  it('drives currentLocation to follow the walk so the map camera can track it', async () => {
    await useExplorationStore.getState().init();
    expect(useExplorationStore.getState().isInitialized).toBe(true);

    // Baseline: the in-memory stack has no GPS fix, so nothing has centred the
    // map yet. This is the state a first-time user is in when they tap the demo.
    expect(useExplorationStore.getState().currentLocation).toBeNull();

    await useExplorationStore.getState().runDemoWalk();

    // After the walk, currentLocation must sit on the final revealed fix so the
    // camera followed the trail rather than staying parked on the empty view.
    const loc = useExplorationStore.getState().currentLocation;
    expect(loc).not.toBeNull();
    expect(loc?.latitude).toBeCloseTo(LAST_FIX.latitude, 5);
    expect(loc?.longitude).toBeCloseTo(LAST_FIX.longitude, 5);
  }, 15000);
});
