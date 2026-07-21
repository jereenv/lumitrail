/**
 * In-memory repository implementations.
 *
 * Used by every test and by the headless demo. They are also a legitimate
 * fallback at runtime if SQLite fails to open, so the app degrades to a
 * session-only mode rather than crashing (reliability requirement).
 */
import { cellCenter } from '@/domain/geo/grid';
import type { Coordinates, H3Index } from '@/domain/geo/types';

import type { PlayerRepository, RevealRepository } from './repositories';
import type { PlayerSnapshot } from './snapshot';

export class InMemoryRevealRepository implements RevealRepository {
  private readonly cells: Set<H3Index>;

  constructor(initial: Iterable<H3Index> = []) {
    this.cells = new Set(initial);
  }

  loadAll(): Promise<Set<H3Index>> {
    return Promise.resolve(new Set(this.cells));
  }

  add(cells: readonly H3Index[]): Promise<number> {
    let added = 0;
    for (const cell of cells) {
      if (!this.cells.has(cell)) {
        this.cells.add(cell);
        added += 1;
      }
    }
    return Promise.resolve(added);
  }

  count(): Promise<number> {
    return Promise.resolve(this.cells.size);
  }

  inBounds(sw: Coordinates, ne: Coordinates): Promise<H3Index[]> {
    const result: H3Index[] = [];
    for (const cell of this.cells) {
      const c = cellCenter(cell);
      if (
        c.latitude >= sw.latitude &&
        c.latitude <= ne.latitude &&
        c.longitude >= sw.longitude &&
        c.longitude <= ne.longitude
      ) {
        result.push(cell);
      }
    }
    return Promise.resolve(result);
  }
}

export class InMemoryPlayerRepository implements PlayerRepository {
  private readonly snapshots = new Map<string, PlayerSnapshot>();

  load(playerId: string): Promise<PlayerSnapshot | null> {
    return Promise.resolve(this.snapshots.get(playerId) ?? null);
  }

  save(snapshot: PlayerSnapshot): Promise<void> {
    this.snapshots.set(snapshot.playerId, snapshot);
    return Promise.resolve();
  }

  clear(playerId: string): Promise<void> {
    this.snapshots.delete(playerId);
    return Promise.resolve();
  }
}
