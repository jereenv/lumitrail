# SETUP — machine changes log

This file records anything installed **outside the project** (system-wide) while
building Lumitrail, per the working agreement.

## System-wide installs: NONE

Nothing was installed system-wide during the map work. Your machine's global
state is unchanged. Everything added lives inside the project's `node_modules/`
(tracked in `package.json`) and was installed with the project-scoped commands
below.

No use of `brew`, `sudo`, `gem`, global `npm -g`, Android SDK, Xcode, or
CocoaPods installers was performed.

## Project-scoped installs (inside `/Users/jereenvalsson/personal/lumitrail`)

Added to the project's dependencies (local `node_modules`, recorded in
`package.json` / `package-lock.json`):

| Package              | Version | Why                                                                                       | Command used                          |
| -------------------- | ------- | ----------------------------------------------------------------------------------------- | ------------------------------------- |
| `react-native-maps`  | 1.27.2  | Real interactive basemap (Google/Apple Maps) with Polygon-with-holes fog overlay          | `npx expo install react-native-maps`  |
| `expo-splash-screen` | ~57.0.4 | Branded splash config referenced by `app.json` (added in the prior session's config pass) | `npx expo install expo-splash-screen` |
| `tsx` (dev)          | ^4.x    | Runs the headless `npm run demo` with tsconfig path aliases (prior session)               | `npm install --save-dev tsx`          |

The SVG-based rasterisation used for brand assets in the earlier session ran via
`npx --yes sharp-cli` (executed from the npx cache — **not** installed into the
project or system).

## What a full on-device build additionally requires (NOT installed here)

These were **not** installed (this environment has no Android SDK, no full
Xcode, no simulators, no CocoaPods), and a live map render needs them on your
machine. Listed here so you know exactly what to add when you want to run it:

- **Android:** Android Studio + Android SDK/platform-tools + an emulator (or a
  physical device), and a **free Google Maps API key** in `.env`
  (see `README.md` → "Google Maps API key"). Run: `npx expo run:android`.
- **iOS:** full **Xcode** (from the App Store — the environment only has the
  Command Line Tools) and **CocoaPods** (`brew install cocoapods` or
  `sudo gem install cocoapods`). Apple Maps needs no key. Run: `npx expo run:ios`.

Verification performed without those toolchains: `npm run typecheck`,
`npm run lint`, `npm run format:check`, `npm test` (101 tests), and a Metro
bundle via `npx expo export --platform ios` (839 modules → 2.3 MB Hermes
bundle).
