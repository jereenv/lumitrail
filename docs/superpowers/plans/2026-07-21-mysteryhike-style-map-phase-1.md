# Mystery-Hike-style Map — Phase 1 (The Look) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the map into a Mystery-Hike-like look — a stylized basemap, green-teal fog, a dashed frontier border, a bottom region banner, and a refreshed HUD — with explored areas fully cleared to the bright map beneath.

**Architecture:** Presentation/app layer only. Reuse the pure, tested `domain/geo/fog` geometry unchanged. Add a Google Maps `customMapStyle`, recolor the fog overlay, draw the explored outline as dashed `Polyline`s, and add a `RegionBanner` fed by a mockable reverse-geocode helper. `MapScreen` wires it together.

**Tech Stack:** Expo SDK 57, React Native 0.86, TypeScript (strict), `react-native-maps` 1.27.2 (`MapView`, `Polygon`, `Polyline`, `customMapStyle`), `expo-location` (`reverseGeocodeAsync`), Zustand, jest-expo + @testing-library/react-native v14.

## Global Constraints

- TypeScript strict; **no `any`** anywhere.
- ESLint 9 (flat) and Prettier 3 must pass clean: `npm run lint`, `npm run format:check`.
- All tests via jest; RNTL v14 `render()` is **async** — always `await render(...)`.
- **Original assets only** — never copy Mystery Hike's icons, art, name, or logo.
- Product is **free / no paywall**; nothing here adds one.
- **Do not touch** `src/domain/**` or any location-tracking cadence — battery model must stay unchanged.
- Commit messages: imperative, < 72 chars, **no AI attribution** (no Co-Authored-By / Claude / Copilot).
- Local only — never push, publish, or deploy.
- Git commits run with `-c commit.gpgsign=false` (headless signing is unavailable).

---

## File Structure

- `src/app/mapStyle.ts` _(new)_ — Google Maps style JSON + `MapStyleElement` type. One responsibility: the basemap art.
- `src/app/mapStyle.test.ts` _(new)_ — validity tests.
- `src/app/theme.ts` _(modify)_ — add `palette.fog`, `palette.frontier`, `palette.frontierCasing`.
- `src/data/location/reverseGeocode.ts` _(new)_ — `localityFromAddress` + `createCachedReverseGeocoder` behind a `Geocoder` interface.
- `src/data/location/reverseGeocode.test.ts` _(new)_ — extraction, caching, fail-soft.
- `src/presentation/components/RegionBanner.tsx` _(new)_ — pure presentational bottom pill.
- `src/presentation/components/RegionBanner.test.tsx` _(new)_.
- `src/presentation/components/index.ts` _(modify)_ — export `RegionBanner`.
- `src/presentation/screens/MapScreen.tsx` _(modify)_ — custom style, fog color, frontier polylines, banner + locality wiring, HUD tweak.
- `src/presentation/screens/MapScreen.test.tsx` _(modify)_ — cover `Polyline`, banner, mocked geocoder.

---

### Task 1: Custom map style module

**Files:**

- Create: `src/app/mapStyle.ts`
- Test: `src/app/mapStyle.test.ts`

**Interfaces:**

- Produces: `export interface MapStyleElement { featureType?: string; elementType?: string; stylers: Array<Record<string, string | number>> }` and `export const mapStyle: MapStyleElement[]`.

- [ ] **Step 1: Write the failing test**

```ts
// src/app/mapStyle.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/app/mapStyle -v`
Expected: FAIL — cannot find module `./mapStyle`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/app/mapStyle.ts
/**
 * Google Maps basemap style — a declarative recolor that gives cleared
 * (explored) areas a soft, hand-styled look instead of raw Google Maps:
 * pale land, cream/white roads, soft-blue water, green parks, and hidden
 * clutter (business pins, transit, most local labels). Applied on Android via
 * `<MapView customMapStyle={mapStyle}>`; iOS' Apple Maps ignores it and shows a
 * clean default, which is acceptable for the current Android-first target.
 */
export interface MapStyleElement {
  featureType?: string;
  elementType?: string;
  stylers: Array<Record<string, string | number>>;
}

