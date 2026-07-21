# Lumitrail — Architecture

This document explains **how Lumitrail is built and why**. It is the reference
for the stack decision, the layered design, the fog-storage and battery
strategies (the two hardest problems in this genre), reliability, sync, testing,
and known limitations.

---

## 1. Stack decision

**Chosen: Expo (React Native 0.86, React 19.2, Expo SDK 57) + TypeScript.**

| Option                         | Cross-platform                     | Battery-safe background location                                                                      | Verifiable on this machine                                       | Verdict    |
| ------------------------------ | ---------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ---------- |
| **Expo / React Native**        | ✅ Android + iOS from one codebase | ✅ `expo-location` (significant-change / geofencing / deferred batched updates) + `expo-task-manager` | ✅ Node toolchain present → `tsc`, `eslint`, `jest` run headless | **Chosen** |
| Flutter                        | ✅                                 | ✅ (`geolocator`, `flutter_background_geolocation`)                                                   | ❌ SDK not installed; device build unverifiable                  | Rejected   |
| Native Kotlin + Swift (2 apps) | ⚠️ two codebases                   | ✅ best-in-class                                                                                      | ❌ two toolchains, most effort                                   | Rejected   |

Why Expo won for this project:

1. **One codebase, both platforms.** The original inspiration app is Android-only;
   we ship iOS too at no extra cost.
2. **The battery-critical APIs are first-class.** `expo-location` exposes exactly
   the OS primitives we need (balanced accuracy, deferred/batched updates,
   geofencing, `pausesUpdatesAutomatically`, `ActivityType`) — see §4.
3. **The core is verifiable without a device.** By keeping the domain and data
   layers free of React Native imports (see §2), the entire game loop and sync
   flow run under `jest` in plain Node. That is why this repo can honestly claim
   "all tests pass" rather than "compiles, probably works".

**Trade-off we accepted:** a full on-device build needs the Android SDK / iOS
CocoaPods, which are not installed here. So the verified bar is
**typecheck + lint + format + 84 unit/integration tests + a headless end-to-end
demo**. On-device run steps are documented in `README.md`.

---

## 2. Layered (clean) architecture

Dependencies point **inward only**: presentation → app → data → domain. The
domain knows nothing about React, Expo, or SQLite.

```
src/
├── domain/        Pure business logic. No React Native / Expo imports.
│   ├── geo/         H3 grid math (wraps h3-js), distance, path length
│   ├── exploration/ revealAt(): which fog cells a fix uncovers
│   ├── progression/ xp, level curve, streaks
│   ├── achievements/catalog + evaluation
│   ├── regions/     region resolver + exploration-% math
│   ├── leaderboard/ metric-agnostic ranking
│   ├── social/      friendship state transitions
│   ├── player/      PlayerStats aggregate
│   └── loop/        applyFix(): the one pure transition that composes it all
├── data/          Adapters to the outside world (all behind interfaces)
│   ├── location/    LocationProvider (+ Mock, + Expo impl, background task)
│   ├── persistence/ RevealRepository / PlayerRepository (+ InMemory, + SQLite)
│   └── sync/        SyncEngine + SyncClient/Outbox (+ in-memory fakes)
├── app/           Application layer
│   ├── service/     ExplorationService: wires domain + data together
│   ├── store/       Zustand store for the UI
│   └── theme.ts     Design tokens (single source of truth for the brand)
├── presentation/  React Native screens & components
└── config/        Tunable game constants (XP rates, resolution, thresholds)
```

**Why this shape:**

- **Testability.** `domain` and `data` are pure/injected, so 84 tests run with
  no device and no flakiness.
- **Swappability.** Want to change the map indexing from H3 to S2? Only
  `domain/geo/grid.ts` changes. Want a real backend instead of the fake sync
  client? Implement `SyncClient` — nothing else moves.
