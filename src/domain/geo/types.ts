/**
 * Geo primitives shared across the domain.
 *
 * These are plain data types with no dependency on React Native, Expo, or the
 * h3 library, so every layer (and every test) can pass them around freely.
 */

/** A WGS-84 latitude/longitude pair in decimal degrees. */
export interface Coordinates {
  readonly latitude: number;
  readonly longitude: number;
}

/**
 * A single location observation from the OS.
 *
 * `accuracy` is the horizontal accuracy radius in metres as reported by the
 * platform (smaller is better). `timestamp` is epoch milliseconds. Both are
 * optional because some sources (imported GPX, tests) may omit them.
 */
export interface GeoPoint extends Coordinates {
  readonly accuracy?: number;
  readonly timestamp?: number;
}

/**
 * An H3 cell index, represented as its canonical 15-character hex string.
 *
 * We use the string form everywhere (rather than the 64-bit numeric form)
 * because JavaScript numbers cannot hold a full H3 index without precision
 * loss, and strings serialise cleanly to SQLite and JSON.
 */
export type H3Index = string;

/** Valid H3 resolutions run from 0 (coarsest) to 15 (finest). */
export type H3Resolution = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;
