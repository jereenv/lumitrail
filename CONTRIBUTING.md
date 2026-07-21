# Contributing to LumiTrail

## Prerequisites

- **Node.js** — use the current LTS release ([nodejs.org](https://nodejs.org))
- **Expo Go** — the fastest way to preview the app on a real device. Install it from the App Store or Google Play, then scan the QR code that `npm start` prints.
- For iOS simulator or Android emulator, Xcode or Android Studio must be installed and configured separately.

## Getting Started

```bash
# 1. Clone the repository
git clone <repo-url>
cd lumitrail

# 2. Install dependencies
npm install

# 3. Start the Expo dev server
npm start
```

Expo will print a QR code. Scan it with Expo Go on your phone, or press `i` / `a` in the terminal to open an iOS simulator or Android emulator.

## Running on Device / Simulator

| Command           | What it does                                                         |
| ----------------- | -------------------------------------------------------------------- |
| `npm start`       | Starts the Expo dev server; lets you choose the target interactively |
| `npm run ios`     | Opens directly in the iOS simulator (requires Xcode)                 |
| `npm run android` | Opens directly in an Android emulator (requires Android Studio)      |
| `npm run web`     | Opens in the browser via React Native Web                            |

Note: background location tracking requires a real device. The simulator reports a fixed coordinate and will not trigger fog-reveal updates as you move.

## Project Structure

The codebase uses a clean architecture approach: business logic is kept completely separate from I/O and framework code. Each layer only depends on the layers listed below it.

```
src/
  domain/       — pure business logic; zero I/O, zero framework deps
    achievements/   — 18 achievements with pure predicate evaluation
    exploration/    — fog-of-war reveal logic
    geo/            — H3 grid helpers and GeoPoint types
    leaderboard/    — metric-agnostic ranking (pure)
    loop/           — main game loop: fix → reveal → XP → level → achievement
    player/         — player stats types
    progression/    — level thresholds and XP math (pure functions)
    regions/        — region tracking
    social/         — friendship state transitions (pure)
  data/         — I/O adapters; implement interfaces defined in domain/
    location/       — location provider interface + expo-location adapter
    persistence/    — SQLite repositories (WAL mode)
    sync/           — SyncEngine (G-Set CRDT push/pull), InMemorySync for tests
  app/          — Zustand stores that wire domain + data together; theme tokens
  config/       — constants.ts — single source of truth for all game balance numbers
  service/      — composition root; wires all layers together
```

**Why this layering matters:** The `domain/` layer has no dependencies on SQLite, Expo, or React. This means every piece of game logic can be tested as plain input/output functions without spinning up a database or a device. The `data/` layer depends on `domain/` interfaces, not the other way around, so adapters are swappable. The `app/` and `service/` layers are the only place where everything is composed.

## Coding Standards

- **TypeScript strict mode** — `strict: true` is set in `tsconfig.json`. ESLint enforces no `any`.
- **Pure functions in `domain/`** — no side effects, no I/O, no imports from `data/` or `app/`. If you need external state in a domain function, pass it as a parameter.
- **Interfaces for I/O boundaries** — define the interface in `domain/`, implement it in `data/`. This makes fakes trivial to inject in tests.
- **Immutable state patterns** — do not mutate objects in place. Return new values.
- **No magic numbers** — all game balance values (XP thresholds, H3 resolution, etc.) live in `src/config/constants.ts`. Reference the constant; never hard-code the number in logic.
- **Naming conventions** — `camelCase` for functions and variables, `PascalCase` for types, interfaces, classes, and React components.

## Running Checks

Run these before opening a pull request. They must all pass.

| Command                 | What it does                                                 |
| ----------------------- | ------------------------------------------------------------ |
| `npm run typecheck`     | Runs `tsc --noEmit`; checks types without emitting output    |
| `npm run lint`          | Runs ESLint across the entire project                        |
| `npm run lint:fix`      | Runs ESLint and auto-fixes fixable issues                    |
| `npm run format:check`  | Checks formatting with Prettier (does not write)             |
| `npm run format`        | Writes Prettier formatting to all files                      |
| `npm test`              | Runs the Jest test suite once                                |
| `npm run test:watch`    | Runs Jest in watch mode; re-runs affected tests on file save |
| `npm run test:coverage` | Runs Jest and outputs a coverage report                      |
| `npm run demo`          | Runs a headless end-to-end proof via `tsx scripts/demo.ts`   |

## Testing Philosophy

**Domain logic is pure functions.** Test them with direct input/output assertions — no mocks, no setup overhead. If a function is pure, a test is just: call it with inputs, assert the output.

**Data adapters use injected fakes.** The `InMemorySync` class is a drop-in fake for `SyncEngine` used in tests. Location tests use a fake location provider, not the real `expo-location` adapter. Fakes are faster and deterministic.

**Never mock the domain.** The domain is the thing you are testing. Mock only the I/O boundary (the location provider, the database). If you find yourself mocking a domain function, that is a sign the boundary is in the wrong place.

**Table-driven tests** are preferred for math-heavy logic (XP thresholds, level calculations). A single test function iterates over a slice of `{input, expected}` cases, making it easy to add edge cases and read failures.

This approach means the 72-test suite runs fast, is easy to read, and failures point directly to the broken invariant rather than to an implementation detail.

## Commit & PR Conventions

**Branch naming:**

```
jereenv/{short-task-description}
```

**Commit messages:**

- Imperative tense: "Add fog reveal for H3 cell" not "Added" or "Adding"
- Under 72 characters
- No AI tool attribution in the message

**Pull requests:**

- Always open as **draft**
- Summary: a few bullet points explaining what changed and why
- No test plan section unless explicitly requested

**Pre-PR checklist:**

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
```

All four must pass before the PR is opened.

## Common Gotchas

- **H3 resolution is fixed at 9.** It is set in `src/config/constants.ts`. Do not change it without understanding the downstream impact on cell size, fog density, and existing persisted data — cells from a different resolution are not compatible.
- **No magic numbers outside `constants.ts`.** If you are writing a number literal anywhere in `src/domain/` or `src/data/`, it almost certainly belongs in `constants.ts` with a descriptive name.
- **Background location requires a real device.** Simulators report a single static coordinate. If your change involves location updates triggering game events, test on a physical device.
- **WAL mode is set at DB open time.** SQLite WAL (Write-Ahead Logging) is enabled when the database connection is first opened in the persistence layer. Do not issue `PRAGMA journal_mode` manually in migration scripts — it is already handled and doing it again can cause unexpected behaviour.
