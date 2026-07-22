# Phase 1.5 — Paintbrush reveal + cartoony refresh + new icon — design spec

**Date:** 2026-07-22
**Status:** Approved (design); implementation plan pending
**Author:** Lumitrail team

## Summary

Phase 1 delivered the Mystery-Hike-style map (stylized basemap, green-teal fog,
dashed frontier, region banner). On-device it reads three ways we want to fix:

1. The revealed area's border is a **jagged ring of H3 hexagon edges**, not the
   "live paintbrush" reveal we want.
2. The bottom **region banner crowds the tab bar** and the tab bar's labels are
   clipped by the phone's gesture navigation bar.
3. The whole look is **gloomy** — a dark navy HUD over muted olive fog — where we
   want bright, playful, cartoony, animated.
4. The **app icon** (a dark comet over faint hexagons) is gloomy and does not
   communicate that this is a map-exploration game.

Phase 1.5 addresses all four. It is a **presentation-and-assets-only** change:
`src/domain/geo/fog.ts` and all location/tracking code stay untouched, so the
battery model and the existing fog unit tests are unaffected. The one new
`domain` module (`geo/smooth.ts`) is pure geometry with no side effects.

## Non-goals

- No change to the H3 storage model or the "% uncovered" math. Hexagons remain
  the source of truth; smoothing is a **render-only** skin on top.
- No change to location tracking cadence (battery behavior preserved).
- No POIs, journal, or coins (those are Phases 2–3).
- No new runtime dependency. Chaikin smoothing is ~30 lines of pure math; we do
  NOT add `turf.js` or any geometry library.

## Decisions locked (from brainstorming)

| Question       | Decision                                                            |
| -------------- | ------------------------------------------------------------------- |
| Reveal look    | **Chaikin corner-cutting** smoothing of rendered rings (no deps)    |
| Aesthetic      | **Bright mint & cream** — soft mint fog, cream sticker-cards        |
| App icon       | **"Pin on a revealed map"** — pin + trail + mint fog peeling a corner |

---

## Part A — Paintbrush reveal (Chaikin smoothing)

### The problem, precisely

Revealed area is a set of Uber **H3 res-9 hexagons**. `h3-js`'s
`cellsToMultiPolygon` merges adjacent hexagons into one outline, but that outline
is built from the hexagons' straight edges, so its boundary is a zig-zag of 120°
corners. The fog holes, the fog islands, the dashed frontier polylines, and the
reveal-flash pulse all trace those hard hexagon edges.

### The approach

Add a pure, RN-free module **`src/domain/geo/smooth.ts`**:

```ts
import type { Ring } from './fog';

/**
 * One pass of Chaikin's corner-cutting: every edge P→Q is replaced by two new
 * points at 1/4 and 3/4 along it, rounding off each corner. Treats the ring as
 * a CLOSED loop (last point connects back to first), which keeps the smoothed
 * outline seamless. Returns the input unchanged for rings with < 3 points.
 */
export function chaikinRing(ring: Ring, iterations?: number): Ring;

/** Convenience: smooth every ring in a list (skips empty rings). */
export function smoothRings(rings: Ring[], iterations?: number): Ring[];
```

- Default `iterations = 2` (each pass ≈ doubles vertex count; 2 passes turns the
  hex zig-zag into smooth curves while keeping vertex counts small).
- `Q = 0.25`/`0.75` ratios are the standard Chaikin weights.
- Closed-loop aware: the algorithm wraps around the last→first edge so there is
  no seam or flat spot where the ring closes.

`MapScreen` runs its rings through `smoothRings` before drawing:

- the fog `Polygon`'s `holes` (revealed outlines),
- the `islands`,
- the frontier `Polyline`s,
- the reveal-pulse rings.

The underlying hexagons and all counts are untouched — this is purely how the
edges are drawn.

### The one subtlety

Chaikin nudges the outline slightly **inward** (corner cutting pulls toward the
centroid). At H3 res-9 (~150 m across) and normal map zoom, two passes move the
edge by well under a meter — invisible. We smooth all rings consistently so the
fog fill and the frontier line stay registered to each other. Verified on-device.

### Testing

`src/domain/geo/smooth.test.ts`:

- a square (4 points), 1 iteration → 8 points, each new point on the original
  edges at the 1/4 and 3/4 positions (exact numeric assertions);
