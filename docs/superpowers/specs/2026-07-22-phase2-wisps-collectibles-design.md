# Phase 2 — Wisps: Collectibles & Journal (Design Spec)

**Date:** 2026-07-22
**Status:** Approved (design), pending implementation plan

## Goal

Add a collectible-discovery layer to Lumitrail — **Wisps**, motes of light trapped in
the fog that the player gathers by exploring — plus a Collection view and a re-themed
onboarding that frames the world around this fiction. This turns the existing
fog-of-war reveal from "painting a map" into "discovering what the fog was hiding,"
giving the app the mystery / world-feel of Mystery Hike and Pokémon GO.

## World Fiction

The fog is not empty darkness — it holds light captive. Scattered across the real
world are **Wisps**: motes of living light trapped in the fog. When the player's
walking reveals the ground a Wisp rests on, it stirs and is gathered into their
Journal. Each Wisp has a name, a rarity, a line of lore, and a real-world home
location. This reframes the core reveal mechanic as discovery.

Rarity tiers: **Common**, **Rare**, **Radiant** (rarest). Rarity drives the color and
glow intensity of the Wisp everywhere it appears (discovery card, journal tile).

## Architecture

The feature is almost entirely **additive** and mirrors the existing achievements
system (a static catalog + pure evaluation + a gallery screen). It fits the current
patterns with **no new persistence table and no SQLite migration** — collected Wisp
IDs live in the existing JSON snapshot blob alongside `unlockedAchievements`.

Discovery is **reveal-triggered**: a Wisp is discovered the moment the player reveals
the H3 cell it sits in. No new GPS-proximity math — the existing reveal disc already
determines "you've been here." This is computed in the pure `applyFix` function, so
it is deterministic and unit-testable.

**Key tradeoff (approved):** the Wisp is committed to `collectedWisps` the instant its
cell is revealed (in the pure domain). The tap-to-collect discovery card is a
*celebration* of an already-secured find, not the thing that saves it. This keeps the
domain pure (no "pending/unclaimed" queue) and makes it impossible to lose a Wisp by
dismissing the card. The player still gets the full "catch" moment.

**Tech stack:** existing — TypeScript strict, React Native / Expo SDK 57, Zustand
store, h3-js grid, react-native-maps, react-native-svg, jest-expo +
@testing-library/react-native. No new dependencies.

## Global Constraints

- TypeScript strict; no `any`. No hard-coded hex in styles — use `@/app/theme` tokens
  (`palette`, `radii`, `spacing`, `typography`, `cardShadow`, `motion`).
- The following files are **frozen** by prior waves and must not change their public
  contracts: `src/app/theme.ts`, `src/app/store/useNavigationStore.ts`,
  `src/presentation/components/index.ts` exports, `App.tsx`/`TabBar.tsx` tab structure
  (no 7th tab — see UI section).
- Collectibles are **on-device only**. No server sync, no new network calls. The
  existing sync outbox is not extended for Wisps.
- Domain layer (`src/domain/**`) stays pure and RN-free. Detection logic lives in
  `applyFix`; no React or SDK imports in domain.
- Persistence must be backward-compatible: old snapshots without `collectedWisps` load
  cleanly (treated as empty). No schema/`user_version` migration.
- All new domain logic is covered by table-driven tests. Existing 241 tests stay green.
- Commit hygiene: stage only the files a task owns; no `git add -A`. No AI attribution
  in commits.

## Data Model

### Wisp catalog — `src/domain/wisps/catalog.ts` (new)

```ts
export type WispRarity = 'common' | 'rare' | 'radiant';

export interface WispDefinition {
  readonly id: string;        // stable slug, e.g. 'se-sthlm-gamla-stan'
  readonly name: string;      // e.g. 'Emberwisp of Gamla Stan'
  readonly lore: string;      // one-line flavor text
  readonly rarity: WispRarity;
  readonly latitude: number;
  readonly longitude: number;
}

export const WISPS: readonly WispDefinition[];              // static hand-authored list
export const WISPS_BY_ID: ReadonlyMap<string, WispDefinition>;
export const WISPS_BY_CELL: ReadonlyMap<H3Index, WispDefinition>; // cellForPoint per wisp
```

- `WISPS_BY_CELL` is built once at module load via `cellForPoint({latitude, longitude})`
  at `REVEAL_RESOLUTION` (9). If two Wisps map to the same cell, that is an authoring
  error — a dev-time invariant test asserts all cells are unique.
