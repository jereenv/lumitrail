# Wave 1 — Page-Owner Briefs

> **For agentic workers:** Each brief below is dispatched to ONE page-owner subagent. The owner runs superpowers:subagent-driven-development WITHIN its page: it designs the gamified layout, then drives its own implementer → task-reviewer loop. Steps are briefs, not line-by-line code — owners have design latitude within the contract.

**Goal:** Rebuild all six screens as a bright, cartoony, juicy exploration game on top of the Wave 0 foundation.

**Architecture:** Presentation only. Consume the domain layer + stores as-is. Compose Wave 0 primitives; add page-specific components under `src/presentation/components/<page>/`.

## Global Constraints (bind EVERY owner)

- **Do NOT edit frozen shared files:** `src/app/theme.ts`, `src/app/store/useNavigationStore.ts`, `src/presentation/components/index.ts`, `App.tsx`, `TabBar.tsx`, and the base primitive components. Need a new shared token or primitive? STOP and tell the controller — do not fork it. (The controller reconciles `index.ts` exports of your page-local components in Wave 2.)
- Each owner works on its **own git worktree/branch** (`jereenv/wave1-<page>`); commit there. The controller merges in Wave 2.
- Colors come ONLY from `palette`/`tierColors`; shadows from `cardShadow`; animation config from `motion`. No hard-coded hex.
- TypeScript strict, no `any`. Full gate (`typecheck`, `lint`, `format:check`, `test`) green on your branch before you report DONE.
- Any NEW pure logic (formatting, derivations) gets a unit test. Every screen keeps/extends behavioral render tests (testIDs/text/structure) — no brittle color assertions.
- Tab **values** unchanged; you are restyling content, not routing.

## Foundation interfaces available to all owners (from Wave 0)

- Tokens: `palette.{canvas,card,cardBorder,onCard,onCardMuted,coral,berry,fog,frontier,frontierCasing,shadow,ink,lumen,aurora,sky}`, `tierColors`, `cardShadow`, `motion`, `spacing`, `radii`, `typography`.
- Primitives: `GameCard`, `SectionHeader`, `Avatar`, `Medal`, `PodiumRow`, `AnimatedNumber`, plus restyled `StatCard`, `ProgressRing`, `LevelBadge`, `XpBar`, `AchievementBadge`, `StreakFlame`, `RegionBanner`, `ScreenHeader`, `EventToast`.
- Geometry: `chaikinRing`, `smoothRings` (`@/domain/geo/smooth`).
- Nav: `useNavigationStore` → `focusMap(target)`, `setActiveTab(tab)`, `focusTarget`, `clearMapFocus`.
- Regions: `regionCenter(id): MapRegion | null` (`@/domain/regions/resolver`).
- Game state: `useExplorationStore` → `playerState` (`revealedCells`, `regions: Map<id, {ref, revealedCells}>`, `stats`, `streak`, `unlockedAchievements`), `recentEvents`, `currentLocation`, `runDemoWalk`, `locateMe`, `exportData`, `deleteAllData`.
- Domain helpers: `levelForXp`, `regionCompletion`, `worldwidePercent`, `evaluateAchievements`/`nextAchievementInCategory` + `ACHIEVEMENTS` catalog, `rankBy`/`rankFriends`, `friendsOf`/`incomingRequests`/friendship actions, `buildFogOverlay`/`computeFogGeometry`.

---

## Brief 1 — Explore (MapScreen) · model: capable

**File:** `src/presentation/screens/MapScreen.tsx` (+ `components/explore/` as needed). **Model:** capable (integration-heavy, animation, geometry).

**Goal:** The living game board. Smooth paintbrush reveal, bright cartoony basemap, animated juicy HUD, and it obeys `focusTarget`.

**Must do:**
1. Wrap every rendered ring through `smoothRings(..., 2)` before drawing: fog `holes`, `islands`, frontier `Polyline`s, and reveal-pulse rings. Keep `buildFogOverlay`/counts unchanged.
2. Recolor fog/frontier via the new tokens (mint fog, warm-cream dashes over soft casing). Keep `customMapStyle`.
3. HUD as cream sticker-cards (`GameCard` + `cardShadow`): level ring (`ProgressRing`+`LevelBadge`), `XpBar`, a **coins** chip (derive a display coins value from stats/XP — document the formula; cosmetic only), `StreakFlame`, and the slim area/distance/cells stats. Dark-on-cream text.
4. Replace the stepped-alpha reveal fade with an **`Animated` springy scale-pop + glow** (`motion.spring`; JS-driven alpha since RN's native driver can't animate polygon fill — see companion spec risk). Keep it self-contained.
5. **Consume `focusTarget`:** effect that, when `focusTarget` is set, calls `mapRef.animateToRegion(focusTarget, 600)` then `clearMapFocus()`. Show the `focusTarget.label` briefly if present.
6. Restyle FABs (locate, demo walk) + `RegionBanner` placement to the new look; keep the tab-bar clearance.

**Acceptance:** no visible hexagon edges on the reveal border; bright cartoony map; animated reveal; tapping a region elsewhere flies here; tests assert fog/frontier render, banner percent, and that a set `focusTarget` triggers `animateToRegion` + `clearMapFocus` (mock the map).

---

## Brief 2 — Journey (StatsScreen) · model: capable

**File:** `src/presentation/screens/StatsScreen.tsx` (+ `components/journey/`). **Model:** capable (owns the flagship new feature).

