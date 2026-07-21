# Lumitrail Privacy Policy

**Effective Date: July 2026**

---

## 1. Introduction

Lumitrail is a fog-of-war exploration app that lets you reveal the world around you by going out and moving through it. As you travel, the "fog" lifts on a map to show where you have been. That is the whole idea.

We built Lumitrail with a simple principle: your location data is yours. It lives on your device. We have no interest in harvesting it, selling it, or building a profile around it. This privacy policy explains exactly what we do and do not do with the information the app handles.

We have written this policy in plain language on purpose. If something is unclear, please contact us at privacy@lumitrail.app and we will clarify it.

This policy covers:

- The Lumitrail mobile app on iOS and Android.
- The optional cloud sync feature, if you choose to enable it.
- Any communications you initiate with us (e.g., support emails).

---

## 2. What Information We Collect

### Location Data (On-Device Only by Default)

When you move around with Lumitrail open or running in the background (if you have granted background location permission), the app receives GPS fixes from your device's location hardware. These are used to compute which H3 hexagonal grid cell you are currently in.

**What an H3 cell is:** The app uses a geographic indexing system called H3, developed by Uber and open-sourced. It divides the entire surface of the Earth into hexagonal cells. Lumitrail uses resolution 9, where each cell covers roughly 174 square meters — about the footprint of a small house. Your GPS fix is immediately translated into the identifier for that cell (a short string like `892a100d2dbffff`), and only that identifier is stored.

**The precise GPS fix (latitude/longitude) is not permanently stored.** It is used in memory to compute the cell index, then discarded. The database on your device contains cell identifiers, not coordinate traces.

### What Is Stored Locally

The following data is written to a SQLite database on your device:

- **Revealed cell IDs** — the H3 cell identifiers for every cell you have visited.
- **Timestamps** — when each cell was first revealed, so the app can calculate streaks and session history.
- **Aggregate distance traveled** — computed from cell transitions; stored as a running total, not as a path.
- **Exploration statistics** — total cells revealed, exploration percentage for regions, XP, level, and achievement progress.
- **App settings and preferences** — display options, sync preferences, and similar configuration.

### What Is Not Collected

- Your name, email address, or any account credentials are not required to use the core app.
- Precise GPS coordinate traces are not stored.
- No advertising identifiers (IDFA, GAID) are read or stored.
- No analytics SDK (Amplitude, Mixpanel, Firebase Analytics, etc.) is included in the core app.
- No crash reporting SDK that transmits data is included by default.

---

## 3. How We Use Your Information

All processing for core app features happens entirely on your device. Specifically:

- **Fog reveal** — when a new cell is visited, the app updates its local map to remove the fog overlay for that cell.
- **XP, levels, and achievements** — calculated locally from your cell history and distance data.
- **Stats dashboard** — your exploration totals, streak, distance, and region coverage are computed and displayed from local data.
- **Leaderboards (opt-in social feature)** — if you choose to create an account and join a leaderboard, your total revealed cell count and a display name you provide are shared. See Section 4 for details.

---

## 4. Information Sharing

**We do not sell your data. We do not sell aggregated or anonymized versions of your data. We do not sell any data derived from your usage.**

**We do not share your data with third-party analytics, advertising, or data broker services.**

The only circumstances in which any data leaves your device are:

1. **Opt-in sync** — if you enable cloud sync, only revealed cell IDs are transmitted. See Section 5 for the full explanation.
2. **Opt-in social features** — if you join a leaderboard or share a map with a friend, you control exactly what is shared. Friends see only what you explicitly choose to show them. Precise visit timestamps are not shared in social contexts; only cell presence is.
3. **Legal requirements** — if we are required by law to disclose information, we will comply with that legal obligation and, where permitted, notify you.
4. **Support** — if you contact us for help and share screenshots or describe your data, we use that only to assist you.

---

## 5. Opt-In Sync

Cloud sync is entirely optional. It is off by default. You can enable it in Settings and disable it at any time.

### What sync transmits

When sync is enabled, the app transmits your set of revealed H3 cell IDs to our servers. It does not transmit:

- GPS coordinate traces
- Precise timestamps of individual cell visits
- Any data that could be used to reconstruct your moment-to-moment location history

### How sync works technically

