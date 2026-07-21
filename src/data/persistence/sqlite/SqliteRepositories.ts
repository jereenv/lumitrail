/**
 * SQLite-backed repository implementations (device runtime).
 *
 * These mirror the in-memory repositories exactly but persist to expo-sqlite.
 * Revealed cells store their centroid so the viewport query (`inBounds`) is a
 * fast indexed range scan — this is what keeps the map smooth no matter how
 * large the exploration history grows.
 */
import type { SQLiteDatabase } from 'expo-sqlite';
import { openDatabaseAsync } from 'expo-sqlite';

import { cellCenter } from '@/domain/geo/grid';
import type { Coordinates, H3Index } from '@/domain/geo/types';

import type { PlayerRepository, RevealRepository } from '../repositories';
import type { PlayerSnapshot } from '../snapshot';
import type { SyncOutbox } from '@/data/sync/types';

import { DATABASE_NAME, migrate } from './schema';

/** Opens the database and applies migrations. Call once at app start. */
export async function openLumitrailDatabase(): Promise<SQLiteDatabase> {
  const db = await openDatabaseAsync(DATABASE_NAME);
  // WAL keeps reads fast while background writes are in flight.
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await migrate(db);
  return db;
}

export class SqliteRevealRepository implements RevealRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async loadAll(): Promise<Set<H3Index>> {
    const rows = await this.db.getAllAsync<{ cell: string }>('SELECT cell FROM revealed_cells');
    return new Set(rows.map((r) => r.cell));
  }

  async add(cells: readonly H3Index[]): Promise<number> {
    if (cells.length === 0) {
      return 0;
    }
    let added = 0;
    const statement = await this.db.prepareAsync(
      'INSERT OR IGNORE INTO revealed_cells (cell, lat, lng) VALUES ($cell, $lat, $lng)',
    );
    try {
      await this.db.withTransactionAsync(async () => {
        for (const cell of cells) {
          const centre = cellCenter(cell);
          const result = await statement.executeAsync({
            $cell: cell,
            $lat: centre.latitude,
            $lng: centre.longitude,
          });
          added += result.changes;
        }
      });
    } finally {
      await statement.finalizeAsync();
    }
    return added;
  }

  async count(): Promise<number> {
    const row = await this.db.getFirstAsync<{ n: number }>(
      'SELECT COUNT(*) AS n FROM revealed_cells',
    );
    return row?.n ?? 0;
  }

  async inBounds(sw: Coordinates, ne: Coordinates): Promise<H3Index[]> {
    const rows = await this.db.getAllAsync<{ cell: string }>(
      'SELECT cell FROM revealed_cells WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?',
      sw.latitude,
      ne.latitude,
      sw.longitude,
      ne.longitude,
    );
    return rows.map((r) => r.cell);
  }
}

export class SqlitePlayerRepository implements PlayerRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async load(playerId: string): Promise<PlayerSnapshot | null> {
    const row = await this.db.getFirstAsync<{ json: string }>(
      'SELECT json FROM player_snapshot WHERE player_id = ?',
      playerId,
    );
    if (row === null) {
      return null;
    }
    return JSON.parse(row.json) as PlayerSnapshot;
  }

  async save(snapshot: PlayerSnapshot): Promise<void> {
    await this.db.runAsync(
      'INSERT OR REPLACE INTO player_snapshot (player_id, json) VALUES (?, ?)',
      snapshot.playerId,
      JSON.stringify(snapshot),
    );
  }

  async clear(playerId: string): Promise<void> {
    // A privacy-critical operation: wipe the player and *all* revealed cells.
    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync('DELETE FROM player_snapshot WHERE player_id = ?', playerId);
      await this.db.execAsync('DELETE FROM revealed_cells; DELETE FROM sync_outbox;');
    });
  }
}

export class SqliteSyncOutbox implements SyncOutbox {
  constructor(private readonly db: SQLiteDatabase) {}

  async enqueue(cells: readonly H3Index[]): Promise<void> {
    if (cells.length === 0) {
      return;
    }
    const statement = await this.db.prepareAsync(
      'INSERT OR IGNORE INTO sync_outbox (cell) VALUES ($cell)',
    );
    try {
      await this.db.withTransactionAsync(async () => {
        for (const cell of cells) {
          await statement.executeAsync({ $cell: cell });
        }
      });
    } finally {
      await statement.finalizeAsync();
    }
  }

  async pending(): Promise<H3Index[]> {
    const rows = await this.db.getAllAsync<{ cell: string }>('SELECT cell FROM sync_outbox');
    return rows.map((r) => r.cell);
  }

  async ack(cells: readonly H3Index[]): Promise<void> {
    if (cells.length === 0) {
      return;
    }
    const statement = await this.db.prepareAsync('DELETE FROM sync_outbox WHERE cell = $cell');
    try {
      await this.db.withTransactionAsync(async () => {
        for (const cell of cells) {
          await statement.executeAsync({ $cell: cell });
        }
      });
    } finally {
      await statement.finalizeAsync();
    }
  }
}