- output stays closed / wraps the final edge (first smoothed point derives from
  the last→first edge);
- rings with 0/1/2 points return unchanged;
- 2 iterations → 16 points (count check);
- all resulting points lie within the original ring's bounding box (never
  overshoot).

---

## Part B — Bottom alignment fix (root cause)

**Root cause:** the app-root `SafeAreaView` in `App.tsx` uses
`edges={['top','left','right']}` — it never pads the **bottom**. So `TabBar` sits
flush against the screen edge and the Pixel's gesture bar overlaps the
"Badges/Board" labels. Separately, `MapScreen`'s region banner sits close above
the bar.

**Fix:**

- `TabBar` consumes the bottom safe-area inset itself, via
  `useSafeAreaInsets()` from `react-native-safe-area-context`:
  `paddingBottom: Math.max(spacing.sm, insets.bottom)`. This is the idiomatic
  fix (the bar owns its own safe spacing) and keeps `App.tsx`'s edge list intact.
- `MapScreen`'s `bannerWrap` gains clear spacing above the bar; the FAB column is
  re-checked so nothing overlaps once the bar has correct height.

**Testing:** `TabBar` render test still passes (labels/icons present, active
color); add an assertion that a bottom inset increases bottom padding by mocking
`useSafeAreaInsets`.

---

## Part C — Cartoony "bright mint & cream" refresh

### Palette (add to `src/app/theme.ts`, do not remove existing tokens)

| Token             | Value                       | Use                                          |
| ----------------- | --------------------------- | -------------------------------------------- |
| `fog`             | `rgba(111, 224, 176, 0.55)` | soft glowing mint over unexplored map        |
| `card`            | `#FFF8EC`                   | cream sticker-card surface (HUD, banner)     |
| `cardBorder`      | `#F0E2C8`                   | warm hairline around cards                   |
| `onCard`          | `#26333F`                   | dark ink text on cream cards (readable)      |
| `onCardMuted`     | `#6B7B88`                   | muted label text on cards                    |
| `coral`           | `#FF7A66`                   | playful pop accent (pin, highlights)         |
| `frontier`        | `#FFF3D6`                   | warm-cream dashed frontier line              |
| `frontierCasing`  | `rgba(38, 74, 62, 0.35)`    | soft casing under the dashes                 |
| `shadow`          | `#123027`                   | shadow color for chunky card drop-shadows    |

`ink`/`lumen`/`aurora` etc. stay — the map's dark loading state and other screens
still use them. This is additive.

### UI changes (presentation only)

- **HUD pill** (`MapScreen`): background `palette.card` with a chunky drop-shadow
  (`shadowColor: palette.shadow`, offset/opacity/radius via a shared `cardShadow`
  style object; Android `elevation`), rounded `radii.lg`. Stat text → `onCard`,
  labels → `onCardMuted`.
- **RegionBanner**: same cream sticker-card + shadow treatment; text recolored to
  `onCard`/`onCardMuted`. Its testIDs and text format (`${percent.toFixed(1)}%`)
  are unchanged so its existing test still passes.
- **Frontier line**: recolored via the new `frontier`/`frontierCasing` tokens
  (already read from the palette in `MapScreen`, so this is a token change).
- **Reveal animation** — the "animated" ask. Replace the stepped-alpha `setState`
  fade with React Native's `Animated` API: on a new reveal, a value springs
  `0→1` (`Animated.spring`) driving a **scale pop** (≈`0.6→1.0`) and an opacity
  glow that then fades. Implemented with `Animated` + `useNativeDriver` where
  supported. The pulse still renders the (smoothed) revealed rings; only the
  timing/feel changes. Keep it a self-contained piece so it stays testable.

### Testing

- `MapScreen` test still asserts the region banner percent and that fog/frontier
  render; add nothing brittle about exact colors.
- `RegionBanner` test unchanged (format + testIDs stable).

---

## Part D — New app icon ("pin on a revealed map")

### Concept

A bright rounded-square icon that reads instantly as *uncover-a-real-world-map*:

- **Background:** a soft sky→mint vertical gradient (bright, not navy).
- **Map layer:** a simple cartoony landmass/streets block in cream + mint-green
  with a curvy **trail path** (warm cream, rounded caps) winding across it.
