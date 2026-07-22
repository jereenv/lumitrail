# Lumitrail Game Redesign — design spec

**Date:** 2026-07-22
**Status:** Approved (design); implementation plans pending
**Author:** Lumitrail team

## Summary

Transform Lumitrail from a functional fog-of-war utility into a bright,
cartoony **exploration game**. You physically walk, paint the fog off your
personal world map, earn XP / levels / coins, unlock tiered trophies, climb the
ranks, and explore alongside friends. Every one of the six pages is
reimagined around this loop with one consistent "sticker-card" visual language,
juicy animated feedback, and a playful voice.

This spec is the umbrella. The map's paintbrush reveal, the cartoony palette,
and the new app icon are specified in detail in the companion spec
[`2026-07-22-paintbrush-reveal-cartoony-refresh-design.md`](./2026-07-22-paintbrush-reveal-cartoony-refresh-design.md);
this document references it rather than repeating it.

It is a **presentation + assets + light-wiring** change. The pure `domain` layer
(fog geometry, XP, levels, streaks, regions, ranking, achievements, friendships)
is already complete and correct; we consume it, we do not rewrite it. The only
new domain module is `geo/smooth.ts` (pure paintbrush geometry). The only new
cross-cutting runtime state is a small `focusTarget` slice for cross-tab
navigation. No new backend, no tracking-cadence change (battery model preserved).

## Decisions locked (from brainstorming)

| Question      | Decision                                                               |
| ------------- | ---------------------------------------------------------------------- |
| Reveal look   | Chaikin corner-cutting smoothing (render-only, no deps)                |
| Aesthetic     | Bright "mint & cream" cartoony sticker-card system                     |
| App icon      | "Pin on a revealed map"                                                |
| Tab naming    | **Game-voice:** Explore · Journey · Trophies · Ranks · Crew · Settings |
| Boldness      | **Bold & juicy** — full cartoony game UI with animation everywhere     |
| Orchestration | Foundation wave first, then six parallel page-owner agents (worktrees) |

## Game pillars (the North Star every page serves)

1. **Uncover** — the map is the hero; progress is visible and physical.
2. **Reward** — every action gives feedback: XP, coins, level-ups, trophies, juice.
3. **Progress** — clear short-term goals (next trophy, next level, streak) and
   long-term ones (world %, regions, ranks).
4. **Together** — ranks and crew make exploring social and competitive.

## Non-goals

- No real backend, auth, or network sync this cycle (leaderboard/crew stay
  demo-seeded via existing domain logic; social actions may remain local).
- No real-money purchases. Coins are cosmetic-only and are a **display concept**
  this cycle (surfaced from stats/XP); no spend economy is built yet.
- No change to location tracking cadence or the H3 storage model.
- No rewrite of the pure `domain` layer.

---

## Design system (Wave 0 — the shared foundation)

Everything below lands FIRST, because every page depends on it. Building it once
prevents six agents from inventing six conflicting versions.

### Tokens — `src/app/theme.ts` (additive; keep existing tokens)

From the companion spec, plus game additions:

| Token            | Value                       | Use                                       |
| ---------------- | --------------------------- | ----------------------------------------- |
| `fog`            | `rgba(111, 224, 176, 0.55)` | soft mint fog over unexplored map         |
| `canvas`         | `#EAF7F1`                   | bright app background (replaces dark ink) |
| `card`           | `#FFF8EC`                   | cream sticker-card surface                |
| `cardBorder`     | `#F0E2C8`                   | warm hairline around cards                |
| `onCard`         | `#26333F`                   | ink text on cream cards                   |
| `onCardMuted`    | `#6B7B88`                   | muted label text on cards                 |
| `coral`          | `#FF7A66`                   | primary playful pop accent                |
| `berry`          | `#B57BFF`                   | secondary accent (variety)                |
| `frontier`       | `#FFF3D6`                   | warm-cream dashed frontier                |
| `frontierCasing` | `rgba(38, 74, 62, 0.35)`    | casing under frontier                     |
| `shadow`         | `#123027`                   | chunky card drop-shadow color             |

`ink`/`lumen`/`aurora`/`sky`/`tierColors` stay (map loading state, accents, and
the bronze/silver/gold/platinum tier ramp are reused).

Add shared style helpers: `cardShadow` (shadow offset/opacity/radius + Android
`elevation`) and a `motion` token set (spring config + standard durations) so
animation feels consistent across pages.

