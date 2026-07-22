/**
 * Chaikin corner-cutting — smooths a jagged ring into organic curves.
 *
 * The revealed area is stored as H3 hexagons, so `cellsToMultiPolygon` yields
 * outlines made of straight hex edges (a zig-zag of 120° corners). This module
 * rounds those corners for a "paintbrush" look. It is RENDER-ONLY: the hexagons
 * and all completion math are untouched. Pure and RN-free, like the rest of
 * `domain/geo`.
 *
 * Each pass replaces every edge P→Q with two points at 1/4 and 3/4 along it,
 * treating the ring as a CLOSED loop (the last→first edge is cut too), so the
 * smoothed outline has no seam. Two passes turn hex zig-zags into smooth curves
 * while keeping vertex counts small (each pass doubles the count).
 */
import type { Ring } from './fog';

const Q_NEAR = 0.75;
const Q_FAR = 0.25;

function onePass(ring: Ring): Ring {
  const n = ring.length;
  const out: Ring = [];
  for (let i = 0; i < n; i += 1) {
    const a = ring[i];
    const b = ring[(i + 1) % n];
    out.push({
      latitude: Q_NEAR * a.latitude + Q_FAR * b.latitude,
      longitude: Q_NEAR * a.longitude + Q_FAR * b.longitude,
    });
    out.push({
      latitude: Q_FAR * a.latitude + Q_NEAR * b.latitude,
      longitude: Q_FAR * a.longitude + Q_NEAR * b.longitude,
    });
  }
  return out;
}

/** Smooth one closed ring. Rings with < 3 points are returned unchanged. */
export function chaikinRing(ring: Ring, iterations = 2): Ring {
  if (ring.length < 3) return ring;
  let result = ring;
  for (let i = 0; i < iterations; i += 1) {
    result = onePass(result);
  }
  return result;
}

/** Smooth every ring in a list (short rings pass through unchanged). */
export function smoothRings(rings: Ring[], iterations = 2): Ring[] {
  return rings.map((ring) => chaikinRing(ring, iterations));
}
