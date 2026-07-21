import { MockLocationProvider } from '@/data/location/MockLocationProvider';
import {
  InMemoryPlayerRepository,
  InMemoryRevealRepository,
} from '@/data/persistence/InMemoryRepositories';
import { FakeSyncClient, InMemorySyncOutbox } from '@/data/sync/InMemorySync';
import type { GeoPoint } from '@/domain/geo/types';
import { defaultRegionResolver } from '@/domain/regions/resolver';

import { ExplorationService, type ExplorationServiceDeps } from './ExplorationService';

const P1: GeoPoint = {
  latitude: 59.3293,
  longitude: 18.0686,
  accuracy: 10,
  timestamp: Date.UTC(2026, 6, 20, 9, 0, 0),
};
const P2: GeoPoint = {
  latitude: 59.335,
  longitude: 18.0686,
  accuracy: 10,
  timestamp: Date.UTC(2026, 6, 21, 9, 0, 0),
};

function makeDeps(overrides: Partial<ExplorationServiceDeps> = {}): {
  deps: ExplorationServiceDeps;
  reveals: InMemoryRevealRepository;
  players: InMemoryPlayerRepository;
  outbox: InMemorySyncOutbox;
  location: MockLocationProvider;
} {
  const reveals = new InMemoryRevealRepository();
  const players = new InMemoryPlayerRepository();
  const outbox = new InMemorySyncOutbox();
  const location = new MockLocationProvider();
  const deps: ExplorationServiceDeps = {
    location,
    reveals,
    players,
    outbox,
    resolver: defaultRegionResolver,
    playerId: 'me',
    displayName: 'Explorer',
    tzOffsetMinutes: 120,
    ...overrides,
  };
  return { deps, reveals, players, outbox, location };
}

describe('ExplorationService (application integration)', () => {
  it('processes a fix, persists the delta and queues cells for sync', async () => {
    const { deps, reveals, players, outbox } = makeDeps();
    const service = new ExplorationService(deps);
    await service.init();

    const { events } = await service.processFix(P1);

    expect(events.some((e) => e.type === 'cellsRevealed')).toBe(true);
    expect(await reveals.count()).toBe(7);
    expect(await outbox.pending()).toHaveLength(7);
    expect(await players.load('me')).not.toBeNull();
    expect(service.getState().stats.cellsRevealed).toBe(7);
  });

  it('rehydrates identical state from storage on a fresh service instance', async () => {
    const { deps } = makeDeps();
    const first = new ExplorationService(deps);
    await first.init();
    await first.processFix(P1);
    await first.processFix(P2);
    const expected = first.getState().stats;

    // A brand-new service sharing the same repositories (simulating an app restart).
    const second = new ExplorationService(deps);
    const restored = await second.init();

    expect(restored.stats.cellsRevealed).toBe(expected.cellsRevealed);
    expect(restored.stats.totalXp).toBe(expected.totalXp);
    expect(restored.stats.level).toBe(expected.level);
    expect(restored.revealedCells.size).toBe(expected.cellsRevealed);
  });

  it('replays fixes captured in the background on init', async () => {
    const { deps } = makeDeps();
    const captured = [P1, P2];
    let drained = false;
    const service = new ExplorationService(deps, async () => {
      if (drained) {
        return [];
      }
      drained = true;
      return captured;
    });

    const state = await service.init();
    expect(state.stats.cellsRevealed).toBeGreaterThan(0);
    expect(state.stats.currentStreakDays).toBe(2);
  });

  it('processes fixes delivered through the location provider watch', async () => {
    const { deps, location } = makeDeps();
    const service = new ExplorationService(deps);
    await service.init();

    const results: number[] = [];
    await service.beginForegroundTracking((r) => results.push(r.state.stats.cellsRevealed));
    location.feed(P1);
    // Allow the async processFix microtask chain to settle.
    await new Promise((resolve) => setImmediate(resolve));

    expect(results.at(-1)).toBe(7);
  });

  it('syncs revealed cells with an opt-in client (conflict-free union)', async () => {
    const { deps } = makeDeps();
    const service = new ExplorationService(deps);
    await service.init();
    await service.processFix(P1);

    const client = new FakeSyncClient(['8a1fb466d2fffff']);
    const result = await service.sync(client);

    expect(result.pushed).toBe(7);
    expect(result.pulled).toBe(1);
    expect(await deps.reveals.count()).toBe(8);
  });

  it('exports and then deletes all data (privacy controls)', async () => {
    const { deps, players } = makeDeps();
    const service = new ExplorationService(deps);
    await service.init();
    await service.processFix(P1);

    const exported = await service.exportData();
    expect(exported.revealedCells.length).toBe(7);
    expect(exported.snapshot.stats.cellsRevealed).toBe(7);

    await service.deleteAllData();
    expect(await players.load('me')).toBeNull();
    expect(service.getState().stats.cellsRevealed).toBe(0);
  });
});
