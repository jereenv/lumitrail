# Wave 0 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the shared design system, pure paintbrush geometry, cross-tab navigation wiring, tab-bar fix, bright app shell, and new icon that every page in Wave 1 depends on.

**Architecture:** Presentation + assets + light-wiring only. The pure `domain` layer is untouched except one additive pure module (`geo/smooth.ts`) and one additive pure helper (`regionCenter` in `regions/resolver.ts`). Cross-tab coordination uses a small dedicated Zustand navigation store, not a router.

**Tech Stack:** Expo SDK 57, React Native 0.86, React 19.2, TypeScript strict (no `any`), Zustand, react-native-maps, react-native-safe-area-context, jest-expo + @testing-library/react-native v14 (`render()` is async — always `await render()`).

## Global Constraints

- TypeScript strict; no `any`. Match existing file style, JSDoc header per file.
- Do NOT edit the pure fog/tracking domain (`geo/fog.ts`, `loop/`, tracking). Additive pure modules only.
- All new colors come from `src/app/theme.ts` tokens — never hard-code hex in components.
- Tab **values** stay `map | stats | achievements | leaderboard | friends | settings`. Only the visible **labels** change to game-voice.
- `RegionBanner` public API + testIDs (`region-banner-name`, `region-banner-percent`) and the `${percent.toFixed(1)}%` format must not change.
- Full gate must pass after every task: `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test`.
- Reuse existing types: viewport = `MapRegion` from `@/domain/geo/fog` (`{latitude, longitude, latitudeDelta, longitudeDelta}`).

---

### Task 1: Design tokens + shared style helpers

**Files:**
- Modify: `src/app/theme.ts`
- Test: `src/app/theme.test.ts` (create if absent)

**Interfaces:**
- Produces: new `palette` keys and two new exports `cardShadow` and `motion`.

- [ ] **Step 1: Write the failing test**

```ts
import { palette, cardShadow, motion } from './theme';

test('game palette tokens exist and are strings', () => {
  for (const key of ['fog','canvas','card','cardBorder','onCard','onCardMuted','coral','berry','frontier','frontierCasing','shadow'] as const) {
    expect(typeof palette[key]).toBe('string');
    expect(palette[key].length).toBeGreaterThan(0);
  }
});

test('cardShadow and motion helpers are shaped correctly', () => {
  expect(cardShadow.shadowColor).toBe(palette.shadow);
  expect(typeof cardShadow.elevation).toBe('number');
  expect(motion.spring.damping).toBeGreaterThan(0);
  expect(motion.durations.short).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run test, verify it fails** — `npm test -- theme` → FAIL (missing exports).

- [ ] **Step 3: Implement.** Add to `palette` (keep all existing keys):

```ts
  fog: 'rgba(111, 224, 176, 0.55)',
  canvas: '#EAF7F1',
  card: '#FFF8EC',
  cardBorder: '#F0E2C8',
  onCard: '#26333F',
  onCardMuted: '#6B7B88',
  coral: '#FF7A66',
  berry: '#B57BFF',
  frontier: '#FFF3D6',
  frontierCasing: 'rgba(38, 74, 62, 0.35)',
  shadow: '#123027',
```
Replace the OLD `fog`/`frontier`/`frontierCasing` values with these (do not add duplicate keys). Then add:

```ts
export const cardShadow = {
  shadowColor: palette.shadow,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.18,
  shadowRadius: 10,
  elevation: 5,
} as const;

