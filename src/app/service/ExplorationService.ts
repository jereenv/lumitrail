/**
 * ExplorationService — the application layer that wires the pure domain loop to
 * real persistence and a location source.
 *
 * It owns the current PlayerState and is the single entry point the UI calls:
 * `init()` to hydrate on launch (including draining any fixes captured in the
 * background), `processFix()` for each new location, `sync()` for the opt-in
 * cloud merge, and `exportData()` / `deleteAllData()` for privacy controls.
 *
 * It depends only on interfaces (LocationProvider, repositories, RegionResolver,
 * SyncClient), so it is fully testable with in-memory fakes — see the test
 * alongside this file.
 */
import type { LocationProvider, LocationSubscription } from '@/data/location/LocationProvider';
import type { PlayerRepository, RevealRepository } from '@/data/persistence/repositories';
import { fromSnapshot, toSnapshot, type PlayerSnapshot } from '@/data/persistence/snapshot';
import { SyncEngine } from '@/data/sync/SyncEngine';
import type { SyncClient, SyncOutbox, SyncResult } from '@/data/sync/types';
import type { GeoPoint } from '@/domain/geo/types';
import { applyFix, type FixContext } from '@/domain/loop/applyFix';
import type { DomainEvent } from '@/domain/loop/events';
import { createPlayerState, type PlayerState } from '@/domain/loop/state';
import type { RegionResolver } from '@/domain/regions/types';

export interface ExplorationServiceDeps {
  readonly location: LocationProvider;
  readonly reveals: RevealRepository;
  readonly players: PlayerRepository;
  readonly outbox: SyncOutbox;
  readonly resolver: RegionResolver;
  readonly playerId: string;
  readonly displayName: string;
  /** Local timezone offset (minutes to add to UTC) for streak bucketing. */
  readonly tzOffsetMinutes: number;
}

export interface ProcessResult {
  readonly state: PlayerState;
  readonly events: readonly DomainEvent[];
}

/** A drained background fix plus any that arrive live share this pathway. */
type FixSource = readonly GeoPoint[];

export class ExplorationService {
  private state: PlayerState;

  constructor(
    private readonly deps: ExplorationServiceDeps,
    private readonly drainPending: () => Promise<GeoPoint[]> = async () => [],
  ) {
    this.state = createPlayerState(deps.playerId, deps.displayName);
  }

  private get ctx(): FixContext {
    return { resolver: this.deps.resolver, tzOffsetMinutes: this.deps.tzOffsetMinutes };
  }

  getState(): PlayerState {
    return this.state;
  }

  /** Hydrates state from storage and replays any fixes captured while backgrounded. */
  async init(): Promise<PlayerState> {
    const [snapshot, cells] = await Promise.all([
      this.deps.players.load(this.deps.playerId),
      this.deps.reveals.loadAll(),
    ]);

    this.state =
      snapshot === null
        ? createPlayerState(this.deps.playerId, this.deps.displayName)
        : fromSnapshot(snapshot, cells);

    const pending = await this.drainPending();
    for (const point of pending) {
      await this.processFix(point);
    }
    return this.state;
  }

  /** Applies one fix, persists the delta, and queues newly revealed cells for sync. */
  async processFix(point: GeoPoint): Promise<ProcessResult> {
    const { state, events } = applyFix(this.state, point, this.ctx);
    this.state = state;

    const revealed = events.find((e) => e.type === 'cellsRevealed');
    if (revealed) {
      await this.deps.reveals.add(revealed.cells);
      await this.deps.outbox.enqueue(revealed.cells);
    }
    // Persist the (small) snapshot on every accepted fix so a crash never loses
    // more than the current fix.
    if (events.length > 0) {
      await this.deps.players.save(toSnapshot(this.state));
    }
    return { state, events };
  }

  /** Feeds a batch of fixes (e.g. an imported track) through the loop. */
  async processFixes(points: FixSource): Promise<PlayerState> {
    for (const point of points) {
      await this.processFix(point);
    }
    return this.state;
  }

  /** Subscribes to the foreground location stream; returns an unsubscribe handle. */
  async beginForegroundTracking(
    onResult: (result: ProcessResult) => void,
  ): Promise<LocationSubscription> {
    return this.deps.location.watchPosition((point) => {
      void this.processFix(point).then(onResult);
    });
  }

  /** Opt-in cloud sync — conflict-free union of the local and remote cell sets. */
  async sync(client: SyncClient): Promise<SyncResult> {
    const engine = new SyncEngine(this.deps.reveals, this.deps.outbox, client);
    return engine.sync();
  }

  /** Privacy: hand the user a portable copy of everything stored about them. */
  async exportData(): Promise<{ snapshot: PlayerSnapshot; revealedCells: string[] }> {
    const cells = await this.deps.reveals.loadAll();
    return { snapshot: toSnapshot(this.state), revealedCells: [...cells] };
  }

  /** Privacy: erase all stored data and reset to a fresh explorer. */
  async deleteAllData(): Promise<void> {
    await this.deps.players.clear(this.deps.playerId);
    this.state = createPlayerState(this.deps.playerId, this.deps.displayName);
  }
}
