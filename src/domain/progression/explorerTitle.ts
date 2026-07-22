/**
 * Maps a player level to their explorer title.
 *
 * Design: titles represent progression milestones at specific level thresholds,
 * providing narrative progression alongside mechanical leveling. Lower levels
 * are clamped to "Wanderer" (minimum tier).
 *
 * Title tiers:
 * - Level 1–4: "Wanderer"
 * - Level 5–9: "Pathfinder"
 * - Level 10–19: "Trailblazer"
 * - Level 20+: "Voyager"
 */

/**
 * Derives an explorer title from a player level.
 * Levels below 1 are clamped to "Wanderer".
 */
export function explorerTitle(level: number): string {
  if (level >= 20) {
    return 'Voyager';
  }
  if (level >= 10) {
    return 'Trailblazer';
  }
  if (level >= 5) {
    return 'Pathfinder';
  }
  return 'Wanderer';
}