export const mapStyle: MapStyleElement[] = [
  { elementType: 'geometry', stylers: [{ color: '#eef4e8' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5b6b5a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }, { weight: 2 }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#c7e3b7' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e4e9de' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#ffe6a8' }] },
  { featureType: 'road.local', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#a9d8e6' }] },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/app/mapStyle -v`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/mapStyle.ts src/app/mapStyle.test.ts
git -c commit.gpgsign=false commit -m "Add stylized Google Maps basemap style"
```

---

### Task 2: Theme tokens for fog and frontier

**Files:**

- Modify: `src/app/theme.ts` (the `palette` object, after `fogOverlay`)

**Interfaces:**

- Produces: `palette.fog`, `palette.frontier`, `palette.frontierCasing` (all `string`).

- [ ] **Step 1: Add the tokens**

In `src/app/theme.ts`, inside `palette`, immediately after the `fogOverlay` line, add:

```ts
  /** Green-teal fog painted over UNEXPLORED map (translucent so streets hint through). */
  fog: 'rgba(30, 107, 92, 0.82)',
  /** Dashed frontier border tracing the explored region's edge. */
  frontier: '#FFFFFF',
  /** Dark casing drawn under the frontier dashes for contrast. */
  frontierCasing: 'rgba(17, 42, 36, 0.6)',
```

- [ ] **Step 2: Verify types and formatting**

Run: `npm run typecheck && npm run format:check`
Expected: both pass (the tokens are `string` literals consumed later).

- [ ] **Step 3: Commit**

```bash
git add src/app/theme.ts
git -c commit.gpgsign=false commit -m "Add fog and frontier palette tokens"
```

---

### Task 3: Reverse-geocode helper

**Files:**

- Create: `src/data/location/reverseGeocode.ts`
- Test: `src/data/location/reverseGeocode.test.ts`

**Interfaces:**

- Produces:
  - `export interface GeocodedAddress { city?: string | null; district?: string | null; subregion?: string | null; region?: string | null; name?: string | null }`
  - `export interface Geocoder { reverseGeocodeAsync(location: { latitude: number; longitude: number }): Promise<GeocodedAddress[]> }`
  - `export function localityFromAddress(address: GeocodedAddress | undefined): string | null`
  - `export function createCachedReverseGeocoder(geocoder: Geocoder, options?: { minMoveMeters?: number }): (point: { latitude: number; longitude: number }) => Promise<string | null>`

- [ ] **Step 1: Write the failing test**

```ts
// src/data/location/reverseGeocode.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/data/location/reverseGeocode -v`
Expected: FAIL — cannot find module `./reverseGeocode`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/data/location/reverseGeocode.ts
/**
 * Turns a coordinate into a human locality name (e.g. "Richmond") for the
 * region banner. Wrapped behind a `Geocoder` interface so it is trivially
 * mockable in tests and decoupled from expo-location. The cached variant avoids
 * re-querying while the map pans within a small radius, and fails soft to the
 * last known locality so the banner never goes blank offline.
 */
export interface GeocodedAddress {
  city?: string | null;
  district?: string | null;
  subregion?: string | null;
  region?: string | null;
  name?: string | null;
}

export interface Geocoder {
  reverseGeocodeAsync(location: {
    latitude: number;
    longitude: number;
  }): Promise<GeocodedAddress[]>;
}

interface LatLng {
  latitude: number;
  longitude: number;
}

export function localityFromAddress(address: GeocodedAddress | undefined): string | null {
  if (address === undefined) return null;
  return (
    address.city ?? address.district ?? address.subregion ?? address.region ?? address.name ?? null
  );
}

/** Rough great-circle distance in metres (equirectangular approximation). */
function approxDistanceMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const x = toRad(b.longitude - a.longitude) * Math.cos(toRad((a.latitude + b.latitude) / 2));
  const y = toRad(b.latitude - a.latitude);
  return Math.sqrt(x * x + y * y) * R;
}

export function createCachedReverseGeocoder(
  geocoder: Geocoder,
  options: { minMoveMeters?: number } = {},
): (point: LatLng) => Promise<string | null> {
  const minMove = options.minMoveMeters ?? 500;
  let lastPoint: LatLng | null = null;
  let lastLocality: string | null = null;

  return async (point: LatLng): Promise<string | null> => {
    if (lastPoint !== null && approxDistanceMeters(lastPoint, point) < minMove) {
      return lastLocality;
    }
    try {
      const results = await geocoder.reverseGeocodeAsync({
        latitude: point.latitude,
        longitude: point.longitude,
      });
      lastLocality = localityFromAddress(results[0]);
      lastPoint = point;
      return lastLocality;
    } catch {
      return lastLocality;
    }
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/data/location/reverseGeocode -v`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/data/location/reverseGeocode.ts src/data/location/reverseGeocode.test.ts
git -c commit.gpgsign=false commit -m "Add cached reverse-geocode helper"
```

---

### Task 4: RegionBanner component

**Files:**

- Create: `src/presentation/components/RegionBanner.tsx`
- Test: `src/presentation/components/RegionBanner.test.tsx`
- Modify: `src/presentation/components/index.ts`

**Interfaces:**

- Consumes: `palette`, `radii`, `spacing`, `typography` from `@/app/theme`.
- Produces: `export function RegionBanner(props: { locality: string; percent: number }): React.ReactElement`. Renders `testID="region-banner-name"` and `testID="region-banner-percent"`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/presentation/components/RegionBanner.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';

import { RegionBanner } from './RegionBanner';

describe('RegionBanner', () => {
  it('shows the locality and percent uncovered', async () => {
    const { getByTestId } = await render(<RegionBanner locality="Richmond" percent={0.27} />);
    expect(getByTestId('region-banner-name').props.children).toBe('Richmond');
    expect(getByTestId('region-banner-percent').props.children).toBe('0.3%');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/presentation/components/RegionBanner -v`
Expected: FAIL — cannot find module `./RegionBanner`.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/presentation/components/RegionBanner.tsx
/**
 * Bottom banner showing where you are and how much of the current view you have
 * uncovered — e.g. "Richmond · 0.3%". Pure presentational: all data is passed
 * in as props so it is trivial to test and reuse.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { palette, radii, spacing, typography } from '@/app/theme';

export function RegionBanner({
  locality,
  percent,
}: {
  locality: string;
  percent: number;
}): React.ReactElement {
  return (
    <View style={styles.banner}>
      <Text style={styles.name} testID="region-banner-name" numberOfLines={1}>
        {locality}
      </Text>
      <Text style={styles.percent} testID="region-banner-percent">
        {`${percent.toFixed(1)}%`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(15,27,45,0.9)',
  },
  name: {
    flex: 1,
    fontFamily: typography.display,
    fontSize: typography.sizes.md,
    color: palette.text,
    fontWeight: '700',
  },
  percent: {
    fontFamily: typography.display,
    fontSize: typography.sizes.lg,
    color: palette.lumen,
    fontWeight: '800',
    marginLeft: spacing.md,
  },
});
```

- [ ] **Step 4: Add the barrel export**

In `src/presentation/components/index.ts`, add (keeping alphabetical order with the existing exports):

```ts
export { RegionBanner } from './RegionBanner';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest src/presentation/components/RegionBanner -v`
Expected: PASS (1 test).

- [ ] **Step 6: Commit**

```bash
git add src/presentation/components/RegionBanner.tsx src/presentation/components/RegionBanner.test.tsx src/presentation/components/index.ts
git -c commit.gpgsign=false commit -m "Add RegionBanner component"
```

---

### Task 5: Wire the new look into MapScreen

**Files:**

- Modify: `src/presentation/screens/MapScreen.tsx`
- Modify: `src/presentation/screens/MapScreen.test.tsx`

**Interfaces:**

- Consumes: `mapStyle` (Task 1); `palette.fog/frontier/frontierCasing` (Task 2); `createCachedReverseGeocoder` (Task 3); `RegionBanner` (Task 4); `Polyline` from `react-native-maps`.

- [ ] **Step 1: Update imports**

In `MapScreen.tsx`, change the `react-native-maps` import and add the new imports:

```tsx
import MapView, { Polygon, Polyline, type Region } from 'react-native-maps';
import * as Location from 'expo-location';

import { palette, radii, spacing, typography } from '@/app/theme';
import { mapStyle } from '@/app/mapStyle';
import { createCachedReverseGeocoder } from '@/data/location/reverseGeocode';
import {
  EventToast,
  LevelBadge,
  RegionBanner,
  StreakFlame,
  XpBar,
} from '@/presentation/components';
```

- [ ] **Step 2: Add a module-level cached geocoder and closed-ring helper**

Above the `MapScreen` component, add:

```tsx
/** One cached geocoder for the app session (expo-location matches the Geocoder shape). */
const lookupLocality = createCachedReverseGeocoder(Location);

/** Ensure a ring is a closed loop so Polyline draws the full boundary. */
function closedRing(ring: Ring): Ring {
  if (ring.length === 0) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first.latitude === last.latitude && first.longitude === last.longitude) return ring;
  return [...ring, first];
}
```

- [ ] **Step 3: Add locality state and fetch it when the view centre changes**

Inside the component, after `const viewPct = ...`, add:

```tsx
const [locality, setLocality] = useState<string>('Your area');

useEffect(() => {
  let cancelled = false;
  void lookupLocality({ latitude: region.latitude, longitude: region.longitude }).then((name) => {
    if (!cancelled && name) setLocality(name);
  });
  return () => {
    cancelled = true;
  };
}, [region.latitude, region.longitude]);
```

- [ ] **Step 4: Apply the custom style and recolor the fog**

On the `<MapView>` element, add the `customMapStyle={mapStyle}` prop. Then replace the fog `Polygon` and island polygons so the fill uses `palette.fog` and the strokes are transparent (the frontier is drawn separately in Step 5):

```tsx
{
  /* The fog: one green-teal polygon over the viewport, holes where explored. */
}
<Polygon
  coordinates={overlay.outer}
  holes={overlay.holes}
  fillColor={palette.fog}
  strokeColor="transparent"
  strokeWidth={0}
  tappable={false}
/>;
{
  /* Fog islands: unexplored pockets surrounded by explored land. */
}
{
  overlay.islands.map((ring, i) => (
    <Polygon
      key={`island-${i}`}
      coordinates={ring}
      fillColor={palette.fog}
      strokeColor="transparent"
      strokeWidth={0}
      tappable={false}
    />
  ));
}
```

- [ ] **Step 5: Draw the dashed frontier border**

Immediately after the island polygons (still inside `<MapView>`), add the frontier: a dark casing line under a white dashed line, for every explored outline ring and island ring.

```tsx
{
  /* Dashed frontier border tracing the edge of explored land. */
}
{
  [...overlay.holes, ...overlay.islands].map((ring, i) => {
    const path = closedRing(ring);
    return (
      <React.Fragment key={`frontier-${i}`}>
        <Polyline coordinates={path} strokeColor={palette.frontierCasing} strokeWidth={6} />
        <Polyline
          coordinates={path}
          strokeColor={palette.frontier}
          strokeWidth={3}
          lineDashPattern={[10, 8]}
        />
      </React.Fragment>
    );
  });
}
```

- [ ] **Step 6: Recolor the reveal pulse to warm lumen**

In the reveal-flash block, replace the aurora rgba values with lumen (`255,183,77`):

```tsx
{
  pulseAlpha > 0 &&
    pulseRings.map((ring, i) => (
      <Polygon
        key={`pulse-${i}`}
        coordinates={ring}
        fillColor={`rgba(255,183,77,${pulseAlpha})`}
        strokeColor={`rgba(255,183,77,${Math.min(1, pulseAlpha + 0.35)})`}
        strokeWidth={2}
        tappable={false}
      />
    ));
}
```

- [ ] **Step 7: Move the headline % out of the top HUD**

Delete the `hudPctRow` block from the top HUD (the `<View style={styles.hudPctRow}>…</View>` containing `hudPct` and `hudPctLabel`). Leave the top-row (level/XP/streak) and the stats row intact.

- [ ] **Step 8: Add the RegionBanner at the bottom**

Just before the closing `</View>` of `root` (after the `fabColumn` block), add:

```tsx
{
  /* Bottom region banner: where you are + how much of the view is uncovered. */
}
<SafeAreaView style={styles.bannerWrap} pointerEvents="box-none" edges={['bottom']}>
  <RegionBanner locality={locality} percent={viewPct} />
</SafeAreaView>;
```

And add these styles to the `StyleSheet.create({...})` block (and delete the now-unused `hudPctRow`, `hudPct`, `hudPctLabel` styles):

```tsx
bannerWrap: {
  position: 'absolute',
  left: spacing.md,
  right: spacing.md,
  bottom: spacing.md,
},
```

- [ ] **Step 9: Update the MapScreen test for Polyline + banner + geocoder**

In `MapScreen.test.tsx`, extend the `react-native-maps` mock to include `Polyline`, mock `expo-location` so `reverseGeocodeAsync` resolves, and assert the banner renders. Ensure the mock block matches the existing style (the file already has the justified `eslint-disable` header). Replace the `react-native-maps` mock and add the `expo-location` mock:

```tsx
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Mock = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(View, null, children);
  return {
    __esModule: true,
    default: Mock,
    Polygon: jest.fn(() => null),
    Polyline: jest.fn(() => null),
  };
});

jest.mock('expo-location', () => ({
  __esModule: true,
  reverseGeocodeAsync: jest.fn().mockResolvedValue([{ city: 'Richmond' }]),
}));
```

Then add an assertion in the existing render test (after `await render(<MapScreen />)`):

```tsx
expect(getByTestId('region-banner-percent')).toBeTruthy();
```

(If the store mock does not already provide the fields `MapScreen` reads, keep the existing mock values — this task adds no new store fields.)

- [ ] **Step 10: Run the full gate**

Run: `npm run typecheck && npm run lint && npm run format:check && npm test`
Expected: typecheck/lint/format clean; **all suites pass** (fog's 12 tests plus the new/updated ones). If `format:check` flags a file, run `npx prettier --write <file>` and re-run.

- [ ] **Step 11: Commit**

```bash
git add src/presentation/screens/MapScreen.tsx src/presentation/screens/MapScreen.test.tsx
git -c commit.gpgsign=false commit -m "Restyle MapScreen with fog, frontier, and region banner"
```

---

### Task 6: Build and verify on the device

**Files:** none (build + on-device check + tuning).

- [ ] **Step 1: Rebuild the APK**

```bash
export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"
cd android && ./gradlew :app:assembleRelease && cd ..
cp android/app/build/outputs/apk/release/app-release.apk ~/Desktop/Lumitrail.apk
```

Expected: `BUILD SUCCESSFUL`.

- [ ] **Step 2: Reinstall and launch**

```bash
adb install -r ~/Desktop/Lumitrail.apk
adb shell monkey -p app.lumitrail -c android.intent.category.LAUNCHER 1
```

- [ ] **Step 3: Screenshot and inspect**

```bash
adb exec-out screencap -p > ~/Desktop/lumitrail-look.png
```

Verify: pale stylized basemap, green-teal fog over unexplored area, cleared holes showing the bright map after a demo walk, a dashed white frontier border around explored land, and the bottom region banner ("<locality> · X%"). Tap **Demo walk** to confirm the frontier and clearing.

- [ ] **Step 4: Tune (expected, not a failure)**

Adjust on-device to taste, then rebuild (Steps 1–3):

- Fog too dark/light → change alpha in `palette.fog` (e.g. `0.72`–`0.88`).
- Fog hue → change the RGB (e.g. more blue-green).
- Border too thin/bold → change `strokeWidth` in Task 5 Step 5, or the dash lengths in `lineDashPattern`.
- Basemap colors → edit `mapStyle.ts`.
  Commit any token tweaks:

```bash
git add -A && git -c commit.gpgsign=false commit -m "Tune fog and frontier styling on device"
```

---

## Self-Review

**Spec coverage:**

- Stylized basemap → Task 1 + Task 5 Step 4. ✓
- Green-teal fog → Task 2 + Task 5 Step 4. ✓
- Dashed frontier border → Task 2 + Task 5 Step 5. ✓
- Bottom region banner (locality + %) → Task 3 + Task 4 + Task 5 Steps 3/8. ✓
- HUD refresh (% moved to banner, pulse recolored) → Task 5 Steps 6/7. ✓
- Domain/tracking untouched; battery preserved → no `src/domain` or location-cadence edits in any task. ✓
- Original assets only → no image assets added this phase. ✓
- On-device verification → Task 6. ✓
- Later-phase data contracts → documented in the spec; no code needed in Phase 1 (they are seams, not build items). ✓

**Placeholder scan:** No TBD/TODO; every code step contains full code. ✓

**Type consistency:** `mapStyle: MapStyleElement[]`, `createCachedReverseGeocoder(geocoder, {minMoveMeters})` → `(point)=>Promise<string|null>`, `RegionBanner({locality, percent})`, `closedRing(ring: Ring): Ring`, `Ring` imported in MapScreen (already imported from `@/domain/geo/fog`). Names match across tasks. ✓