- **The core loop is one function.** `applyFix(state, point, ctx)` is a pure
  function: `(PlayerState, GeoPoint) → (PlayerState, DomainEvent[])`. It reveals
  cells, tallies regions, adds distance, updates the streak, awards XP, detects
  level-ups, and unlocks achievements — and mutates nothing. The UI reacts to
  the returned events (toasts, haptics, confetti).

---

## 3. Fog storage strategy — Uber H3 hexagons

The world is quantised into **H3 hexagons at resolution 9** (~0.1 km², ~170 m
across). A place is "revealed" when its hexagon id is in the revealed set.

**Why H3 (vs slippy tiles, geohash, or raw reveal-circles):**

| Approach             | Pros                                                                                                             | Cons                                                                    | Fit                  |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | -------------------- |
| **H3 res 9**         | Uniform neighbour distance (no directional bias), compact integer/string ids, native `h3-js`, easy k-ring reveal | No prefix hierarchy; parent nesting is approximate (roll-ups are lossy) | **Chosen**           |
| Slippy tiles (z/x/y) | 1:1 with map SDKs                                                                                                | Square cells distort by latitude; coarse at low zoom                    | Rendering cache only |
| Geohash              | Simple prefix range queries                                                                                      | Rectangular cells distort near poles; boundary artifacts                | Rejected             |
| Raw reveal-circles   | Smoothest visuals                                                                                                | Expensive to render at scale; no cheap spatial index                    | Rejected as primary  |

**Reveal rule** (`domain/exploration/reveal.ts`): a fix reveals the hexagon it
falls in plus a k-ring of neighbours (7 cells for a good fix — a generous ~500 m
disc so walking feels responsive), gated by accuracy (see §5).

**Storage** (`data/persistence`): revealed cells are a **grow-only set**. In
SQLite each cell is one row `(cell TEXT PK, lat REAL, lng REAL)`. Storing the
centroid lets the viewport query be an indexed range scan:

```sql
SELECT cell FROM revealed_cells WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?;
```

so the map stays smooth no matter how large the history grows — we only ever
render the cells in view.

**Exploration %** (`domain/regions/exploration.ts`): `revealed / targetCells`,
clamped to 100. Because H3's child→parent nesting is only approximate, we do
**not** derive per-region counts by rolling cells up the resolution hierarchy;
instead each region's tally is incremented directly when a newly revealed cell's
centroid resolves into it — an exact count, immune to the nesting approximation.
Region `targetCells` are estimates; production bundles precomputed land-cell
counts from a real polygon dataset (see §7).

---

## 4. Battery strategy (top priority)

The originals are criticised for 5–10%/hour drain and continuous GPS. Lumitrail
**never polls high-frequency GPS in the background.** Everything lives in
`data/location/ExpoLocationProvider.ts`:

1. **Balanced accuracy by default** (`Accuracy.Balanced`, ~100 m). High/GPS
   accuracy is used _only_ during an explicit "record my walk" session
   (`ACTIVE_SESSION_TRACKING`). Fog reveal at 170 m granularity does not need
   10 m fixes.
2. **Batched / deferred delivery.** `deferredUpdatesDistance` and
   `deferredUpdatesInterval` (60 s) let the OS accumulate fixes and wake the app
   rarely, instead of streaming every fix. Radio and JS engine stay asleep.
3. **OS stationary detection.** `pausesUpdatesAutomatically: true` +
   `activityType: Fitness` let iOS's motion coprocessor suspend updates entirely
   while you are still — no wasted fixes standing at a desk.
4. **Movement gate.** `distanceInterval` means no update until you have actually
   moved ~25 m.
5. **Geofence-wake pattern.** For the lowest-power mode, register a geofence at
   the edge of the currently-known area; the OS wakes the app only when you
   cross it, at which point we briefly track and then re-geofence. This is the
   single biggest battery win versus always-on GPS.

**Honest caveat:** Expo does not expose iOS "significant location change" as a
dedicated flag. We approximate it with lowest accuracy + large deferred distance.
This is documented rather than hidden.

**Measuring it:** the strategy is encoded as data (`TrackingOptions` presets), so
battery A/B testing is a matter of swapping presets and reading the OS battery
attribution screen — no code changes.

