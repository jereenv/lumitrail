# Lumitrail — Product Document

## Vision & Mission

Lumitrail turns every walk, run, and journey into a permanent mark on your personal map of the world. We believe exploration should be rewarding, social, and free — so we built a fog-of-war game where the only way to win is to go outside. Our mission is to make every step count, and to make the world feel smaller, one revealed hexagon at a time.

---

## The Core Loop

```
Walk (physically move through the world)
  → Unfog (H3 hexagons permanently revealed as you travel)
    → Earn XP (10 XP/cell · 4 XP/100 m · daily streak bonus)
      → Level Up (quadratic curve, 100 × L XP per level)
        → Unlock Achievements (18 milestones across 5 categories)
          → Climb Leaderboards (cells · distance · countries · XP · streak)
            → Challenge Friends (compare maps, share snapshots)
              → Walk more
```

The loop has no end state. Cities become puzzles, countries become goals, and the world becomes a canvas. Every trip — commute, holiday, Sunday run — permanently expands your map.

---

## Target Users & Personas

### 1. The Casual Walker — "Maya"

Maya walks 3–5 km a few times a week, mostly around her neighborhood. She's tried step-count apps but loses motivation after a few days. She wants something that makes routine walks feel purposeful without demanding a strict training plan. Lumitrail fits into her life as-is: open it, walk, watch new hexagons light up. The daily streak mechanic nudges her to step out even when she doesn't feel like it, and the neighborhood completion percentage gives her a concrete, satisfying goal.

### 2. The Serious Completionist — "Daniel"

Daniel has already mapped every street in his borough and is now systematically working outward. He tracks his coverage percentage obsessively, plans routes to fill gaps, and checks the leaderboard after every session. He needs reliable background tracking, accurate coverage stats, and a leaderboard where effort is directly visible. Lumitrail's offline-first architecture means he never loses a session, and the cells-revealed leaderboard is tailor-made for his style of play.

### 3. The Frequent Traveler — "Priya"

Priya travels internationally for work and leisure. She wants her map to reflect everywhere she has actually been — not just city boundaries, but the specific streets she walked in Tokyo, the trails she hiked in Patagonia, the neighborhoods she got lost in in Lisbon. The countries-visited achievement category gives her a second axis of progress, and the world map becomes a living diary. Offline-first sync means the app works reliably even on foreign networks or in airplane mode.

---

## Full Feature Set

### Fog Map

- World starts fully hidden under fog
- Physical movement permanently reveals H3 hexagons at resolution 9 (~174 m across, ~0.1 km² each)
- Revealed cells are immutable — they never re-fog
- Coverage is tracked per cell, enabling precise percentage calculations for any geographic boundary
- Map persists entirely on-device in SQLite with WAL mode for durability

### Exploration Stats

A dedicated stats dashboard surfaces everything that matters:

| Stat              | Description                             |
| ----------------- | --------------------------------------- |
| Total distance    | Lifetime metres travelled               |
| Cells revealed    | Total unique H3 hexagons uncovered      |
| Active days       | Days with at least one reveal           |
| Current streak    | Consecutive days with activity          |
| Longest streak    | Personal best consecutive-day streak    |
| Countries visited | Unique countries with revealed cells    |
| Timeline          | Historical view of exploration activity |

### Progression System

**XP sources:**

| Action                | XP Earned                   |
| --------------------- | --------------------------- |
| New cell revealed     | 10 XP                       |
| Every 100 m travelled | 4 XP                        |
| Daily streak bonus    | 25 XP × min(streak days, 7) |

**Level curve:** Advancing from level L to level L+1 costs `100 × L` XP. This is a quadratic curve — early levels come quickly to reward new users, while higher levels represent sustained, long-term exploration. Level 1 starts at 0 XP total.

### Achievements

18 achievements across 5 categories, with four tiers (bronze → silver → gold → platinum):

**Discovery** — cells revealed

| Achievement    | Tier     | Threshold    |
| -------------- | -------- | ------------ |
| First Light    | Bronze   | 1 cell       |
| Pathfinder     | Silver   | 100 cells    |
| Cartographer   | Gold     | 1,000 cells  |
| Grand Surveyor | Platinum | 10,000 cells |

**Distance** — total metres travelled

| Achievement   | Tier     | Threshold |
| ------------- | -------- | --------- |
| First Mile    | Bronze   | 1 km      |
| Trailblazer   | Silver   | 10 km     |
| Long Hauler   | Gold     | 100 km    |
| Globe Strider | Platinum | 1,000 km  |

**World** — countries visited

| Achievement   | Tier     | Threshold    |
| ------------- | -------- | ------------ |
| First Border  | Bronze   | 1 country    |
| Jet Setter    | Silver   | 5 countries  |
| Continental   | Gold     | 10 countries |
| World Citizen | Platinum | 25 countries |

**Streak** — consecutive active days