Lumitrail uses a data structure called a Grow-Only Set CRDT (G-Set) for sync. Here is what that means in plain terms:

A CRDT (Conflict-free Replicated Data Type) is a way of syncing data across devices without conflicts. A Grow-Only Set means the set of revealed cells can only grow — you cannot un-reveal a cell. This makes sync simple and safe: two devices sharing the same account just merge their sets of revealed cells by taking the union. There is no "last write wins" ambiguity, and there is no way for a sync operation to erase your progress.

The practical result: only the identifiers of cells you have visited are ever transmitted. The server stores a set of cell IDs per user, nothing more.

### Encryption

All sync traffic is encrypted in transit using TLS 1.2 or higher. Cell IDs are not meaningful to anyone who intercepts them without also having the H3 grid index, but we encrypt anyway as a baseline security practice.

### Turning off sync

You can disable sync at any time in Settings. When you disable sync, the app stops transmitting data. If you also want to delete your synced data from our servers, see Section 8 (Your Rights).

---

## 6. Data Retention

### On-device data

Your exploration data lives on your device for as long as you keep the app installed. It is not automatically backed up to any cloud service beyond what your device's native backup (iCloud or Google Backup) may handle for local app data — this is controlled by your device settings, not by us.

### Exporting your data

You can export your data at any time from Settings > Data > Export. The export file contains your revealed cell IDs, exploration statistics, and achievements in a standard JSON format that you can open, inspect, and use with other tools.

### Deleting your data

You can delete all local data from Settings > Data > Delete All Data. This wipes the SQLite database on your device.

If you have sync enabled, deleting local data does not automatically delete the copy on our servers. To delete your server-side data, go to Settings > Account > Delete Account, or email privacy@lumitrail.app with the subject line "Delete my data." We will process deletion requests within 30 days.

Uninstalling the app removes local data from your device. It does not delete server-side sync data if you had sync enabled.

---

## 7. Children's Privacy

Lumitrail is not directed at children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are under 13, please do not use this app.

If you believe a child under 13 has provided us with personal information (for example, by creating a sync account), please contact us at privacy@lumitrail.app and we will delete that information promptly.

This app is compliant with the Children's Online Privacy Protection Act (COPPA) in that we do not knowingly solicit or store personal information from users under 13.

---

## 8. Your Rights

Regardless of where you live, we support the following rights for all users:

| Right                             | How to exercise it                                                  |
| --------------------------------- | ------------------------------------------------------------------- |
| Access your data                  | Settings > Data > Export, or email privacy@lumitrail.app            |
| Export your data                  | Settings > Data > Export (JSON format)                              |
| Delete your local data            | Settings > Data > Delete All Data                                   |
| Delete your server-side sync data | Settings > Account > Delete Account, or email privacy@lumitrail.app |
| Opt out of sync                   | Settings > Sync > Disable                                           |
| Opt out of social/leaderboards    | Settings > Social > Leave Leaderboard                               |
| Contact us with questions         | privacy@lumitrail.app                                               |

If you are in the European Economic Area, UK, or California, you may have additional rights under GDPR, UK GDPR, or CCPA respectively (including the right to data portability and the right to object to processing). All of these are supported through the mechanisms above. We do not use your data for profiling or automated decision-making.

---

## 9. Security

We take security seriously, though no system is perfectly immune to every threat.

**On-device storage:**

- Data is stored in a SQLite database using WAL (Write-Ahead Logging) mode, which is SQLite's most robust and crash-safe storage configuration.
- The database is stored in your app's sandboxed private directory, inaccessible to other apps (subject to your device's operating system security model).
- We do not store GPS coordinates, so a breach of the local database would expose cell IDs and aggregate stats — not a precise history of your movements.

**Sync (if enabled):**

- All data transmitted to and from our sync servers is encrypted in transit using TLS 1.2 or higher.
- We do not store GPS coordinate traces on our servers under any circumstances.
- Sync data (cell ID sets) is stored with access controls that restrict it to your account.

**What we cannot control:**

- If your device is unlocked and physically accessible to someone else, they can open the app and see your exploration map. This is inherent to any local app.
- We cannot protect against operating system-level vulnerabilities on your device.

---

## 10. Changes to This Policy

