/**
 * The production LocationProvider, backed by expo-location.
 *
 * Every battery decision the brief demands lives here and nowhere else:
 *  - Default background accuracy is `Balanced` (~100 m), NOT high/GPS.
 *  - `deferredUpdatesDistance`/`Interval` batch fixes so the radio and JS
 *    engine wake rarely instead of streaming continuously.
 *  - `pausesUpdatesAutomatically` + `activityType: Fitness` let iOS suspend
 *    updates entirely while the user is stationary (motion-coprocessor gated).
 *  - Only an explicit "record this walk" session bumps to High accuracy.
 * See ARCHITECTURE.md § Battery for the full rationale and the geofence-wake
 * strategy this composes with.
 */
import * as Location from 'expo-location';

import type { GeoPoint } from '@/domain/geo/types';

import {
  BATTERY_SAVER_TRACKING,
  type LocationProvider,
  type LocationSubscription,
  type PermissionStatus,
  type TrackingOptions,
} from './LocationProvider';
import { geoPointFromLocation } from './mapping';
import { LOCATION_TASK } from './tasks';

function toPermissionStatus(status: Location.PermissionStatus): PermissionStatus {
  switch (status) {
    case Location.PermissionStatus.GRANTED:
      return 'granted';
    case Location.PermissionStatus.DENIED:
      return 'denied';
    default:
      return 'undetermined';
  }
}

function resolveOptions(partial?: Partial<TrackingOptions>): TrackingOptions {
  return { ...BATTERY_SAVER_TRACKING, ...partial };
}

export class ExpoLocationProvider implements LocationProvider {
  async requestForegroundPermission(): Promise<PermissionStatus> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return toPermissionStatus(status);
  }

  async requestBackgroundPermission(): Promise<PermissionStatus> {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    return toPermissionStatus(status);
  }

  async getCurrentPosition(): Promise<GeoPoint> {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return geoPointFromLocation(location);
  }

  async watchPosition(
    onSample: (point: GeoPoint) => void,
    options?: Partial<TrackingOptions>,
  ): Promise<LocationSubscription> {
    const opts = resolveOptions(options);
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: opts.highAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
        distanceInterval: opts.distanceIntervalMeters,
      },
      (location) => onSample(geoPointFromLocation(location)),
    );
    return { remove: () => subscription.remove() };
  }

  async startBackgroundUpdates(options?: Partial<TrackingOptions>): Promise<void> {
    const opts = resolveOptions(options);
    await Location.startLocationUpdatesAsync(LOCATION_TASK, {
      accuracy: opts.highAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
      distanceInterval: opts.distanceIntervalMeters,
      // Batch background deliveries to minimise radio/JS wakeups.
      deferredUpdatesDistance: opts.distanceIntervalMeters * 4,
      deferredUpdatesInterval: 60_000,
      activityType: Location.ActivityType.Fitness,
      pausesUpdatesAutomatically: true,
      showsBackgroundLocationIndicator: false,
      foregroundService: {
        notificationTitle: 'Lumitrail is revealing your map',
        notificationBody: 'Tracking your exploration in the background.',
        notificationColor: '#FFB74D',
      },
    });
  }

  async stopBackgroundUpdates(): Promise<void> {
    if (await this.isBackgroundActive()) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK);
    }
  }

  async isBackgroundActive(): Promise<boolean> {
    return Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
  }
}