export const motion = {
  spring: { damping: 14, stiffness: 160, mass: 1 },
  durations: { short: 160, medium: 280, long: 480 },
} as const;
```
Add `cardShadow` and `motion` to the exported `theme` object.

- [ ] **Step 4: Run test, verify pass.**
- [ ] **Step 5: Commit** — `feat: add cartoony game design tokens`.

---

### Task 2: Paintbrush geometry — `geo/smooth.ts` (Chaikin)

**Files:**
- Create: `src/domain/geo/smooth.ts`
- Test: `src/domain/geo/smooth.test.ts`

**Interfaces:**
- Consumes: `Ring` from `@/domain/geo/fog` (`Coordinates[]`, `Coordinates = {latitude, longitude}`).
- Produces: `chaikinRing(ring: Ring, iterations?: number): Ring`, `smoothRings(rings: Ring[], iterations?: number): Ring[]`.

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test, verify it fails.**

- [ ] **Step 3: Implement**

```ts
/**
 * Chaikin corner-cutting — smooths a jagged ring into organic curves.
 *
 * The revealed area is stored as H3 hexagons, so `cellsToMultiPolygon` yields
 * outlines made of straight hex edges (a zig-zag of 120° corners). This module
 * rounds those corners for a "paintbrush" look. It is RENDER-ONLY: the hexagons
 * and all completion math are untouched. Pure and RN-free, like the rest of
 * `domain/geo`.
 *
 * Each pass replaces every edge P→Q with two points at 1/4 and 3/4 along it,
 * treating the ring as a CLOSED loop (the last→first edge is cut too), so the
 * smoothed outline has no seam. Two passes turn hex zig-zags into smooth curves
 * while keeping vertex counts small (each pass doubles the count).
 */
import type { Ring } from './fog';

const Q_NEAR = 0.75;
const Q_FAR = 0.25;

function onePass(ring: Ring): Ring {
  const n = ring.length;
  const out: Ring = [];
  for (let i = 0; i < n; i += 1) {
    const a = ring[i];
    const b = ring[(i + 1) % n];
    out.push({
      latitude: Q_NEAR * a.latitude + Q_FAR * b.latitude,
      longitude: Q_NEAR * a.longitude + Q_FAR * b.longitude,
    });
    out.push({
      latitude: Q_FAR * a.latitude + Q_NEAR * b.latitude,
      longitude: Q_FAR * a.longitude + Q_NEAR * b.longitude,
    });
  }
  return out;
}

/** Smooth one closed ring. Rings with < 3 points are returned unchanged. */
export function chaikinRing(ring: Ring, iterations = 2): Ring {
  if (ring.length < 3) return ring;
  let result = ring;
  for (let i = 0; i < iterations; i += 1) {
    result = onePass(result);
  }
  return result;
}

/** Smooth every ring in a list (short rings pass through unchanged). */
export function smoothRings(rings: Ring[], iterations = 2): Ring[] {
  return rings.map((ring) => chaikinRing(ring, iterations));
}
```

- [ ] **Step 4: Run test, verify pass.**
- [ ] **Step 5: Commit** — `feat: add Chaikin ring smoothing for paintbrush reveal`.

---

### Task 3: `regionCenter` helper (fly-to coordinates)

**Files:**
- Modify: `src/domain/regions/resolver.ts` (add exported function using module-scoped `SEED`)
- Test: `src/domain/regions/resolver.test.ts` (add cases; create if absent)

**Interfaces:**
- Consumes: `MapRegion` from `@/domain/geo/fog`, the module-local `SEED` array.
- Produces: `regionCenter(id: string): MapRegion | null`.

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test, verify fails.**

- [ ] **Step 3: Implement** — add to `resolver.ts` (imports `MapRegion`), after `SEED`:

```ts
import type { MapRegion } from '@/domain/geo/fog';

const SPAN_PADDING = 1.15;
const MIN_SPAN_DEG = 0.02;

/**
 * Centre + span of a seeded region, suitable for `animateToRegion`. Returns
 * null when the id is not in the seed set. Coarse (bounding-box) but good
 * enough to fly the map to a region tapped in the Journey screen.
 */