### Shared primitives — `src/presentation/components/`

Restyle existing (`StatCard`, `ScreenHeader`, `ProgressRing`, `LevelBadge`,
`XpBar`, `AchievementBadge`, `StreakFlame`, `RegionBanner`, `EventToast`) to the
sticker-card language, and add new ones used by multiple pages:

- `GameCard` — the base cream sticker-card (rounded, chunky shadow, optional
  press animation) that other cards compose.
- `SectionHeader` — playful section title + optional action.
- `PodiumRow` / `Medal` — for Ranks and Trophies.
- `Avatar` — explorer avatar bubble (initial or image) with level ring.
- `AnimatedNumber` / reveal helpers — for count-ups and juice.

New page-specific components live in per-page folders (e.g.
`components/ranks/…`) owned by that page's agent, exported through a single
`components/index.ts` that the integration wave reconciles.

### Cross-tab navigation — `focusTarget`

Add a small slice to `useExplorationStore` (or an equivalent lightweight shared
store) so any screen can command the Map:

```ts
export interface MapFocus {
  readonly latitude: number;
  readonly longitude: number;
  readonly latitudeDelta: number;
  readonly longitudeDelta: number;
  readonly label?: string;
}
// state:   focusTarget: MapFocus | null
// actions: focusMap(target: MapFocus): void   // sets focusTarget
//          clearMapFocus(): void              // MapScreen calls after consuming
```

`App.tsx` owns `activeTab`; a screen that wants to jump the map calls
`focusMap(target)` and then requests a tab switch to `map`. To let a child
screen switch tabs, `App.tsx` passes a `goToTab(tab: TabId)` callback down (or a
tiny `activeTab` store slice) — the plan picks one and applies it consistently.
`MapScreen` runs an effect on `focusTarget`: when set, `animateToRegion(...)`
then `clearMapFocus()`.

**Region centroid:** region cards need coordinates to fly to. `RegionRef`
currently has no center. Wave 0 adds a way to resolve a region id → center +
span (extend `RegionRef` with an optional `center`, or add
`regionCenter(id)` to `domain/regions/resolver.ts` using its seed bounding
boxes). Pure, unit-tested.

### Tab bar + app shell

- Rename tab labels to game-voice (`TabBar` `TABS` labels; `TabId` **values
  stay** `map/stats/achievements/leaderboard/friends/settings` to avoid churn).
- Fix bottom safe-area inset (companion spec, Part B).
- App background moves from dark `ink` to bright `canvas`.

### Paintbrush + icon

Per the companion spec: `geo/smooth.ts` (+ tests) and the rewritten `brand/*.svg`
→ regenerated `assets/*.png`, bright `app.json` background colors.

---

## Per-page specs (Wave 1)

Each page keeps its existing real data source (the domain layer + store) and is
rebuilt visually around the game pillars. Tab **values** are unchanged; only
labels and content change.

### 1. Explore (was Map) — `MapScreen.tsx`

- Paintbrush reveal + animated reveal fanfare + cartoony basemap (companion spec).
- HUD as a game overlay: level ring (`ProgressRing` + `LevelBadge`), XP bar,
  **coins** chip, streak flame — on cream sticker-cards with chunky shadows.
- Region banner (cream card) bottom; FABs (locate, demo walk) restyled.
- Consumes `focusTarget`: animates to a region when another page requests it.
- Reveal/level/trophy events trigger juicy toasts.

### 2. Journey (was Stats) — `StatsScreen.tsx`

- **Hero header:** avatar + explorer title (derived from level) + level ring +
  headline "world uncovered %" (`worldwidePercent`).
- **Stat tiles** as game cards: distance, area, cells, countries, cities,
  active days, streak, coins — with icons and count-up animation.
- **Regions explored:** each region a **tappable `GameCard`** with name, kind
  badge, % ring/bar, and revealed/target. **Tap → `focusMap(regionCenter)` +
  switch to Explore tab** (the requested feature).
- Optional activity strip (recent days / milestones).

### 3. Trophies (was Achievements) — `AchievementsScreen.tsx`

- A **trophy case**: category shelves, tiered `Medal`s (bronze→platinum) with
  rarity styling, progress rings on locked ones, "next goal" nudge per category.
- Header: "X of Y unlocked" with an overall completion ring.
- Celebratory unlocked state (shine/pop). Data from `achievements/catalog`.

### 4. Ranks (was Leaderboard) — `LeaderboardScreen.tsx` (biggest visual lift)