If we make material changes to this policy, we will notify you through an in-app notice when you next open the app, and we will update the effective date at the top of this document. "Material changes" means changes that affect what data we collect, how we use it, or who we share it with.

We will not retroactively apply new data practices to data already collected under a prior version of this policy without your explicit consent.

The current version of this policy is always available in the app under Settings > About > Privacy Policy, and at lumitrail.app/privacy.

---

## 11. Contact

If you have questions, concerns, or requests related to this privacy policy or your data, contact us at:

**Email:** privacy@lumitrail.app

We aim to respond to all privacy inquiries within 5 business days.

---

---

## Google Play Data Safety Declaration

This section provides the exact information needed to complete the Google Play Console Data Safety form for Lumitrail. Use these answers directly when filling out the form.

---

### Does your app collect or share any of the required data types?

**Yes** — location data is used on-device. See details below.

---

### Data Types

#### Location

| Question                                               | Answer                                                                                                               |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Precise location (GPS-level) collected?                | No — precise GPS coordinates are processed in memory only and are not persistently stored or transmitted             |
| Approximate location collected?                        | Yes — H3 resolution 9 cells (~174 m) are stored on-device                                                            |
| Is location data collected in the background?          | Yes — if user grants background location permission (required for passive fog reveal while moving)                   |
| Is location data shared with third parties?            | No                                                                                                                   |
| Is location data required to use the app, or optional? | Required for core functionality (fog reveal). The app cannot reveal fog without location access.                     |
| Purpose of location data collection                    | App functionality: computing which map cells to reveal, updating the exploration map, calculating distance and stats |

#### Personal Information (e.g., name, email)

| Question                                     | Answer                                                                                                       |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Collected for core app?                      | No — core app requires no account or personal information                                                    |
| Collected for optional sync/social features? | Yes — a display name and email address are collected if the user creates an account for sync or leaderboards |
| Is this data shared with third parties?      | No                                                                                                           |
| Is this data required?                       | Optional — only needed for sync and social features                                                          |

#### App Activity / Usage Data

| Question                   | Answer                                                                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Collected?                 | No analytics SDK is present. Aggregate exploration stats (cells revealed, distance, XP) are stored locally only and are not transmitted unless user opts into sync. |
| Shared with third parties? | No                                                                                                                                                                  |

---

### Data Sharing with Third Parties

**No data is shared with third parties for advertising, analytics, or any other purpose.**

---

### Data Handling Practices

| Practice                                           | Answer                                                                                                                                                            |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Data is encrypted in transit                       | Yes — all sync traffic uses TLS 1.2+                                                                                                                              |
| Data is encrypted at rest                          | Partial — data is stored in a sandboxed SQLite database on-device; full-disk encryption depends on the user's device settings. No server-side GPS data is stored. |
| Users can request data deletion                    | Yes — via Settings > Data > Delete All Data (local), or Settings > Account > Delete Account / email privacy@lumitrail.app (server-side sync data)                 |
| Data collection is required, or can users opt out? | Location collection is required for core functionality. Sync is opt-in and can be disabled at any time. Social/leaderboard features are opt-in.                   |
| Is data used for tracking across apps or websites? | No                                                                                                                                                                |
| Is data used for advertising purposes?             | No                                                                                                                                                                |

---

### Safety Practices Checklist (Play Console Checkboxes)

| Item                                                                  | Status                                                      |
| --------------------------------------------------------------------- | ----------------------------------------------------------- |
| Data is encrypted in transit                                          | Yes (sync traffic only; no other data is transmitted)       |
| You provide a way for users to request data deletion                  | Yes                                                         |
| Your app follows the Families Policy                                  | No targeted features for children under 13; COPPA-compliant |
| Your app has been independently validated against a security standard | Not applicable at this time                                 |

---

### Summary for Play Console "Data collected" section

When filling out the form step by step:

- **Location > Approximate location**: Collected, not shared, required for app functionality, background use yes (if permission granted).
- **Location > Precise location**: Not collected (GPS is processed transiently, not stored).
- **Personal info > Name**: Collected only if user creates account (optional feature), not shared.
- **Personal info > Email address**: Collected only if user creates account (optional feature), not shared.
- **All other data types**: Not collected.
- **Data shared with third parties**: None.
- **Encrypted in transit**: Yes.
- **User can request deletion**: Yes.
