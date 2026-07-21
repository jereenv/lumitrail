# Lumitrail

> **Walk the world out of the fog.**

Lumitrail is a free, cross-platform **fog-of-war real-world exploration game**.
Your entire world map starts hidden under fog. Physically walking or travelling
to a place permanently **unfogs** it. Chase 100% completion of regions and
countries, earn XP, level up, unlock achievements, climb leaderboards, and
compare your map with friends — think the exploration/levelling/social loop of
Strava + Pokémon GO, applied to uncovering a personal map of the world.

Built from scratch to decisively beat the buggy, battery-hungry originals on
**battery efficiency, reliability, polish, and features** — and it's **100%
free**: all social and leaderboard features are open to everyone, with no
paywalls, no premium tier, and no ads in the core experience.

<p align="center">
  <img src="assets/store/screenshot-1.png" width="24%" alt="Fog map" />
  <img src="assets/store/screenshot-2.png" width="24%" alt="Stats dashboard" />
  <img src="assets/store/screenshot-3.png" width="24%" alt="Achievements" />
  <img src="assets/store/screenshot-5.png" width="24%" alt="Leaderboard" />
</p>

---

## Features

- 🌫️ **Fog-of-war map** — the world starts fully fogged; visited areas reveal
  permanently, rendered efficiently as H3 hexagons.
- 🧭 **Exploration %** — per-region / per-country / worldwide completion, with a
  100% completionist goal.
- ✨ **XP & levels** — earn XP for new areas, distance, and daily streaks; level
  up on a satisfying curve.
- 🏅 **Achievements** — 18 badges across discovery, distance, world, streak, and
  progression tiers (bronze → platinum).
- 📊 **Stats dashboard** — distance, areas discovered, streaks, active days, and
  an exploration timeline.
- 🏆 **Leaderboards** — global and friends-only, on multiple metrics.
- 👥 **Social** — friend requests, compare exploration, and shareable snapshots.
- 📴 **Offline-first** — tracking and reveal work with zero connectivity; opt-in
  sync merges devices conflict-free.
- 🔋 **Battery-safe** — OS geofence-wake + batched/deferred background updates,
  never continuous high-frequency GPS.
- 🔒 **Privacy-first** — location stays on your device; granular sharing opt-ins;
  full data export and delete.

## Why it's better than the originals

|                        | **Lumitrail**                                    | Fog of World                 | Wandrer                   |
| ---------------------- | ------------------------------------------------ | ---------------------------- | ------------------------- |
| Price                  | **Free**                                         | $30–40 one-time              | $40/yr (free tier capped) |
| Platforms              | **Android + iOS**                                | iOS/Android/macOS            | Web-first                 |
| Battery                | **Geofence-wake, batched, balanced accuracy**    | 5–10%/hr reported            | n/a (web)                 |
| Background reliability | **Fixes queued + replayed; never silently lost** | Silently stops               | n/a                       |
| Social / leaderboards  | **Built in, open to all**                        | None                         | Limited                   |
| Offline                | **Fully offline-first**                          | Partial                      | No                        |
| Sync                   | **Conflict-free (G-Set CRDT)**                   | iCloud/Drive (crash reports) | Server-side               |

---

## Quick start

### Prerequisites

- **Node 20+** (developed on Node 25) and npm.
- For running on a device/emulator: the **Expo Go** app, or Android Studio / Xcode
  for a native build. Background location requires a **development build** (not
  Expo Go) plus, on Android 14+, the `FOREGROUND_SERVICE_LOCATION` permission —
  both are already configured in `app.json`.

### Install

```bash
npm install
```

### See the whole game loop in your terminal (no device needed)

```bash
npm run demo
```

This drives the real domain and data code with a scripted walk (Stockholm →
London) and narrates: **move → unfog → gain XP → level up → achievement →
leaderboard → offline-first sync**.

### Run the app

```bash
npm start          # Metro bundler; press i / a / w for iOS / Android / web
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run web        # web preview
```

The app boots in a safe **in-memory demo mode** if native modules aren't
available, so you can explore the UI and press **"Take a demo walk"** to reveal
fog immediately.

### Quality gate (what CI runs)

```bash
npm run typecheck    # tsc --noEmit
npm run lint         # eslint (flat config)
npm run format:check # prettier
npm test             # jest — 84 tests across 16 suites
```

---

## Project structure

```
src/
├── domain/        Pure game logic (no RN/Expo) — the fog engine & core loop
├── data/          Location provider, SQLite persistence, sync (+ in-memory fakes)
├── app/           ExplorationService, Zustand store, theme tokens
├── presentation/  Screens & components (React Native + SVG)
└── config/        Tunable game constants
scripts/demo.ts    Headless end-to-end demo
assets/            Icons, adaptive icon set + densities, store assets
brand/             SVG sources for all brand assets
```

The domain and data layers deliberately avoid React Native imports so the entire
game loop is verifiable headless under `jest`. See **[ARCHITECTURE.md](ARCHITECTURE.md)**
for the full design, the H3 fog-storage strategy, and the battery model.

## Tech stack

- **Expo SDK 57** · React Native 0.86 · React 19.2 · **TypeScript** (strict)
- **Uber H3** (res 9) hexagons for fog · **expo-sqlite** (WAL) persistence
- **expo-location** + **expo-task-manager** for battery-safe background tracking
- **Zustand** state · **react-native-svg** rendering
- **jest** (jest-expo) · **ESLint 9** (flat) · **Prettier**

## Documentation

| Doc                                    | What's in it                                        |
| -------------------------------------- | --------------------------------------------------- |
| [PRODUCT.md](PRODUCT.md)               | Vision, personas, full feature list, roadmap        |
| [ARCHITECTURE.md](ARCHITECTURE.md)     | Stack rationale, layers, fog storage, battery, sync |
| [BRAND.md](BRAND.md)                   | Name, palette, typography, icon, voice              |
| [PRIVACY_POLICY.md](PRIVACY_POLICY.md) | Privacy policy + Play Data Safety declaration       |
| [STORE_LISTING.md](STORE_LISTING.md)   | Play Store submission package                       |
| [CONTRIBUTING.md](CONTRIBUTING.md)     | Setup, standards, testing, workflow                 |
| [CHANGELOG.md](CHANGELOG.md)           | Release history                                     |

## License

See [LICENSE](LICENSE).