**Goal:** Explorer profile + the tappable-region fly-to feature.

**Must do:**
1. **Hero:** `Avatar` (with level ring) + explorer title derived from level (define a small pure `explorerTitle(level)` with tests, e.g. Wanderer→Pathfinder→Trailblazer→Voyager) + headline **world uncovered %** from `worldwidePercent(stats.cellsRevealed)`.
2. **Stat tiles** as `GameCard`/`StatCard` with `AnimatedNumber` count-ups: cells, distance (km), area (km²), countries, cities, active days, streak, coins.
3. **Regions explored:** iterate `playerState.regions`, sort by `regionCompletion` %. Each region = a **tappable `GameCard`**: name, kind badge, % ring/bar, revealed/target. **onPress:** `const c = regionCenter(ref.id); if (c) focusMap({ ...c, label: ref.name })` (this also switches to the Explore tab). Empty state kept.
4. Optional: recent-activity strip from `recentEvents`.

**Acceptance:** region card press calls `focusMap` with the right center+label (test with `regionCenter` real + `focusMap` mocked/ spied via the store); hero shows level title + world %; tiles animate. `explorerTitle` unit-tested.

---

## Brief 3 — Trophies (AchievementsScreen) · model: standard

**File:** `src/presentation/screens/AchievementsScreen.tsx` (+ `components/trophies/`). **Model:** standard.

**Goal:** A celebratory trophy case.

**Must do:**
1. Overall completion ring in the header ("X of Y unlocked" + `ProgressRing`).
2. Category shelves (discovery/distance/world/streak/progression). Each shelf: a "next goal" nudge (`nextAchievementInCategory`) as a `GameCard` with progress, then a grid of `Medal`s (tier-colored, unlocked shine; locked dim + `progress` ring from current/threshold).
3. Rarity/tier styling via `tierColors`. Celebratory unlocked state (pop/shine using `motion`).

**Acceptance:** unlocked vs locked visually distinct; progress fractions correct from `stats` vs thresholds; renders all catalog categories; header count correct. Behavioral render tests.

---

## Brief 4 — Ranks (LeaderboardScreen) · model: capable

**File:** `src/presentation/screens/LeaderboardScreen.tsx` (+ `components/ranks/`). **Model:** capable (biggest visual lift; currently the weakest page).

**Goal:** A proper game ladder that feels like a season leaderboard.

**Must do:**
1. **Podium** for top 3 via `PodiumRow` (gold/silver/bronze `Medal` + `Avatar`), 2-1-3 pedestal arrangement.
2. Ranked list below as animated bars (bar width ∝ metric, `motion`); **your row highlighted** (`palette.coral` accent) and pinned/auto-scrolled into view if outside the top.
3. Global / Crew segmented toggle (use `rankBy` vs `rankFriends` with `friendsOf`); metric chips (cells/distance/countries/XP) as a playful segmented control. "This season" framing text.
4. Keep the existing demo candidates as the data source; make names/avatars read as players.

**Acceptance:** top-3 podium renders; switching metric re-ranks; switching Global/Crew filters; your row is always reachable. Render tests for podium names, metric switch, and self-highlight.

---

## Brief 5 — Crew (FriendsScreen) · model: standard

**File:** `src/presentation/screens/FriendsScreen.tsx` (+ `components/crew/`). **Model:** standard.

**Goal:** Social explorers.

**Must do:**
1. Crew list: `GameCard` per friend with `Avatar`+level+area and a **Compare** action. Replace the `Alert` stub with a richer in-app compare sheet/modal where feasible (their stats vs yours side by side); if a full compare view is out of scope, ship a polished bottom-sheet preview — do NOT leave a bare Alert.
2. Incoming requests (accept/decline) using existing friendship actions; add-crew affordance.
3. **Snapshot card:** shareable explorer card (`Avatar`, title, headline stats). Use `expo-sharing`/RN `Share` for a real share if available; otherwise a polished shareable-looking card + a graceful "coming soon" that isn't a raw Alert.

**Acceptance:** requests accept/decline update the list; compare shows real comparative stats; snapshot renders the player's real figures. Render tests for list, request actions, snapshot.

---

## Brief 6 — Settings (SettingsScreen) · model: cheap

**File:** `src/presentation/screens/SettingsScreen.tsx` (+ `components/settings/`). **Model:** cheap (mechanical restyle, keep behavior).

**Goal:** Make Settings belong to the game; keep behavior.

**Must do:**
1. Group into `GameCard` sections: About You (`Avatar`+name+level+cells), Sharing toggles, Location & privacy copy, Data (export/delete), App info (version/tagline).
2. Restyle toggles/buttons to the cartoony system. Keep existing behaviors (local toggles, export/delete alerts) — no new persistence required this cycle.

**Acceptance:** all sections present + styled; toggles flip; export/delete actions fire as before. Render test for section presence.

---

## Wave 1 → Wave 2 handoff

When all six owner branches report DONE with green gates, the controller:
1. Merges `jereenv/wave1-*` branches into the base branch, resolving `components/index.ts` (add each page's exported page-local components) and any `App.tsx`/onboarding touch-points.
2. Runs the full gate on the integrated branch; fixes conflicts.
3. Dispatches a whole-branch code review (most-capable model); dispatches ONE fix subagent for all Critical/Important findings.
4. Light onboarding restyle to match (folded in here).
5. Rebuilds the release APK and installs on the Pixel 10 Pro XL for on-device verification of the full game.
</content>
