# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- **App crashed on launch on Android (Hermes).** `h3-js`' Emscripten glue calls
  `new TextDecoder('utf-16le')` at import time, but Hermes' built-in
  `TextDecoder` only supports `utf-8`, so it threw
  `RangeError: Unknown encoding: utf-16le` during startup module loading and
  aborted the process. Added `src/app/polyfills/textDecoder.ts` — a
  `TextDecoder` that decodes the UTF-16LE family itself and delegates all other
  encodings to the platform decoder — installed as the first import in
  `index.ts`, before any module that pulls in `h3-js`. (The Jest suite had
  masked this by swapping in Node's `TextDecoder`; that patch never shipped in
  the app bundle.)

### Changed

- **Real interactive map replaces the SVG placeholder.** `MapScreen` now renders
  a real basemap with `react-native-maps` (Google Maps on Android, Apple Maps on
  iOS) showing actual streets, roads, and place names with pan/zoom, centred on
  the user's location on open. The hand-rolled `latLngToSvg` equirectangular
  projection was deleted — the map SDK owns the projection, so hexagons align
  with real geography at every zoom.
- Fog-of-war is now a true **overlay**: one dark `Polygon` covering the viewport
  with a **hole punched for every explored area** (via the SDK's `holes` prop),
  revealing the real streets beneath. Adjacent explored hexagons are dissolved
  into smooth merged outlines with `h3-js` `cellsToMultiPolygon`; unexplored
  pockets become re-fogged "islands"; newly revealed cells flash on reveal.

### Added

- On-map **HUD** shown on open: level, XP bar, streak, and a prominent
  **"% of this area uncovered"** plus lifetime area (km²), distance, and cell
  count — the first thing a user sees is how much they've uncovered.
- Pure, unit-tested fog geometry module `domain/geo/fog.ts`
  (`buildFogOverlay`, `computeFogGeometry`, `viewExploredPercent`, area/estimate
  helpers) and a `MapScreen` component test that mocks the map SDK.
- Real device stack wiring: the store now boots SQLite + Expo location on device
  (with the in-memory/mock fallback), a `locateMe` action, and a "recenter" FAB.
- `app.config.js` + `.env.example`: the Android Google Maps API key is injected
  from `GOOGLE_MAPS_API_KEY` at build time — never hardcoded or committed.

### Planned

- Vector-tile styling / offline basemap tiles; optional MapLibre backend
- Region/country boundary data import
- Push notifications for friend activity
- Shareable map snapshot images
- Real backend sync (currently InMemorySync only)
- App Store submission

## [0.1.0] - 2026-07-21

### Added

- Fog-of-war map engine: H3 resolution-9 hexagons (~174 m), WAL SQLite storage, smooth reveal on every new cell
- Battery-safe background tracking: OS significant-change + geofence wake, Accuracy.Balanced default, adaptive high-accuracy for active sessions, pausesUpdatesAutomatically, ActivityType.Fitness, accuracy-gated reveals (rejects fixes worse than 200 m, limits ring expansion to fixes better than 50 m)
- Durable fix queue: background fixes queued and replayed on resume so tracking is never silently lost
- XP system: 10 XP per new cell, 4 XP per completed 100 m, streak bonus 25 x min(streakDays, 7) XP/day
- Level progression: quadratic curve (cost L->L+1 = 100 x L XP), closed-form invert -- no loop needed
- 18 achievements across 5 categories (discovery, distance, world, streak, progression) with bronze/silver/gold/platinum tiers
- Leaderboards: global and friends boards on 5 metrics (cells, distance, countries, XP, streak)
- Social layer: friend requests and accept/decline state machine (pure, immutable transitions)
- Offline-first G-Set CRDT sync: revealed cells modeled as a grow-only set; multi-device merge is a conflict-free union; push/pull SyncEngine with durable outbox
- Privacy controls: local-first by default; no data leaves device without consent; data export and delete supported
- Stats dashboard data model: distance, cells, active days, streaks, timeline
- Exploration percentage per region/country/worldwide with 100% completionist goal
- Strict TypeScript (v6), ESLint 9, Prettier 3, no `any` across entire codebase
- 72 automated tests: pure domain assertions + injected-fake adapter tests
- Headless e2e demo (`npm run demo`): proves move->unfog->XP->level->achievement->leaderboard->sync in sequence

[Unreleased]: https://github.com/lumitrail/lumitrail/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/lumitrail/lumitrail/releases/tag/v0.1.0
