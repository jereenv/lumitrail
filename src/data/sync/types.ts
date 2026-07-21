/**
 * Sync contracts.
 *
 * Lumitrail is offline-first: everything works with no connectivity, and sync
 * is an optional convenience for players who opt in to a cloud backup / a
 * second device. Because revealed cells only ever grow, the synced structure is
 * a G-Set (grow-only set) CRDT — merging two devices is a set union, which is
 * commutative, associative, and idempotent. That means no conflict resolution,
 * no lost reveals, and safe retries. See ARCHITECTURE.md § Sync.
 */
import type { H3Index } from '@/domain/geo/types';

/**
 * Talks to the (opt-in) backend. Implementations must treat the payload as an
 * additive set — the server never deletes cells on a client's behalf.
 */
export interface SyncClient {
  /** Uploads locally-revealed cells. Idempotent server-side. */
  push(cells: readonly H3Index[]): Promise<void>;
  /** Downloads the full remote cell set (production uses a cursor; see docs). */
  pull(): Promise<H3Index[]>;
}

/** A durable queue of cells revealed locally but not yet pushed. */
export interface SyncOutbox {
  enqueue(cells: readonly H3Index[]): Promise<void>;
  pending(): Promise<H3Index[]>;
  /** Removes the given cells after a successful push. */
  ack(cells: readonly H3Index[]): Promise<void>;
}

export interface SyncResult {
  readonly pushed: number;
  readonly pulled: number;
}