---

## 5. Reliability

Directly targeting the originals' failure modes:

- **No silent tracking loss.** Background fixes are written to a durable
  AsyncStorage queue by a _tiny_ background task (`data/location/tasks.ts`), then
  **drained and replayed through `applyFix` on next launch**
  (`ExplorationService.init()`). Even if the OS kills the app for hours, no
  reveal is lost.
- **Accuracy gating.** A fix worse than 200 m accuracy is rejected outright; a
  fix worse than 50 m reveals only its centre cell, never a full ring — so a bad
  cell-tower "fix" can't paint a neighbourhood you never visited.
- **Teleport rejection.** A jump > 5 km between consecutive fixes (a flight, a
  GPS glitch, an app resumed in a new city) reveals the new place but adds **no**
  distance XP.
- **Graceful degradation.** If SQLite fails to open, the app falls back to
  in-memory repositories (session-only) instead of crashing. Denied permissions
  and GPS loss are surfaced as states, not exceptions.
- **Crash safety.** The player snapshot is small (cells live separately) and is
  written on every accepted fix, so a crash loses at most the current fix.
- **Immutability.** `applyFix` never mutates its input — verified by a test — so
  there are no shared-mutable-state races.

---

## 6. Sync — offline-first, conflict-free

Lumitrail works fully offline; sync is **opt-in** (cloud backup / second device).
The synced structure — the revealed-cell set — only ever **grows**, so it is a
**G-Set (grow-only set) CRDT**. Merging two devices is a set **union**, which is
commutative, associative, and idempotent. Consequences:

- **No conflict resolution, ever.** There is no "last write wins" data loss.
- **Safe retries.** `SyncEngine.sync()` pushes the outbox, and only on success
  acks (clears) it; if the network fails, the outbox is intact and the next sync
  retries. Syncing twice is a no-op.
- **Order independence.** Devices can sync in any order and converge to the same
  union.

This is proven by `SyncEngine.test.ts` (two offline devices → converge) and
exercised live in `npm run demo`.

---

## 7. Region resolution

Mapping a coordinate to `country / region / city` uses the `RegionResolver`
interface. The shipped `BoundingBoxRegionResolver` matches a seed of bounding
boxes (real, used by the demo and tests) — honest but coarse. Production swaps in
a `PolygonRegionResolver` backed by a **bundled offline Natural Earth polygon
dataset** with the same interface, so no calling code changes and no network call
is made (privacy: reverse geocoding stays on-device).

---

## 8. Testing strategy

- **Unit** — every domain module (geo, reveal, xp, levels, streak, achievements,
  regions, ranking, friendship).
- **Integration** — `applyFix` end-to-end (move → unfog → XP → level →
  achievement across days, plus accuracy rejection, teleport handling,
  idempotency, immutability); `ExplorationService` (fix → persist → reload → sync
  → export/delete); `SyncEngine` (offline → online convergence).
- **Component** — pure prop-driven widgets via `@testing-library/react-native`.
- **The location provider is mocked** (`MockLocationProvider`) so the whole
  pipeline runs with scripted points and zero hardware — the DoD requirement.

Total: **84 tests across 16 suites**, plus a runnable narrated demo
(`npm run demo`).

---

## 9. Known limitations & next steps

- **On-device build not run here** (no Android SDK / iOS pods in the environment).
  The map rendering uses `react-native-svg`; integrating a full vector map
  (MapLibre GL) is the next step for production polish.
- **Region targets are estimates.** Swap in the bundled polygon dataset (§7) for
  authoritative completion %.
- **Sync backend is a fake client.** The `SyncClient` interface is ready; a real
  end-to-end-encrypted backend is future work (the CRDT design already makes it
  safe).
- **Fonts** (Space Grotesk / Inter) are referenced as tokens; bundling them via
  `expo-font` is a polish step (system fallback is used until then).

See `CHANGELOG.md` for what shipped in 0.1.0 and `PRODUCT.md` for the roadmap.
