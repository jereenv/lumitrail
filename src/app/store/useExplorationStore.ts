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
    tzOffsetMinutes: 120,
  });
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
  isInitialized: false,
  isTracking: false,
  isDemoWalking: false,
  error: null,

  // ----- actions -----

  async init(): Promise<void> {
    try {
      service = buildService();
      const playerState = await service.init();
      set({ playerState, isInitialized: true, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({ error: message });
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
