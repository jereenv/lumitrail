/**
 * useExplorationStore — Zustand store that owns the ExplorationService instance
 * and exposes its state + actions to the React presentation layer.
 *
 * The service itself is held in a plain closure variable (not Zustand state) so
 * React never re-renders because the service reference changed — only the pure
 * data snapshots trigger re-renders.
 */
import { create } from 'zustand';

import { ExplorationService } from '@/app/service/ExplorationService';
import { MockLocationProvider } from '@/data/location/MockLocationProvider';
import {
  InMemoryPlayerRepository,
  InMemoryRevealRepository,
} from '@/data/persistence/InMemoryRepositories';
import { FakeSyncClient, InMemorySyncOutbox } from '@/data/sync/InMemorySync';
import { defaultRegionResolver } from '@/domain/regions/resolver';
import type { LocationSubscription } from '@/data/location/LocationProvider';
import { createPlayerState } from '@/domain/loop/state';
import type { PlayerState } from '@/domain/loop/state';
import type { DomainEvent } from '@/domain/loop/events';
import type { GeoPoint } from '@/domain/geo/types';

// ---------------------------------------------------------------------------
// Scripted demo route (Stockholm → London)
// ---------------------------------------------------------------------------

const ROUTE_BASE = Date.UTC(2026, 6, 20, 9, 0, 0);

function buildDemoRoute(): readonly GeoPoint[] {
  const points: GeoPoint[] = [];

  // Day 1 — Stockholm city walks (7 fixes)
  for (let i = 0; i < 7; i++) {
    points.push({
      latitude: 59.325 + i * 0.0018,
      longitude: 18.07 + i * 0.0009,
      accuracy: 8,
      timestamp: ROUTE_BASE + i * 120_000,
    });
  }

  // Day 2 — Stockholm suburbs (6 fixes)
  for (let i = 0; i < 6; i++) {
    points.push({
      latitude: 59.34 + i * 0.0016,
      longitude: 18.05 + i * 0.0011,
      accuracy: 10,
      timestamp: ROUTE_BASE + 86_400_000 + i * 120_000,
    });
  }

  // Day 3 — London (5 fixes + 1 bad fix that will be rejected)
  // Bad fix first (high accuracy radius → rejected)
  points.push({
    latitude: 51.52,
    longitude: -0.12,
    accuracy: 800,
    timestamp: ROUTE_BASE + 2 * 86_400_000,
  });
  for (let i = 0; i < 5; i++) {
    points.push({
      latitude: 51.5074 + i * 0.0015,
      longitude: -0.1278 + i * 0.0012,
      accuracy: 9,
      timestamp: ROUTE_BASE + 2 * 86_400_000 + i * 120_000,
    });
  }

  return points;
}

const DEMO_ROUTE = buildDemoRoute();

// ---------------------------------------------------------------------------
// Store types
// ---------------------------------------------------------------------------

export interface ExplorationState {
  playerState: PlayerState;
  recentEvents: readonly DomainEvent[];
  /** The device's current position once located, for centring the map. */
  currentLocation: GeoPoint | null;
  /** Whether the real device stack (GPS + SQLite) is active vs the demo stack. */
  isDeviceBacked: boolean;
  isInitialized: boolean;
  isTracking: boolean;
  isDemoWalking: boolean;
  error: string | null;
}

export interface ExplorationActions {
  init(): Promise<void>;
  feedDemoFix(point: GeoPoint): Promise<void>;
  runDemoWalk(): Promise<void>;
  startTracking(): Promise<void>;
  stopTracking(): void;
  /** Best-effort one-shot device location; no-op if unavailable (e.g. demo stack). */
  locateMe(): Promise<void>;
  sync(): Promise<void>;
  exportData(): Promise<{ snapshot: unknown; revealedCells: string[] }>;
  deleteAllData(): Promise<void>;
}

export type ExplorationStore = ExplorationState & ExplorationActions;

// ---------------------------------------------------------------------------
// Module-level service and subscription (not Zustand state)
// ---------------------------------------------------------------------------

// These live outside the store so Zustand never treats them as reactive data.
let service: ExplorationService | null = null;
let locationSubscription: LocationSubscription | null = null;
let mockLocation: MockLocationProvider | null = null;

/** Local timezone offset in minutes to add to UTC, for streak day bucketing. */
function tzOffsetMinutes(): number {
  return -new Date().getTimezoneOffset();
}

/** The demo/fallback stack: in-memory repositories + a scriptable mock GPS. */
function buildService(): ExplorationService {
  mockLocation = new MockLocationProvider();
  return new ExplorationService({
    location: mockLocation,
    reveals: new InMemoryRevealRepository(),
    players: new InMemoryPlayerRepository(),
    outbox: new InMemorySyncOutbox(),
    resolver: defaultRegionResolver,
    playerId: 'local-player',
    displayName: 'Explorer',
    tzOffsetMinutes: tzOffsetMinutes(),
  });
}