export function regionCenter(id: string): MapRegion | null {
  const entry = SEED.find((e) => e.ref.id === id);
  if (!entry) return null;
  const { minLat, maxLat, minLng, maxLng } = entry.box;
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(MIN_SPAN_DEG, (maxLat - minLat) * SPAN_PADDING),
    longitudeDelta: Math.max(MIN_SPAN_DEG, (maxLng - minLng) * SPAN_PADDING),
  };
}
```

- [ ] **Step 4: Run test, verify pass.**
- [ ] **Step 5: Commit** — `feat: add regionCenter for map fly-to`.

---

### Task 4: Navigation store — `activeTab` + `focusTarget`

**Files:**
- Create: `src/app/store/useNavigationStore.ts`
- Test: `src/app/store/useNavigationStore.test.ts`
- Modify: `src/presentation/components/TabBar.tsx` (import `TabId` from the store, re-export it so existing imports keep working)

**Interfaces:**
- Produces:
  - `type TabId = 'map' | 'stats' | 'achievements' | 'leaderboard' | 'friends' | 'settings'`
  - `interface MapFocus extends MapRegion { readonly label?: string }`
  - store state `{ activeTab: TabId; focusTarget: MapFocus | null }`
  - actions `setActiveTab(tab)`, `focusMap(target: MapFocus)` (sets focus AND switches to `'map'`), `clearMapFocus()`

- [ ] **Step 1: Write the failing test**

```ts
import { useNavigationStore } from './useNavigationStore';

beforeEach(() => {
  useNavigationStore.setState({ activeTab: 'map', focusTarget: null });
});

test('setActiveTab switches tab', () => {
  useNavigationStore.getState().setActiveTab('stats');
  expect(useNavigationStore.getState().activeTab).toBe('stats');
});

test('focusMap sets the target and jumps to the map tab', () => {
  const target = { latitude: 51.5, longitude: -0.1, latitudeDelta: 0.4, longitudeDelta: 0.8, label: 'London' };
  useNavigationStore.getState().setActiveTab('stats');
  useNavigationStore.getState().focusMap(target);
  expect(useNavigationStore.getState().focusTarget).toEqual(target);
  expect(useNavigationStore.getState().activeTab).toBe('map');
});

test('clearMapFocus resets only the focus', () => {
  useNavigationStore.getState().focusMap({ latitude: 1, longitude: 2, latitudeDelta: 0.1, longitudeDelta: 0.1 });
  useNavigationStore.getState().clearMapFocus();
  expect(useNavigationStore.getState().focusTarget).toBeNull();
  expect(useNavigationStore.getState().activeTab).toBe('map');
});
```

- [ ] **Step 2: Run test, verify fails.**

- [ ] **Step 3: Implement** `useNavigationStore.ts`:

```ts
/**
 * App navigation state — kept separate from game/domain state.
 *
 * `activeTab` drives which screen the shell renders. `focusTarget` lets any
 * screen command the map to fly somewhere (e.g. tapping a region in Journey):
 * the setter also switches to the map tab, and MapScreen clears it after it has
 * animated. This is the "one screen sets a value, another reacts" pattern —
 * cross-screen coordination without a router.
 */
import { create } from 'zustand';

import type { MapRegion } from '@/domain/geo/fog';

export type TabId = 'map' | 'stats' | 'achievements' | 'leaderboard' | 'friends' | 'settings';

export interface MapFocus extends MapRegion {
  readonly label?: string;
}

