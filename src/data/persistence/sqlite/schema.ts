/**
 * SQLite schema and migration runner.
 *
 * We keep the DDL and a monotonic `user_version` migration ladder here. On open
 * we read `PRAGMA user_version` and apply any pending steps in order. This is
 * the standard lightweight migration pattern — no ORM, no migration library,
 * just versioned SQL that always converges an old database to the latest shape.
 */
import type { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'lumitrail.db';

/**
 * Ordered migration steps. Index + 1 is the schema version the step upgrades
 * *to*. Never edit a shipped step; always append a new one.
 */
const MIGRATIONS: readonly string[] = [
  // v1 — initial schema.
  `
  CREATE TABLE IF NOT EXISTS revealed_cells (
    cell TEXT PRIMARY KEY NOT NULL,
    lat  REAL NOT NULL,
    lng  REAL NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_revealed_cells_latlng ON revealed_cells (lat, lng);

  CREATE TABLE IF NOT EXISTS player_snapshot (
    player_id TEXT PRIMARY KEY NOT NULL,
    json      TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sync_outbox (
    cell TEXT PRIMARY KEY NOT NULL
  );
  `,
];

/** Applies any migrations newer than the database's current user_version. */
export async function migrate(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;

  for (let version = current; version < MIGRATIONS.length; version += 1) {
    const step = MIGRATIONS[version];
    if (step === undefined) {
      continue;
    }
    await db.withTransactionAsync(async () => {
      await db.execAsync(step);
    });
    // user_version cannot be parameterised, but `version + 1` is an integer we
    // control, so this interpolation is safe.
    await db.execAsync(`PRAGMA user_version = ${version + 1}`);
  }
}