- **Seeding:** dense along the demo route so a Demo Walk discovers several — roughly
  6 in central Stockholm (matching the demo's day-1/day-2 fixes near 59.32–59.35,
  18.05–18.08) and 4 in London (near 51.50–51.52, -0.13–-0.12), plus ~4–6 famous
  world landmarks. Target ~16–18 total Wisps for launch.

### PlayerState — `src/domain/loop/state.ts`

Add:
```ts
readonly collectedWisps: ReadonlySet<string>; // wisp ids gathered
```
Initialized to `new Set()` in `createPlayerState`.

### PlayerStats — `src/domain/loop/state.ts`

Add a counter so achievements can gate on it:
```ts
readonly wispsGathered: number;
```
Added to `INITIAL_STATS` as `0`.

### DomainEvent — `src/domain/loop/events.ts`

Add to the union:
```ts
| { readonly type: 'wispFound'; readonly wispId: string }
```

### PlayerSnapshot — `src/data/persistence/snapshot.ts`

Add `readonly collectedWisps: readonly string[]`. In `toSnapshot`: spread the set to an
array. In `fromSnapshot`: `new Set(snapshot.collectedWisps ?? [])` (the `?? []` is the
backward-compat fallback). `wispsGathered` rides along inside the existing `stats`
object automatically.

## Data Flow

1. `ExplorationService.processFix(point)` → pure `applyFix(state, point, ctx)`.
2. In `applyFix`, after `cellsRevealed` is computed (`reveal.newCells`), intersect
   those cells with `WISPS_BY_CELL`. For each hit whose id is not already in
   `state.collectedWisps`:
   - add id to the next `collectedWisps` set,
   - increment `stats.wispsGathered`,
   - push `{ type: 'wispFound', wispId }` to the events array.
3. Events flow through the store into `recentEvents` (existing, capped 10 newest-first).
4. **Discovery card:** `MapScreen` watches `recentEvents` for `wispFound` (same pattern
   as the reveal pulse's `lastPulsedRef` guard so old events don't re-fire on remount).
   New `wispFound` events enqueue a `WispDiscoveryCard`. The card looks up the Wisp in
   `WISPS_BY_ID`. Because the Wisp is already in `collectedWisps`, the card is purely
   presentational — dismissing it never loses data. Multiple simultaneous finds queue.
5. `EventToast` also gains a `case 'wispFound'` so there is a lightweight record in the
   toast stream (the card is the headline moment; the toast is the log line).

## Components & Screens

### WispDiscoveryCard — `src/presentation/components/wisps/WispDiscoveryCard.tsx` (new)

- Full-screen dimmed backdrop + centered card, shown as an overlay on `MapScreen`
  (not a navigation route — the app uses conditional rendering, no router).
- Enters as a shimmering unidentified orb (rarity-colored glow). Tap → orb bursts
  (`Animated` scale/opacity spring using `motion.spring`) and resolves to reveal:
  Wisp name, rarity label, lore line, and "Added to Journal."
- Tap again / "Continue" dismisses; the next queued card (if any) animates in.
- Rarity → color mapping (from theme tokens): common → `palette.aurora`/mint,
  rare → `palette.coral`, radiant → `palette.berry` with the strongest glow.
- Props: `{ wisp: WispDefinition; onDismiss: () => void }`. Pure/presentational.

### Collection section inside Trophies — `AchievementsScreen`

- Add a segmented control at the top: **Trophies | Collection** (two segments in the
  same screen; the tab stays "Trophies" 🏅, no new tab).