/**
 * The real device stack: SQLite persistence + battery-safe Expo location, with
 * background fixes replayed on launch. Native modules are imported dynamically
 * so a failure to load them (Expo Go, web, tests) is caught by the caller,
 * which then falls back to {@link buildService}.
 */
async function buildDeviceService(): Promise<ExplorationService> {
  const [{ ExpoLocationProvider }, sqlite, { drainPendingFixes }] = await Promise.all([
    import('@/data/location/ExpoLocationProvider'),
    import('@/data/persistence/sqlite/SqliteRepositories'),
    import('@/data/location/pendingFixes'),
  ]);
  const db = await sqlite.openLumitrailDatabase();
  const provider = new ExpoLocationProvider();
  await provider.requestForegroundPermission();
  return new ExplorationService(
    {
      location: provider,
      reveals: new sqlite.SqliteRevealRepository(db),
      players: new sqlite.SqlitePlayerRepository(db),
      outbox: new sqlite.SqliteSyncOutbox(db),
      resolver: defaultRegionResolver,
      playerId: 'local-player',
      displayName: 'Explorer',
      tzOffsetMinutes: tzOffsetMinutes(),
    },
    drainPendingFixes,
  );
}

// ---------------------------------------------------------------------------
// Helper: merge new events into the running list (cap at 10, newest first)
// ---------------------------------------------------------------------------

function mergeEvents(
  existing: readonly DomainEvent[],
  incoming: readonly DomainEvent[],
): readonly DomainEvent[] {
  const merged = [...incoming, ...existing];
  return merged.slice(0, 10);
}

// ---------------------------------------------------------------------------
// Delay helper for the demo walk animation
// ---------------------------------------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useExplorationStore = create<ExplorationStore>((set, get) => ({
  // ----- initial state -----
  playerState: createPlayerState('local-player', 'Explorer'),
  recentEvents: [],
  currentLocation: null,
  isDeviceBacked: false,
  isInitialized: false,
  isTracking: false,
  isDemoWalking: false,
  error: null,

  // ----- actions -----

  async init(): Promise<void> {
    // Prefer the real device stack (GPS + SQLite). If its native modules can't
    // load — Expo Go, web, tests — fall back to the in-memory demo stack so the
    // app always starts and the map + demo walk remain usable.
    let deviceBacked = false;
    try {
      service = await buildDeviceService();
      deviceBacked = true;
    } catch {
      service = buildService();
    }
    try {
      const playerState = await service.init();
      set({ playerState, isDeviceBacked: deviceBacked, isInitialized: true, error: null });
      await get().locateMe();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({ error: message });
    }
  },

  async locateMe(): Promise<void> {
    if (service === null) {
      return;
    }
    try {
      const point = await service.getCurrentPosition();
      set({ currentLocation: point });
    } catch {
      // No fix available (permission denied, demo stack, or GPS loss). The map
      // simply falls back to a default region — never an error the user sees.
    }
  },

  async feedDemoFix(point: GeoPoint): Promise<void> {
    if (service === null) {
      return;
    }
    try {
      const { state, events } = await service.processFix(point);
      set((prev) => ({
        playerState: state,
        recentEvents: mergeEvents(prev.recentEvents, events),
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({ error: message });
    }
  },

  async runDemoWalk(): Promise<void> {
    if (service === null || get().isDemoWalking) {
      return;
    }
    set({ isDemoWalking: true });
    try {
      for (const point of DEMO_ROUTE) {
        const { state, events } = await service.processFix(point);
        set((prev) => ({
          playerState: state,
          recentEvents: mergeEvents(prev.recentEvents, events),
        }));
        await delay(200);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({ error: message });
    } finally {
      set({ isDemoWalking: false });
    }
  },

  async startTracking(): Promise<void> {
    if (service === null || get().isTracking) {
      return;
    }
    try {
      locationSubscription = await service.beginForegroundTracking(({ state, events }) => {
        set((prev) => ({
          playerState: state,
          recentEvents: mergeEvents(prev.recentEvents, events),
        }));
      });
      set({ isTracking: true, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({ error: message });
    }
  },

  stopTracking(): void {
    if (locationSubscription !== null) {
      locationSubscription.remove();
      locationSubscription = null;
    }
    set({ isTracking: false });
  },

  async sync(): Promise<void> {
    if (service === null) {
      return;
    }
    try {
      await service.sync(new FakeSyncClient());
      set({ error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({ error: message });
    }
  },

  async exportData(): Promise<{ snapshot: unknown; revealedCells: string[] }> {
    if (service === null) {
      return { snapshot: null, revealedCells: [] };
    }
    return service.exportData();
  },

  async deleteAllData(): Promise<void> {
    if (service === null) {
      return;
    }
    try {
      await service.deleteAllData();
      const fresh = createPlayerState('local-player', 'Explorer');
      set({ playerState: fresh, recentEvents: [], error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({ error: message });
    }
  },
}));
