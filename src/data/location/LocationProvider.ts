/**
 * The location provider abstraction.
 *
 * The entire app depends on this interface, never on Expo directly. That is
 * what lets tests inject a scripted `MockLocationProvider` and run the whole
 * location → unfog → XP pipeline with zero hardware, and it keeps the
 * battery-sensitive platform code isolated in one swappable place.
 */
import type { GeoPoint } from '@/domain/geo/types';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

/** A cancellable foreground watch subscription. */
export interface LocationSubscription {
  remove(): void;
}

/**
 * Battery-shaping knobs. Defaults favour battery; callers bump accuracy only
 * for an explicit "record my walk" session. See ARCHITECTURE.md § Battery.
 */
export interface TrackingOptions {
  /** Rough movement gate in metres before a new fix is delivered. */
  readonly distanceIntervalMeters: number;
  /** Whether to run the low-power geofence-wake strategy in the background. */
  readonly useGeofenceWake: boolean;
  /** High-accuracy mode for an active recording session (costs battery). */
  readonly highAccuracy: boolean;
}

export const BATTERY_SAVER_TRACKING: TrackingOptions = {
  distanceIntervalMeters: 25,
  useGeofenceWake: true,
  highAccuracy: false,
};

export const ACTIVE_SESSION_TRACKING: TrackingOptions = {
  distanceIntervalMeters: 10,
  useGeofenceWake: false,
  highAccuracy: true,
};

export interface LocationProvider {
  requestForegroundPermission(): Promise<PermissionStatus>;
  requestBackgroundPermission(): Promise<PermissionStatus>;
  /** One-shot current position. Rejects if permission is denied. */
  getCurrentPosition(): Promise<GeoPoint>;
  /** Foreground watch; returns a subscription to stop it. */
  watchPosition(
    onSample: (point: GeoPoint) => void,
    options?: Partial<TrackingOptions>,
  ): Promise<LocationSubscription>;
  /** Begin battery-safe background delivery (foreground service / geofences). */
  startBackgroundUpdates(options?: Partial<TrackingOptions>): Promise<void>;
  stopBackgroundUpdates(): Promise<void>;
  /** Whether background delivery is currently registered. */
  isBackgroundActive(): Promise<boolean>;
}