- **Fog:** a wedge of **mint fog peeling off the top-left corner** (a soft
  rounded shape with a slightly wavy edge — echoing the paintbrush reveal),
  showing the bright map emerging from under it.
- **Pin:** a chunky, friendly **map pin** (coral body, cream dot, soft outline
  and drop-shadow) planted center as the focal symbol.
- **Style:** thick rounded strokes, gentle drop shadows, high brightness — a
  sticker/cartoon feel. No comet, no literal hexagons.

### Files (SVG source → PNG, existing pipeline)

Rewrite the SVG sources in `brand/`, then regenerate PNGs with the documented
`sharp-cli` commands (see `brand/README.md`):

- `brand/icon.svg` — master, full-bleed rounded square (the scene above).
- `brand/icon-foreground.svg` — pin + trail + fog wedge, content inside the
  central 66% Android adaptive **safe zone**, transparent background.
- `brand/icon-background.svg` — the sky→mint gradient field only.
- `brand/icon-monochrome.svg` — single-color white **pin silhouette** on
  transparent (Android 13+ themed icon); the pin is the most recognizable
  single shape, so the monochrome is just the pin.
- `brand/README.md` — update the palette table + concept description.

`app.json` already points at the generated `assets/*.png`; the adaptive-icon
`backgroundColor` (currently `#0F1B2D`) is updated to a bright base
(e.g. sky `#BFE9FF`) so any letterboxing matches. Splash `backgroundColor` and
`app.json` `backgroundColor` similarly move to the bright base.

Regenerate the full PNG set (core icons + Android density mipmaps + store
thumbnail/feature-graphic) so launcher, splash, and web favicon all update.
Because `android/` is generated by `prebuild`, the rebuilt APK picks up the new
`assets/` automatically.

### Testing / verification

Icons are visual assets — no unit test. Verified by rebuilding the APK and
confirming on the Pixel: launcher icon, splash screen, and in-app (nothing
references the old comet art in code). We eyeball brightness and legibility at
small sizes.

---

## Files touched (Phase 1.5)

**Code**

- `src/domain/geo/smooth.ts` _(new)_ + `src/domain/geo/smooth.test.ts` _(new)_
- `src/app/theme.ts` — add mint/cream/coral tokens + `cardShadow` values
- `src/presentation/components/TabBar.tsx` — bottom safe-area inset
- `src/presentation/components/RegionBanner.tsx` — cream card styling
- `src/presentation/screens/MapScreen.tsx` — smooth rings, card HUD, animated
  reveal, banner/FAB spacing
- Corresponding test files updated where behavior (not just color) changes

**Assets**

- `brand/icon.svg`, `brand/icon-foreground.svg`, `brand/icon-background.svg`,
  `brand/icon-monochrome.svg`, `brand/README.md`
- Regenerated `assets/*.png` (+ `assets/android/**`, `assets/store/*`)
- `app.json` — bright background colors for adaptive icon / splash

## Testing & verification (whole phase)

- Full gate green: `npm run typecheck`, `npm run lint`, `npm run format:check`,
  `npm test` (new smooth tests added; existing fog/map/banner tests still pass).
- Rebuild release APK, install on the Pixel 10 Pro XL, verify: smooth organic
  reveal border (no hexagons), bright cartoony map + cream cards, animated reveal
  pop, tab bar clear of the gesture bar, and the new launcher/splash icon.

## Risks

- **Chaikin inward drift:** mitigated by low iteration count; verified on-device.
- **Animated reveal perf:** use `useNativeDriver` for opacity/scale; the pulse is
  short-lived and small. Fall back to timed opacity if a driver is unsupported
  for polygon fills (polygon fillColor can't use the native driver — drive a
  React state alpha via `Animated` listener, or keep alpha stepping but add a JS
  spring for feel). Finalized during implementation against what RN can animate.
- **iOS icon:** iOS ignores adaptive layers and uses `icon.png` (master) — it is
  designed full-bleed, so it is covered.

## Architecture & principles

- Fog geometry stays pure and RN-free; smoothing is a separate pure module.
- Smoothing is render-only — storage, sync, and battery model are unchanged.
- Theme changes are additive tokens; no token the rest of the app depends on is
  removed.
</content>
</invoke>
