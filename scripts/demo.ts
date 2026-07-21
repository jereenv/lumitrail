/**
 * Headless end-to-end demo of the Lumitrail core loop.
 *
 * Run with `npm run demo`. It uses the exact same domain and data code the app
 * ships, driven by the MockLocationProvider, to prove the full loop with zero
 * device: move → unfog → gain XP → level up → achievement → leaderboard/social.
 *
 * This is a narration script, not a test — the assertions live in the jest
 * suite. Its job is to make the loop visible.
 */
import { ACHIEVEMENTS_BY_ID } from '@/domain/achievements/catalog';
import type { GeoPoint } from '@/domain/geo/types';
import { applyFix, type FixContext } from '@/domain/loop/applyFix';
import type { DomainEvent } from '@/domain/loop/events';
import { createPlayerState, type PlayerState } from '@/domain/loop/state';
import { levelForXp } from '@/domain/progression/levels';
import { rankBy, rankFriends, type LeaderboardCandidate } from '@/domain/leaderboard/ranking';
import { INITIAL_STATS } from '@/domain/player/stats';
import { defaultRegionResolver } from '@/domain/regions/resolver';
import { worldwidePercent } from '@/domain/regions/exploration';

import { InMemoryRevealRepository } from '@/data/persistence/InMemoryRepositories';
import { FakeSyncClient, InMemorySyncOutbox } from '@/data/sync/InMemorySync';
import { SyncEngine } from '@/data/sync/SyncEngine';

const CTX: FixContext = { resolver: defaultRegionResolver, tzOffsetMinutes: 120 };

function hr(title: string): void {
  console.log(`\n${'─'.repeat(62)}\n  ${title}\n${'─'.repeat(62)}`);
}

function describeEvent(event: DomainEvent): string | null {
  switch (event.type) {
    case 'cellsRevealed':
      return `  🌫️  Unfogged ${event.cells.length} new cell(s)`;
    case 'xpGained':
      return `  ✨  +${event.breakdown.total} XP  (cells ${event.breakdown.fromCells}, distance ${event.breakdown.fromDistance}, streak ${event.breakdown.fromStreak})`;
    case 'leveledUp':
      return `  ⬆️  LEVEL UP!  ${event.from} → ${event.to}`;
    case 'streakExtended':
      return `  🔥  Streak now ${event.days} day(s)`;
    case 'achievementUnlocked': {
      const def = ACHIEVEMENTS_BY_ID.get(event.achievementId);
      return `  🏅  Achievement unlocked: ${def?.title ?? event.achievementId} — ${def?.description ?? ''}`;
    }
    case 'regionCompleted':
      return `  ✅  100% explored: ${event.regionName}`;
    case 'fixRejected':
      return `  🚫  Fix rejected (${event.reason}) — protecting your map from bad GPS`;
  }
}

/** A scripted walk: a few days around central Stockholm, plus a trip to London. */
function scriptedRoute(): GeoPoint[] {
  const day = 86_400_000;
  const base = Date.UTC(2026, 6, 20, 9, 0, 0);
  const points: GeoPoint[] = [];

  // Day 1 — a walk north through the city (7 fixes, ~200 m apart).
  for (let i = 0; i < 7; i += 1) {
    points.push({
      latitude: 59.325 + i * 0.0018,
      longitude: 18.07 + i * 0.0009,
      accuracy: 8,
      timestamp: base + i * 120_000,
    });
  }
  // Day 2 — a different neighbourhood.
  for (let i = 0; i < 6; i += 1) {
    points.push({
      latitude: 59.34 + i * 0.0016,
      longitude: 18.05 + i * 0.0011,
      accuracy: 10,
      timestamp: base + day + i * 120_000,
    });
  }
  // Day 3 — a flight to London (teleport: no distance credit, new country).
  for (let i = 0; i < 5; i += 1) {
    points.push({
      latitude: 51.5074 + i * 0.0015,
      longitude: -0.1278 + i * 0.0012,
      accuracy: 9,
      timestamp: base + 2 * day + i * 120_000,
    });
  }
  // A deliberately bad fix — must be rejected.
  points.push({ latitude: 51.52, longitude: -0.12, accuracy: 800, timestamp: base + 2 * day });
  return points;
}