- **Collection segment** shows:
  - A header with a `ProgressRing` (reused) and "N / M gathered".
  - A grid of Wisp tiles grouped by rarity. Gathered → the Wisp glows with its name +
    rarity. Undiscovered → a fog-silhouette "???" mystery tile (no name/location leaked)
    to drive the hunt.
  - Tapping a gathered tile opens a small detail (name, rarity, lore, where found —
    reuse the discovery card's resolved layout or a simple sheet). Undiscovered tiles
    show only a teasing "Hidden in the fog" line.
- Reads `playerState.collectedWisps` from `useExplorationStore` (same as achievements
  read `unlockedAchievements`). New page-local sub-components live under
  `src/presentation/components/trophies/` or `.../wisps/`.

### Onboarding re-theme — `src/presentation/screens/OnboardingScreen.tsx`

Rewrite the 3 slides around the Wisp fiction with genuine atmosphere (bright *and*
moody — not flat):
- **Slide 1 (hook):** fog peeling back to reveal glowing Wisps beneath. Copy along the
  lines of "A world sleeps beneath the fog. Only your steps can wake it." Replace the
  flat hex grid with a moodier hero (fog gradient + a few floating glowing motes; gentle
  `Animated` float loop).
- **Slide 2 (mechanic + collection):** "As you walk, the fog lifts — and the Wisps it
  hid drift into the light. Gather them all." Show the reveal + a Wisp being gathered.
- **Slide 3 (permissions, kept honest):** same data/privacy explanation as today,
  restyled to the themed look; CTA "Begin the trail" (or similar).
- Keep the existing structure (3 horizontal paging slides, dots, Next, final CTA calls
  `onComplete`) and all accessibility labels/roles. This is a content + atmosphere
  restyle, not a structural rewrite.

### Achievement tie-in — `src/domain/achievements/catalog.ts`

Add 1–2 Wisp achievements using the new `wispsGathered` metric, e.g. "First Light"
(gather 1) and "Wisp Whisperer" (gather 10), following the existing
`AchievementDefinition` shape (`metric: 'wispsGathered'`). No change to
`evaluateAchievements` logic — it already loops the catalog by metric/threshold.

## Error Handling & Edge Cases

- **Duplicate discovery:** guarded by the `collectedWisps` membership check in
  `applyFix` — a cell revealed again never re-emits `wispFound` or double-counts.
- **Two Wisps in one cell:** disallowed; invariant test on catalog load.
- **Card dismissed / app backgrounded mid-card:** safe — the Wisp is already persisted;
  it simply appears in the Collection. No pending state to lose.
- **Old snapshot without `collectedWisps`:** loads as empty via `?? []`.
- **Demo Walk:** because Wisps are seeded on the demo route, the Demo Walk will emit
  `wispFound` events and surface discovery cards — an intentional showcase. The card
  queue must handle several finds in quick succession (the walk feeds fixes every
  200ms).

## Testing Strategy

- **Catalog** (`catalog.test.ts`): all ids unique; all cells unique in `WISPS_BY_CELL`;
  `WISPS_BY_CELL` size == `WISPS.length`; every rarity is a valid tier.
- **applyFix** (table-driven, extend existing loop tests): revealing a Wisp's cell emits
  exactly one `wispFound`, adds the id to `collectedWisps`, increments `wispsGathered`;
  revealing it again is a no-op; revealing a non-Wisp cell emits nothing.
- **Snapshot round-trip:** `collectedWisps` survives `toSnapshot`→`fromSnapshot`; a
  snapshot missing the field loads as empty.
- **WispDiscoveryCard:** renders orb, reveals name/rarity/lore on tap, calls `onDismiss`.
- **Collection segment:** shows gathered vs `???` tiles; progress count correct.
- **Onboarding:** still renders 3 slides and fires `onComplete` from the final CTA
  (existing test kept green).
- **EventToast:** renders a `wispFound` event.
- Full gate stays green: `npm run typecheck && npm run lint && npm run format:check && npm test`.

## Out of Scope (YAGNI)

- Server-side Wisp sync / multiplayer / trading.
- Per-Wisp bespoke artwork pipelines (use rarity-colored glow + iconography from tokens
  and SVG, not per-Wisp illustrations).
- Time-limited / seasonal Wisps, respawns, or events.
- Map markers for undiscovered Wisps (they must stay hidden in the fog — that is the
  mystery). Discovery is only via revealing the cell.
- A dedicated Journal tab or navigation-router migration.

## File Summary

**New:**
- `src/domain/wisps/catalog.ts` + `catalog.test.ts`
- `src/presentation/components/wisps/WispDiscoveryCard.tsx` (+ test)
- Collection sub-components under `src/presentation/components/trophies/` (or `wisps/`)

**Modified:**
- `src/domain/loop/events.ts` (add `wispFound`)
- `src/domain/loop/state.ts` (`collectedWisps`, `wispsGathered`, init)
- `src/domain/loop/applyFix.ts` (detection + events)
- `src/data/persistence/snapshot.ts` (persist `collectedWisps`, backward-compat)
- `src/domain/achievements/catalog.ts` (Wisp achievements)
- `src/presentation/components/EventToast.tsx` (`wispFound` case)
- `src/presentation/screens/AchievementsScreen.tsx` (Trophies|Collection segment)
- `src/presentation/screens/OnboardingScreen.tsx` (themed rewrite)