interface NavigationState {
  activeTab: TabId;
  focusTarget: MapFocus | null;
  setActiveTab: (tab: TabId) => void;
  focusMap: (target: MapFocus) => void;
  clearMapFocus: () => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  activeTab: 'map',
  focusTarget: null,
  setActiveTab: (tab) => set({ activeTab: tab }),
  focusMap: (target) => set({ focusTarget: target, activeTab: 'map' }),
  clearMapFocus: () => set({ focusTarget: null }),
}));
```

In `TabBar.tsx`, replace the local `TabId` declaration with:
`import type { TabId } from '@/app/store/useNavigationStore';` and `export type { TabId };` (keeps `import type { TabId } from '@/presentation/components'` valid).

- [ ] **Step 4: Run test + typecheck, verify pass.**
- [ ] **Step 5: Commit** — `feat: add navigation store for tab + map focus`.

---

### Task 5: App shell — store-driven tabs, game-voice labels, safe-area fix, bright background

**Files:**
- Modify: `App.tsx`, `src/presentation/components/TabBar.tsx`
- Test: `src/presentation/components/TabBar.test.tsx` (update/create)

**Interfaces:**
- Consumes: `useNavigationStore` (Task 4), `useSafeAreaInsets` from `react-native-safe-area-context`.

- [ ] **Step 1: Update the failing test** — assert game-voice labels render and a bottom inset increases bottom padding. Mock `useSafeAreaInsets`:

```ts
jest.mock('react-native-safe-area-context', () => ({
  ...jest.requireActual('react-native-safe-area-context'),
  useSafeAreaInsets: () => ({ top: 0, bottom: 34, left: 0, right: 0 }),
}));
```
Assert the bar renders labels `Explore`, `Journey`, `Trophies`, `Ranks`, `Crew`, `Settings`.

- [ ] **Step 2: Run, verify fails.**

- [ ] **Step 3: Implement.**
  - `TabBar.tsx`: label map → `Explore/Journey/Trophies/Ranks/Crew/Settings` (icons keep or refresh); container `paddingBottom: Math.max(spacing.sm, insets.bottom)` via `useSafeAreaInsets()`; restyle container to `palette.card` top edge with a soft top border and `cardShadow` (upward) — active tint `palette.coral`, inactive `palette.onCardMuted`.
  - `App.tsx`: read `activeTab` + `setActiveTab` from `useNavigationStore` (remove the local `useState<TabId>`); pass them to `<TabBar activeTab={activeTab} onTabPress={setActiveTab} />`; change `safeArea`/`content` background to `palette.canvas`; keep onboarding flow.

- [ ] **Step 4: Run test + typecheck, verify pass.**
- [ ] **Step 5: Commit** — `feat: game-voice tabs, safe-area fix, bright app shell`.

---

### Task 6: Shared UI primitives

**Files:**
- Create: `src/presentation/components/GameCard.tsx`, `SectionHeader.tsx`, `Avatar.tsx`, `Medal.tsx`, `PodiumRow.tsx`, `AnimatedNumber.tsx`
- Modify: `src/presentation/components/index.ts` (export all new ones)
- Modify (restyle to tokens, keep public props + tests): `StatCard.tsx`, `ScreenHeader.tsx`, `ProgressRing.tsx`, `LevelBadge.tsx`, `XpBar.tsx`, `AchievementBadge.tsx`, `StreakFlame.tsx`, `RegionBanner.tsx`, `EventToast.tsx`
- Test: one render test per NEW component (e.g. `GameCard.test.tsx`, `Medal.test.tsx`, `PodiumRow.test.tsx`, `Avatar.test.tsx`, `AnimatedNumber.test.tsx`)

**Interfaces (Produces — page owners build against these):**
- `GameCard({ children, onPress?, accent?, style?, testID? })` — cream sticker-card: `palette.card`, `radii.lg`, `borderColor: palette.cardBorder`, `cardShadow`; if `onPress`, wrap in `Pressable` with a subtle scale-press (`motion.spring`); optional left `accent` stripe color.
- `SectionHeader({ title, action? })` — playful title (`typography.display`, `palette.onCard`) + optional right action node.
- `Avatar({ name, level?, size?, imageUri? })` — round bubble showing initial (or image); when `level` given, draws a `ProgressRing`-style ring around it colored `palette.coral`.
- `Medal({ tier, size?, locked?, progress? })` — `tier: 'bronze'|'silver'|'gold'|'platinum'` (use `tierColors`); locked → dim + optional `progress` (0..1) ring.
- `PodiumRow({ entries })` — `entries: {rank:1|2|3, name, value, you?}[]`; renders three pedestals (2-1-3 arrangement, gold tallest) using `Medal` + `Avatar`.
- `AnimatedNumber({ value, format?, duration? })` — animates from previous to `value` using `Animated` (JS-driven) and renders `format(current)`.

- [ ] **Step 1:** For each NEW component, write a render test (mount with minimal props via `await render()`, assert key text/testID present; for `AnimatedNumber`, assert it eventually shows the target formatted value; for `PodiumRow`, assert all three names render).
- [ ] **Step 2:** Run, verify fail.
- [ ] **Step 3:** Implement each component using ONLY theme tokens; restyle the existing components to the cream/card look without changing their prop APIs or testIDs. `RegionBanner` keeps its testIDs + percent format exactly.
- [ ] **Step 4:** Run full test suite + typecheck, verify pass (existing component tests still green).
- [ ] **Step 5: Commit** — `feat: add shared game UI primitives and restyle base components`.

> Right-sizing note: if Task 6 is too large for one implementer, split into 6a (new primitives) and 6b (restyle existing). Both are independently testable.

---

### Task 7: New app icon — "pin on a revealed map"

**Files:**
- Rewrite: `brand/icon.svg`, `brand/icon-foreground.svg`, `brand/icon-background.svg`, `brand/icon-monochrome.svg`
- Modify: `brand/README.md` (palette table + concept), `app.json` (bright background colors)
- Regenerate: `assets/*.png` (+ `assets/android/**`, `assets/store/thumbnail.png`, `assets/store/feature-graphic.png`) via the documented `sharp-cli` commands

**Interfaces:** none (visual assets).

- [ ] **Step 1:** Rewrite the four SVGs to the concept in the companion spec Part D:
  - `icon-background.svg`: sky→mint vertical gradient (`#BFE9FF` → `#6FE0B0`), full 1024² rounded field.
  - `icon-foreground.svg`: within the central 66% safe zone — a cartoony map block (cream + mint) with a curvy warm-cream **trail** (rounded caps), a wedge of **mint fog peeling off the top-left** (soft wavy edge), and a chunky **coral map pin** (`#FF7A66` body, cream dot, soft outline + drop-shadow) centered. Transparent background.
  - `icon.svg`: master = background gradient + the foreground scene, full-bleed with implied OS rounding.
  - `icon-monochrome.svg`: single white **pin silhouette** on transparent.
  No comet, no literal hexagons.
- [ ] **Step 2:** Regenerate every PNG with the exact `sharp-cli` commands in `brand/README.md` ("Regenerate all PNGs at once").
- [ ] **Step 3:** In `app.json`, set the adaptive-icon `backgroundColor`, top-level `backgroundColor`, and splash `backgroundColor` from `#0F1B2D` to the bright base `#BFE9FF` (keep splash image = `splash-icon.png`).
- [ ] **Step 4:** Update `brand/README.md` palette table + the icon concept description. Run `npm run format:check` (SVG/JSON ignored or formatted as configured) and `npm run typecheck` (no code change, sanity).
- [ ] **Step 5: Commit** — `feat: new bright pin-on-a-map app icon`.

---

## Wave 0 exit criteria

- Full gate green (`typecheck`, `lint`, `format:check`, `test`), all tasks committed.
- Ledger updated. Shared files (`theme.ts`, `useNavigationStore.ts`, `index.ts`, `App.tsx`, `TabBar.tsx`) are now FROZEN for parallel Wave 1 (edited again only in the Wave 2 integration).
- Interfaces published to Wave 1 owners: token names, `cardShadow`/`motion`, `chaikinRing`/`smoothRings`, `regionCenter`, `useNavigationStore` (`focusMap`/`setActiveTab`/`focusTarget`/`clearMapFocus`), and the primitive component APIs above.
</content>
