# Mystery-Hike-style map experience — design spec

**Date:** 2026-07-21
**Status:** Approved (design); Phase 1 pending implementation plan
**Author:** Lumitrail team

## Summary

Evolve Lumitrail's map from a raw Google basemap under a flat dark-blue fog into
a stylized, game-like discovery experience in the spirit of **Mystery Hike** —
green-teal fog burning off a hand-styled map, an explored region bounded by a
dashed frontier border, collectible sticker "treasures" at real places, a
journal of finds, and coins that reward exploration.

We are cloning the **experience and aesthetic**, not the assets. All artwork
(icons, stickers, app icon) is **original**, drawn in our own `brand/` pipeline.
Mystery Hike's name, logo, and image files are copyright/trademark protected and
are never copied — this keeps the app shippable on the Play Store and legally
the user's own.

### "Mystery Hike, but better" — our deliberate advantages

| Dimension      | Mystery Hike                         | Lumitrail                                                            |
| -------------- | ------------------------------------ | -------------------------------------------------------------------- |
| Explored areas | Stay uniformly tinted; only a border | **Fully cleared** — bright styled map, strongest uncovered/left read |
| Battery        | Continuous-ish tracking              | **Geofence-wake + batched, balanced accuracy** (never continuous HF) |
| Price          | Premium upsell / coins economy       | **Free**, no paywall; coins are cosmetic-only, never real money      |
| Offline        | Partial                              | **Offline-first**; conflict-free G-Set CRDT sync                     |
| Assets         | Proprietary                          | **Original**, owned by us                                            |

## Non-goals

- No copying of Mystery Hike's icons, sticker art, name, or logo.
- No real-money paywall or premium tier (product is committed free).
- No backend rewrite this cycle (existing InMemorySync/SyncEngine stands).
- Phase 1 does not add POIs, journal, or coins — only the visual layer.

## Phased roadmap

Each phase is designed → planned → built → verified on a physical device before
the next begins.

- **Phase 1 — The look** _(this cycle)_: stylized basemap, green-teal fog,
  dashed frontier border, bottom region banner, HUD refresh.
- **Phase 2 — Collectibles + journal**: original sticker icon set, POI markers
  placed at real nearby places, a walk-to-collect interaction, a Journal screen.
- **Phase 3 — Coins & rewards**: earn coins for discovery/collecting, a simple
  cosmetic spend surface, wired into existing stats.

## Phase 1 — detailed design

Presentation/app layer only. `src/domain/geo/fog.ts` and all location tracking
are untouched, so battery behavior and the 12 existing fog tests are unaffected.

### 1. Stylized basemap — `customMapStyle`

Add `src/app/mapStyle.ts` exporting a Google Maps style JSON (a declarative
recolor of the basemap, applied via `<MapView customMapStyle={mapStyle}>`):

- Roads → cream/white with a light casing; simplified.
- Water → soft blue; land/landscape → muted green.
- Hide clutter: business POIs, transit, and most labels; keep locality and major
  road labels for orientation.

This is what makes **cleared** (explored) areas read as designed, not generic.
Android uses Google (honours the JSON); iOS' Apple Maps ignores it and simply
shows a clean default — acceptable, since the primary target is Android.

**Testing:** a unit test asserts the export is a non-empty array of well-formed
`{ featureType?, elementType?, stylers: [...] }` entries (guards against
malformed JSON regressing the map to blank).

### 2. Fog — green-teal and translucent

Add `palette.fog` to `src/app/theme.ts` (a teal-green around `#1E6B5C` at ~0.82
alpha; exact hue/alpha finalized on-device). Unexplored area is painted with
`palette.fog` instead of `palette.fogOverlay`; explored holes reveal the bright
styled basemap. Streets stay faintly hinted under fog (mystery preserved).

### 3. Dashed frontier border

The signature Mystery-Hike look. Instead of the current thin solid stroke on the
fog polygon, draw the explored region's boundary as separate `Polyline`s — one
per outline ring, reusing `overlay.holes` and island rings already produced by
`buildFogOverlay`. Style: white dashed line (`lineDashPattern`) over a subtle
darker casing line. The fog `Polygon`'s own stroke becomes transparent, so only
the frontier is dashed (not the viewport edge).