function runPlayer(): PlayerState {
  hr('LUMITRAIL — core loop demo (move → unfog → XP → level → achievement)');
  let state = createPlayerState('you', 'You');
  const route = scriptedRoute();

  route.forEach((point, index) => {
    const { state: next, events } = applyFix(state, point, CTX);
    state = next;
    const lines = events.map(describeEvent).filter((l): l is string => l !== null);
    if (lines.length > 0) {
      console.log(
        `\nFix #${index + 1}  (${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)})`,
      );
      lines.forEach((l) => console.log(l));
    }
  });

  const progress = levelForXp(state.stats.totalXp);
  hr('YOUR EXPLORATION SO FAR');
  console.log(
    `  Level ${progress.level}  (${progress.xpIntoLevel}/${progress.xpForLevelSpan} XP to next)`,
  );
  console.log(`  Total XP:         ${state.stats.totalXp}`);
  console.log(`  Cells revealed:   ${state.stats.cellsRevealed}`);
  console.log(`  Distance:         ${(state.stats.distanceMeters / 1000).toFixed(2)} km`);
  console.log(`  Countries:        ${state.stats.countriesVisited}`);
  console.log(`  Cities:           ${state.stats.citiesVisited}`);
  console.log(`  Current streak:   ${state.stats.currentStreakDays} day(s)`);
  console.log(`  Achievements:     ${state.unlockedAchievements.size}`);
  console.log(`  Worldwide:        ${worldwidePercent(state.stats.cellsRevealed).toFixed(6)}%`);
  return state;
}

function runSocial(you: PlayerState): void {
  hr('LEADERBOARDS & FRIENDS');
  const friends: LeaderboardCandidate[] = [
    { playerId: 'you', displayName: 'You', stats: you.stats },
    {
      playerId: 'maya',
      displayName: 'Maya',
      stats: { ...INITIAL_STATS, cellsRevealed: 40, totalXp: 520 },
    },
    {
      playerId: 'kofi',
      displayName: 'Kofi',
      stats: { ...INITIAL_STATS, cellsRevealed: 12, totalXp: 130 },
    },
    {
      playerId: 'noor',
      displayName: 'Noor',
      stats: { ...INITIAL_STATS, cellsRevealed: 88, totalXp: 990 },
    },
  ];

  console.log('\n  Global leaderboard — cells revealed:');
  rankBy(friends, 'cellsRevealed').forEach((e) =>
    console.log(`   ${e.rank}. ${e.displayName.padEnd(6)} ${e.value}`),
  );

  console.log('\n  Friends-only board (you + Maya + Kofi) — total XP:');
  rankFriends(friends, 'totalXp', 'you', new Set(['maya', 'kofi'])).forEach((e) =>
    console.log(`   ${e.rank}. ${e.displayName.padEnd(6)} ${e.value} XP`),
  );
}

async function runSync(you: PlayerState): Promise<void> {
  hr('OFFLINE-FIRST SYNC (grow-only set — conflict-free)');
  const cells = [...you.revealedCells];
  const reveals = new InMemoryRevealRepository(cells);
  const outbox = new InMemorySyncOutbox(cells);
  const server = new FakeSyncClient(['8a1fb466d2fffff']); // a cell only the "other device" has

  console.log(`  Local cells: ${await reveals.count()},  server holds 1 cell this device lacks.`);
  server.setOnline(false);
  try {
    await new SyncEngine(reveals, outbox, server).sync();
  } catch {
    console.log('  ✈️  Offline — sync deferred, nothing lost (outbox intact).');
  }
  server.setOnline(true);
  const result = await new SyncEngine(reveals, outbox, server).sync();
  console.log(`  📶  Back online — pushed ${result.pushed}, pulled ${result.pulled}.`);
  console.log(`  Converged local cell count: ${await reveals.count()} (union of both devices).`);
}

async function main(): Promise<void> {
  const you = runPlayer();
  runSocial(you);
  await runSync(you);
  hr('DEMO COMPLETE ✔');
}

void main();
