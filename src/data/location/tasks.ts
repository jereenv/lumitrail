/**
 * Background task registration.
 *
 * `TaskManager.defineTask` MUST be called at module scope (not inside a
 * component), before any `startLocationUpdatesAsync`, so importing this module
 * at app start is what wires the background handler. The handler is kept
 * deliberately tiny — map fixes and enqueue them — because iOS gives a
 * background execution a budget of only a few seconds.
 */
import type { LocationObject } from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { geoPointFromLocation } from './mapping';
import { appendPendingFixes } from './pendingFixes';

/** Registered task name for batched background location delivery. */
export const LOCATION_TASK = 'lumitrail-location-updates';

interface LocationTaskPayload {
  readonly locations?: LocationObject[];
}

TaskManager.defineTask<LocationTaskPayload>(LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    // Never throw from a background task; just log and let the OS retry later.
    console.error('[lumitrail] background location task error:', error.message);
    return;
  }
  const locations = data?.locations ?? [];
  if (locations.length === 0) {
    return;
  }
  await appendPendingFixes(locations.map(geoPointFromLocation));
});
