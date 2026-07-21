# Lumitrail — Google Play Store Listing

---

## 1. App Metadata

| Field            | Value                                      |
| ---------------- | ------------------------------------------ |
| App Name         | Lumitrail                                  |
| Package Name     | com.lumitrail.app                          |
| Category         | Travel & Local (primary)                   |
| Secondary        | Health & Fitness (secondary consideration) |
| Content Rating   | Everyone                                   |
| Price            | Free                                       |
| Ads              | None                                       |
| In-App Purchases | None                                       |

---

## 2. Short Description

80-char limit. Must be punchy and self-explanatory on its own.

> Walk the world out of the fog. Reveal your map, earn XP, explore further.

**Character count:** 73 — within limit.

Alternate (78 chars):

> A fog-of-war exploration game. Walk streets to reveal your map. Free forever.

---

## 3. Full Description

---

The world is hidden. Every step you take reveals it — permanently.

Lumitrail wraps your real world in a fog of war. Open the app, start walking, and watch the map uncover street by street, neighborhood by neighborhood, city by city. Every walk is recorded. Every new path you take chips away at the fog. Stop, and what you revealed stays revealed — forever.

**Fog-of-war map**
The world begins covered. Walk through it and the fog lifts in real time. Your personal exploration map grows with every outing, showing exactly where you have — and have not — been.

**Precise hex grid**
Coverage is tracked using H3 hexagons at roughly 174-meter resolution. Walking down one side of a street records it differently from the other side. Your map reflects where you actually walked, not a broad radius around your route.

**Offline-first**
No signal? No problem. Lumitrail works entirely without an internet connection. Your map is stored on-device and syncs when you choose.

**Battery-safe tracking**
Lumitrail uses geofence-based wake instead of continuous GPS polling. It activates when you move and steps back when you stop — so your battery lasts as long as your walk does.

**XP and levels**
Every hex you reveal for the first time earns XP. Early levels come quickly to give you momentum. Progression accelerates as your map grows.

**18 achievements across 5 categories**
Unlock milestones for discovery, total distance, world coverage, exploration streaks, and overall progression. Each category rewards a different kind of explorer.

**Leaderboards**
See how you rank globally and against friends across five stat categories: cells revealed, total distance, countries covered, XP earned, and current streak. Competition is entirely opt-in.

**Social features**
Send and accept friend requests, compare maps side-by-side, and share map snapshots directly from the app.

**Privacy by design**
Lumitrail never stores GPS traces. Only the IDs of hex cells you have visited are saved. Location sync is opt-in — your data stays on your device until you decide otherwise.

**Free forever**
No paywalls. No subscriptions. No ads. No in-app purchases. Every feature is available to every user from day one.

---

Other fog-of-war apps charge $30–40 upfront or lock exploration behind a $40/year subscription. Lumitrail is built on the belief that exploring the world should not cost money. Download it, start walking, and see how far the fog goes.

---

## 4. Keyword List

fog of war, fog map, exploration game, walking game, GPS tracker, map game, reveal the world, offline GPS, walking app, hex grid, hex map, exploration tracker, adventure tracker, outdoor game, walk tracker, pedestrian tracker, city explorer, travel tracker, achievement game, leaderboard, XP game, level up, friend leaderboard, discovery map, coverage map, neighborhood map, street map game, real world game, free walking app, offline map tracker

---

## 5. Store Assets Inventory

| Asset           | Required Dimensions   | File Path                        | Status         |
| --------------- | --------------------- | -------------------------------- | -------------- |
| App icon        | 512 x 512 px PNG      | assets/icon.png                  | Exists         |
| Feature graphic | 1024 x 500 px PNG/JPG | assets/store/feature-graphic.png | To be produced |
| Screenshot 1    | 1080 x 1920 px PNG    | assets/store/screenshot-01.png   | To be produced |
| Screenshot 2    | 1080 x 1920 px PNG    | assets/store/screenshot-02.png   | To be produced |
| Screenshot 3    | 1080 x 1920 px PNG    | assets/store/screenshot-03.png   | To be produced |
| Screenshot 4    | 1080 x 1920 px PNG    | assets/store/screenshot-04.png   | To be produced |
| Screenshot 5    | 1080 x 1920 px PNG    | assets/store/screenshot-05.png   | To be produced |
| Screenshot 6    | 1080 x 1920 px PNG    | assets/store/screenshot-06.png   | To be produced |

Notes:

- The app icon at `assets/icon.png` must be a 512x512 PNG with no transparency for the Play Store submission. The adaptive icon assets at `assets/android-icon-foreground.png` and `assets/android-icon-background.png` are used by Android at runtime but are separate from the store icon upload.
- Feature graphic and screenshots are to be produced by the design agent.
- Play Store requires a minimum of 2 screenshots; 6 is recommended for full category display.

---

## 6. Content Rating Notes

Answers for the Google Play content rating questionnaire (IARC system):

| Question                                     | Answer                                                |
| -------------------------------------------- | ----------------------------------------------------- |
| Violence (realistic or fantasy)              | No                                                    |
| Sexual content or nudity                     | No                                                    |
| Profanity or crude humor                     | No                                                    |
| Controlled substance references              | No                                                    |
| Gambling or simulated gambling               | No                                                    |
| User-generated content                       | No                                                    |
| Social features (friend requests, messaging) | Yes                                                   |
| Shares location with other users             | No (only leaderboard stats; no live location sharing) |
| Targeted at children under 13                | No                                                    |

Expected rating: **Everyone (E)**

The social features (friend requests, leaderboard comparisons, map snapshots) do not involve real-time communication or user-generated text content, so they should not affect the Everyone rating. Confirm this during the Play Console rating questionnaire.

---

## 7. Data Safety Reference

Complete the Play Store Data Safety form using the declarations in `PRIVACY_POLICY.md` under the section titled **"Google Play Data Safety Declaration"**.

Key points that will need to be declared:

- Location data is collected (approximate and precise) for core app functionality.
- Location data is not shared with third parties.
- Location data is processed on-device; GPS traces are never stored or transmitted.
- Only hex cell IDs (not raw coordinates) are synced to the server, and only with user opt-in.
- No data is used for advertising or analytics.
- Users can delete all synced data from within the app.

Note: `PRIVACY_POLICY.md` does not yet exist in this repository. It must be created before Play Store submission and must contain a "Google Play Data Safety Declaration" section that maps directly to the Play Console data safety form fields.