- **Podium** for top 3 (`PodiumRow`/`Medal`), then a ranked list of animated
  bars; **your row highlighted** and always reachable (auto-scroll/pin to self).
- Global / Crew toggle; metric chips (cells, distance, countries, XP) as playful
  segmented control. Season framing ("This season"). Data from
  `leaderboard/ranking` + demo candidates.

### 5. Crew (was Friends) — `FriendsScreen.tsx`

- Crew list: avatar + name + level + area, with **Compare** (map/stat compare
  view or richer sheet, replacing the Alert stub where feasible).
- Incoming requests (accept/decline), add-crew affordance.
- **Snapshot card:** shareable explorer card (avatar, title, headline stats) —
  real share where feasible, otherwise a polished preview.

### 6. Settings — `SettingsScreen.tsx`

- Restyled to the sticker-card system; grouped cards: About You, Sharing
  toggles, Location & privacy, Data (export/delete), App info. Keep current
  behavior; make it look like it belongs in the game.

### Onboarding (polish, not a full page-owner)

- Restyle to the bright cartoony system so first-run matches. Handled in the
  integration wave or folded into a light task; not a Wave 1 owner.

---

## Orchestration model (how this gets built)

The controller (me) coordinates; artifacts move as files; only summaries return
to the main thread.

- **Wave 0 — Foundation (sequential, subagent-driven-development):** design
  tokens, shared primitives, `geo/smooth.ts`, `focusTarget` + region-center +
  tab-switch wiring, tab-bar/safe-area + app background, and the icon. Each task
  gets an implementer + task review. This wave must be green and committed
  before Wave 1 starts, because every page consumes it.

- **Wave 1 — Six page-owner agents (parallel, isolated worktrees):** one owner
  per page. Each owner reads the foundation interfaces + its page spec section,
  designs its gamified layout, and runs its own implementer → task-reviewer loop
  (spawning its own sub-agents), committing on its **own git worktree branch** so
  parallel file edits never collide. Owners touch their own screen file + their
  `components/<page>/…`; they do NOT edit shared tokens (frozen after Wave 0).

- **Wave 2 — Integration + whole-app review:** controller merges the six
  worktree branches, reconciles `components/index.ts` and any `App.tsx`
  touch-points, runs the full gate (`typecheck`, `lint`, `format:check`, `test`),
  dispatches a whole-branch code review, fixes Critical/Important findings, then
  rebuilds the release APK for on-device verification on the Pixel 10 Pro XL.

**Why worktrees:** a git worktree is a second working copy of the repo on its own
branch, so two agents can edit simultaneously without overwriting each other; the
controller merges the branches afterward. This is what makes safe parallelism
possible.

**Conflict guard:** shared files (`theme.ts`, `components/index.ts`, `App.tsx`,
store) are edited only in Wave 0 and Wave 2, never by parallel page owners.

## Testing & verification

- Every new pure unit (`geo/smooth`, `regionCenter`, `focusTarget` reducer) has
  unit tests. Existing domain tests remain green (domain untouched).
- Presentational components keep/extend their render tests; assertions stay
  behavioral (testIDs, text, structure), not brittle color checks.
- Full gate green after each wave.
- Final proof: release APK installed on the Pixel — smooth paintbrush reveal,
  bright cartoony pages, animated feedback, tappable region → map fly-to, a
  proper podium on Ranks, tab bar clear of the gesture bar, and the new icon on
  the launcher/splash.

## Risks

- **Parallel-edit conflicts:** mitigated by freezing shared files after Wave 0
  and isolating page owners in worktrees; controller owns integration.
- **Chaikin inward drift / Animated polygon fill:** see companion spec risks
  (low iteration count; JS-driven alpha since RN native driver can't animate
  polygon fill).
- **Scope size:** six bold page redesigns is large. The wave structure keeps each
  page independently testable and reviewable; pages can ship incrementally if
  needed.
- **Region centroid accuracy:** seed bounding boxes are coarse; a region fly-to
  that lands "near enough" is acceptable this cycle (verified on-device).

## Architecture & principles

- Pure `domain` stays pure and untouched (except the additive `geo/smooth.ts`
  and an optional `regionCenter` helper).
- Presentation composes small, single-purpose, mockable components.
- Shared design tokens are the single source of truth; pages consume, never
  fork, them.
- Cross-tab coordination via a tiny explicit shared-state slice, not a router.
</content>
