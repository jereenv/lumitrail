/**
 * In-memory sync fakes for tests and the demo.
 *
 * `FakeSyncClient` stands in for the backend: it holds a grow-only set and can
 * be flipped offline to exercise the retry path. `InMemorySyncOutbox` is a
 * simple durable-queue stand-in.
 */
import type { H3Index } from '@/domain/geo/types';

import type { SyncClient, SyncOutbox } from './types';

export class SyncNetworkError extends Error {
  constructor() {
    super('Network unavailable');
    this.name = 'SyncNetworkError';
  }
}

export class FakeSyncClient implements SyncClient {
  private readonly remote: Set<H3Index>;
  private online = true;

  constructor(initialRemote: Iterable<H3Index> = []) {
    this.remote = new Set(initialRemote);
  }

  setOnline(online: boolean): void {
    this.online = online;
  }

  push(cells: readonly H3Index[]): Promise<void> {
    if (!this.online) {
      return Promise.reject(new SyncNetworkError());
    }
    for (const cell of cells) {
      this.remote.add(cell);
    }
    return Promise.resolve();
  }

  pull(): Promise<H3Index[]> {
    if (!this.online) {
      return Promise.reject(new SyncNetworkError());
    }
    return Promise.resolve([...this.remote]);
  }

  /** Test helper: what the "server" currently holds. */
  get remoteSize(): number {
    return this.remote.size;
  }
}

export class InMemorySyncOutbox implements SyncOutbox {
  private readonly queue: Set<H3Index>;

  constructor(initial: Iterable<H3Index> = []) {
    this.queue = new Set(initial);
  }

  enqueue(cells: readonly H3Index[]): Promise<void> {
    for (const cell of cells) {
      this.queue.add(cell);
    }
    return Promise.resolve();
  }

  pending(): Promise<H3Index[]> {
    return Promise.resolve([...this.queue]);
  }

  ack(cells: readonly H3Index[]): Promise<void> {
    for (const cell of cells) {
      this.queue.delete(cell);
    }
    return Promise.resolve();
  }
}
