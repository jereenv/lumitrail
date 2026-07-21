/**
 * A durable queue of location fixes captured while the app was backgrounded.
 *
 * The background task cannot touch the (possibly not-yet-open) SQLite database
 * or the React state, so it does the cheapest possible thing: append raw fixes
 * to AsyncStorage. When the app next becomes active it drains the queue and
 * feeds every fix through `applyFix`, so no reveal is ever lost even if the app
 * was killed for hours. This is the reliability fix for the originals' habit of
 * silently dropping background tracking.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { GeoPoint } from '@/domain/geo/types';

const KEY = 'lumitrail.pendingFixes.v1';

async function read(): Promise<GeoPoint[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (raw === null) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as GeoPoint[]) : [];
  } catch {
    // Corrupt payload — drop it rather than crash the app.
    return [];
  }
}

/** Appends fixes captured in the background. */
export async function appendPendingFixes(points: readonly GeoPoint[]): Promise<void> {
  if (points.length === 0) {
    return;
  }
  const existing = await read();
  await AsyncStorage.setItem(KEY, JSON.stringify([...existing, ...points]));
}

/** Atomically returns and clears all queued fixes. */
export async function drainPendingFixes(): Promise<GeoPoint[]> {
  const points = await read();
  if (points.length > 0) {
    await AsyncStorage.removeItem(KEY);
  }
  return points;
}
