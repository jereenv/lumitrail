/**
 * SyncEngine — merges local and remote revealed-cell sets by union.
 *
 * The whole flow:
 *   1. Push everything in the outbox; on success, ack (clear) those cells.
 *   2. Pull the remote set and add any cells we are missing locally.
 *
 * If the network fails at step 1, the outbox is left intact so the next sync
 * retries — no reveals are ever lost. Because both sides are grow-only sets,
 * repeated or out-of-order syncs always converge to the same union.
 */
import type { H3Index } from '@/domain/geo/types';

import type { RevealRepository } from '@/data/persistence/repositories';

import type { SyncClient, SyncOutbox, SyncResult } from './types';

export class SyncEngine {
  constructor(
    private readonly reveals: RevealRepository,
    private readonly outbox: SyncOutbox,
    private readonly client: SyncClient,
  ) {}

  async sync(): Promise<SyncResult> {
    // Step 1: push local-only cells, then clear them from the outbox.
    const pending = await this.outbox.pending();
    if (pending.length > 0) {
      await this.client.push(pending);
      await this.outbox.ack(pending);
    }

    // Step 2: pull remote and union into local storage.
    const remote = await this.client.pull();
    const local = await this.reveals.loadAll();
    const missing: H3Index[] = remote.filter((cell) => !local.has(cell));
    const pulled = await this.reveals.add(missing);

    return { pushed: pending.length, pulled };
  }
}