The exact black/white "railroad-tie" texture (a patterned line image) is a
later polish item; Phase 1 ships a clean dashed border.

### 4. Bottom region banner

New `src/presentation/components/RegionBanner.tsx`: a slim bottom pill showing
the current **locality name** and **% uncovered** for the view (mirrors MH's
"Richmond 11 — 0.27%"). Locality comes from `expo-location`
`reverseGeocodeAsync` on the map centre, wrapped in a small data-layer helper:

- `src/data/location/reverseGeocode.ts` — `reverseGeocode(point): Promise<string | null>`,
  behind an interface so it is mockable; caches the last result; returns `null`
  on failure. The banner falls back to "Your area".

**Testing:** helper tested with a mocked geocoder (success, failure→null, cache
hit); `RegionBanner` render test (name + %, and fallback).

### 5. HUD refresh

Top HUD becomes a compact rounded pill: `LevelBadge` + `XpBar` + `StreakFlame`.
The headline "% uncovered" moves from the top to the bottom `RegionBanner`
(matching MH). The three stats (area/distance/cells) remain but slimmer. The
reveal-flash pulse is recolored to warm `palette.lumen` to pop against green.

### 6. Files touched (Phase 1)

- `src/app/mapStyle.ts` _(new)_ + `src/app/mapStyle.test.ts` _(new)_
- `src/app/theme.ts` — add `palette.fog` and frontier border colors
- `src/data/location/reverseGeocode.ts` _(new)_ + test _(new)_
- `src/presentation/components/RegionBanner.tsx` _(new)_ + test _(new)_
- `src/presentation/components/index.ts` — export `RegionBanner`
- `src/presentation/screens/MapScreen.tsx` — custom style, fog color, frontier
  polylines, banner wiring, HUD tweaks
- `src/presentation/screens/MapScreen.test.tsx` — updated for new elements

## Data contracts for later phases (defined now, built later)

So Phase 1 leaves clean seams and Phases 2–3 need no rework:

- **POI (Phase 2):** `interface Poi { id: string; kind: PoiKind; location: GeoPoint;
name?: string; collectedAt?: number }` with `type PoiKind = 'treasure' |
'landmark' | 'mystery' | 'nature' | ...`. A `PoiSource` interface supplies
  nearby POIs (`nearby(center, radiusM): Promise<Poi[]>`), implementable first
  from a deterministic local generator (seeded by H3 cell), later from a real
  places provider — mirrors the existing `LocationProvider` seam.
- **Collectible / journal (Phase 2):** a store slice `collected: Map<string, Poi>`
  plus events (`poiCollected`) reusing the existing reveal/toast pipeline.
- **Coins (Phase 3):** a `coins: number` field alongside `stats`, credited by
  pure functions in `domain/progression` (same shape as XP), never real money.

## Architecture & principles

- Fog geometry stays pure and RN-free in `domain/geo/fog.ts` (unchanged).
- New units are small and single-purpose with mockable interfaces
  (`reverseGeocode`, later `PoiSource`), so each is testable headless.
- No change to tracking cadence → battery model preserved.

## Testing & verification

- Unit tests for every new unit (map style validity, reverse-geocode helper,
  RegionBanner); `MapScreen` test updated.
- Full gate must pass: `typecheck`, `lint`, `format:check`, `test`.
- Real look verified by rebuilding the APK and screenshotting on the physical
  Pixel 10 Pro XL (dial in fog hue/alpha and border weight there).

## Risks

- **iOS styling gap:** Apple Maps ignores the Google style JSON. Accepted;
  Android is the target now. (A future MapLibre/vector-tile backend would give
  identical styling cross-platform — already on the roadmap.)
- **Reverse-geocode rate/availability:** mitigated by caching the last locality
  and failing soft to "Your area".
- **Fog hue legibility:** finalized empirically on-device.
