import { InMemoryRevealRepository } from '@/data/persistence/InMemoryRepositories';

import { FakeSyncClient, InMemorySyncOutbox, SyncNetworkError } from './InMemorySync';
import { SyncEngine } from './SyncEngine';

describe('SyncEngine (offline-first, grow-only set)', () => {
  it('pushes local reveals and pulls remote reveals into a union', async () => {
    const reveals = new InMemoryRevealRepository(['a', 'b']);
    const outbox = new InMemorySyncOutbox(['a', 'b']);
    const client = new FakeSyncClient(['b', 'c']); // remote already has b and c

    const engine = new SyncEngine(reveals, outbox, client);
    const result = await engine.sync();

    expect(result.pushed).toBe(2);
    expect(result.pulled).toBe(1); // only 'c' was missing locally
    expect(await reveals.loadAll()).toEqual(new Set(['a', 'b', 'c']));
    expect(client.remoteSize).toBe(3);
    expect(await outbox.pending()).toEqual([]);
  });

  it('preserves the outbox and reveals when offline, then converges when back online', async () => {
    // Two devices reveal different cells while offline.
    const deviceA = new InMemoryRevealRepository(['a1', 'a2']);
    const outboxA = new InMemorySyncOutbox(['a1', 'a2']);
    const server = new FakeSyncClient();
    server.setOnline(false);

    const engineA = new SyncEngine(deviceA, outboxA, server);
    await expect(engineA.sync()).rejects.toBeInstanceOf(SyncNetworkError);
    // Nothing lost: the outbox still holds the pending cells.
    expect(await outboxA.pending()).toEqual(['a1', 'a2']);

    // Back online — device A syncs up.
    server.setOnline(true);
    await engineA.sync();
    expect(server.remoteSize).toBe(2);

    // Device B (which revealed b1 offline) now syncs and converges to the union.
    const deviceB = new InMemoryRevealRepository(['b1']);
    const outboxB = new InMemorySyncOutbox(['b1']);
    const engineB = new SyncEngine(deviceB, outboxB, server);
    await engineB.sync();

    expect(await deviceB.loadAll()).toEqual(new Set(['a1', 'a2', 'b1']));

    // And a second sync from A pulls b1 down — both devices identical.
    await engineA.sync();
    expect(await deviceA.loadAll()).toEqual(new Set(['a1', 'a2', 'b1']));
  });

  it('is idempotent — syncing twice changes nothing the second time', async () => {
    const reveals = new InMemoryRevealRepository(['x']);
    const outbox = new InMemorySyncOutbox(['x']);
    const client = new FakeSyncClient(['y']);
    const engine = new SyncEngine(reveals, outbox, client);

    await engine.sync();
    const second = await engine.sync();
    expect(second).toEqual({ pushed: 0, pulled: 0 });
    expect(await reveals.loadAll()).toEqual(new Set(['x', 'y']));
  });
});