| Achievement | Tier     | Threshold |
| ----------- | -------- | --------- |
| Warming Up  | Bronze   | 3 days    |
| Consistent  | Silver   | 7 days    |
| Devoted     | Gold     | 30 days   |
| Unstoppable | Platinum | 100 days  |

**Progression** — level reached

| Achievement       | Tier   | Threshold |
| ----------------- | ------ | --------- |
| Getting Somewhere | Bronze | Level 5   |
| Seasoned Explorer | Silver | Level 20  |
| Master Explorer   | Gold   | Level 50  |

### Leaderboards

Five ranked metrics, each with a global board and a friends-only board:

- Cells revealed
- Distance (metres)
- Countries visited
- Total XP
- Longest streak (days)

Leaderboards are open to all users with no paywalls or tier restrictions.

### Social

- Send and accept friend requests
- Side-by-side stats comparison with any friend
- Shareable map snapshots (shareable as images, no account required for the recipient)
- Friends-only leaderboard view for head-to-head competition

### Offline-First & Sync

- All data lives on-device in SQLite; the app works fully without internet
- Sync is strictly opt-in — no data leaves the device without explicit user consent
- Revealed cells are modelled as a G-Set CRDT (grow-only set): multi-device merge is a conflict-free union, with no possibility of data loss or divergence
- Background location fixes are queued durably and replayed on app resume, so no movement is lost even if the app was killed mid-session

### Privacy

- Local-first by default: nothing syncs without opt-in
- Full data export supported
- Full data deletion supported
- No advertising identifiers, no behavioral tracking, no third-party analytics in the core experience

### Battery & Reliability

Battery efficiency is a first-class feature, not an afterthought:

- Uses OS-level significant-change and geofence-wake events rather than continuous GPS polling
- `Accuracy.Balanced` in passive mode; `Accuracy.High` only during explicit "record my walk" sessions
- `pausesUpdatesAutomatically` and `ActivityType.Fitness` flags enabled to let the OS optimize further
- Inaccurate GPS fixes are rejected before triggering a reveal (accuracy-gated)
- Background location fixes are queued durably and drained on resume — no silent data loss
- Graceful handling of GPS signal loss and mid-session permission revocation
- SQLite in WAL mode prevents database corruption from unexpected termination

---

## What Makes Lumitrail Better

|                           | Lumitrail                                              | Fog of World                        | Wandrer                                          |
| ------------------------- | ------------------------------------------------------ | ----------------------------------- | ------------------------------------------------ |
| **Price**                 | Free, forever                                          | $30–40 one-time                     | $40/year; free tier capped at 50 activities      |
| **Platform**              | iOS + Android (React Native)                           | iOS only                            | Web-first; mobile is a thin wrapper              |
| **Battery**               | Geofence-wake + deferred updates, Balanced accuracy    | Reported 5–10%/hr drain             | Not applicable (upload-based, not live tracking) |
| **Background tracking**   | Durable queue, replayed on resume                      | Silently stops in background        | No live tracking; requires manual GPX upload     |
| **Sync**                  | Opt-in, offline-first, conflict-free G-Set CRDT        | iCloud/Drive sync reported to crash | Weekend processing delays on free tier           |
| **Social & leaderboards** | Full social + 5-metric leaderboards, free for everyone | None                                | None                                             |
| **Offline-first**         | Yes — full functionality without internet              | Partial                             | No — requires upload to web service              |

---

## Phased Roadmap

### v0.1 — Foundation (complete)

The full technical and gameplay foundation is built and verified:

- Fog-of-war engine: H3 hexagon reveal pipeline, SQLite storage, WAL durability
- XP system with all three sources wired up
- Quadratic level curve
- All 18 achievements across all 5 categories
- Five-metric leaderboard (global + friends-only)
- G-Set CRDT sync with opt-in, offline-first architecture
- Battery-safe background location (geofence-wake, Balanced accuracy, adaptive High for sessions)
- Stats dashboard (distance, cells, active days, streak, countries, timeline)
- Social foundation: friend requests, compare, shareable snapshots
- 72 automated tests passing; typecheck, lint, and format clean
- Headless e2e demo (`npm run demo`) proving the full loop end-to-end

### v0.2 — Polish & Maps

Focus: make the map beautiful and the experience feel complete for early users.

- Interactive map UI with smooth fog-reveal animation
- Coverage percentage overlay for user-defined regions (city, country, custom boundary)
- Streak freeze and streak repair mechanics
- Refined onboarding: permissions explanation, first-reveal celebration
- Haptic feedback on cell reveal and achievement unlock
- Session summary screen (cells revealed, distance, XP earned this session)
- App icon, splash screen, and visual design pass
- TestFlight / Google Play internal track distribution

### v0.3 — Community & Growth

Focus: social discovery, virality, and long-term retention.

- Public profile pages with shareable map links
- Challenges: set a target (e.g., "reveal 500 cells this month") and invite friends to compete
- City / neighborhood completion rankings (who has the most coverage in a given area)
- Notification system: friend milestones, achievement unlocks, streak reminders
- Seasonal events and limited-time exploration goals
- App Store / Google Play public launch
