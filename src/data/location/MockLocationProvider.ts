/**
 * A fully deterministic LocationProvider for tests and the headless demo.
 *
 * It never touches hardware. Tests construct it, subscribe, then `feed()`
 * scripted points to drive the game loop exactly. It also models the two
 * failure modes we must handle gracefully: denied permissions and GPS loss.
 */
import type { GeoPoint } from '@/domain/geo/types';

import {
  type LocationProvider,
  type LocationSubscription,
  type PermissionStatus,
  type TrackingOptions,
} from './LocationProvider';

export interface MockLocationConfig {
  readonly foregroundPermission?: PermissionStatus;
  readonly backgroundPermission?: PermissionStatus;
  /** Optional initial position returned by getCurrentPosition before any feed. */
  readonly initialPosition?: GeoPoint;
}

export class MockLocationProvider implements LocationProvider {
  private readonly listeners = new Set<(point: GeoPoint) => void>();
  private lastPoint: GeoPoint | null;
  private backgroundActive = false;
  private readonly foregroundPermission: PermissionStatus;
  private readonly backgroundPermission: PermissionStatus;

  constructor(config: MockLocationConfig = {}) {
    this.foregroundPermission = config.foregroundPermission ?? 'granted';
    this.backgroundPermission = config.backgroundPermission ?? 'granted';
    this.lastPoint = config.initialPosition ?? null;
  }

  requestForegroundPermission(): Promise<PermissionStatus> {
    return Promise.resolve(this.foregroundPermission);
  }

  requestBackgroundPermission(): Promise<PermissionStatus> {
    return Promise.resolve(this.backgroundPermission);
  }

  getCurrentPosition(): Promise<GeoPoint> {
    if (this.foregroundPermission !== 'granted') {
      return Promise.reject(new Error('Location permission not granted'));
    }
    if (this.lastPoint === null) {
      return Promise.reject(new Error('No location fix available (GPS loss)'));
    }
    return Promise.resolve(this.lastPoint);
  }

  watchPosition(
    onSample: (point: GeoPoint) => void,
    _options?: Partial<TrackingOptions>,
  ): Promise<LocationSubscription> {
    this.listeners.add(onSample);
    const subscription: LocationSubscription = {
      remove: () => {
        this.listeners.delete(onSample);
      },
    };
    return Promise.resolve(subscription);
  }

  startBackgroundUpdates(_options?: Partial<TrackingOptions>): Promise<void> {
    if (this.backgroundPermission !== 'granted') {
      return Promise.reject(new Error('Background location permission not granted'));
    }
    this.backgroundActive = true;
    return Promise.resolve();
  }

  stopBackgroundUpdates(): Promise<void> {
    this.backgroundActive = false;
    return Promise.resolve();
  }

  isBackgroundActive(): Promise<boolean> {
    return Promise.resolve(this.backgroundActive);
  }

  // --- Test/demo controls -------------------------------------------------

  /** Delivers one scripted fix to every active watcher. */
  feed(point: GeoPoint): void {
    this.lastPoint = point;
    for (const listener of this.listeners) {
      listener(point);
    }
  }

  /** Delivers an ordered sequence of fixes. */
  feedAll(points: readonly GeoPoint[]): void {
    for (const point of points) {
      this.feed(point);
    }
  }

  /** Simulates GPS loss: getCurrentPosition will reject until the next feed. */
  simulateSignalLoss(): void {
    this.lastPoint = null;
  }

  get watcherCount(): number {
    return this.listeners.size;
  }
}
