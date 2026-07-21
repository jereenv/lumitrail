/**
 * Central tunable constants for the exploration game loop.
 *
 * Keeping these in one place (rather than scattering magic numbers through the
 * code) means the game can be re-balanced without hunting through logic, and
 * tests can import the exact same values they assert against.
 */

/**
 * H3 resolution used to store revealed cells.
 *
 * Resolution 9 hexagons are ~174 m across (~0.1 km²), which matches a "you
 * walked down this street" granularity without exploding the row count the way
 * res 11+ would. See ARCHITECTURE.md for the trade-off analysis.
 */
export const REVEAL_RESOLUTION = 9 as const;

/**
 * How many rings of neighbouring hexagons to reveal around a good-accuracy fix.
 *
 * Ring 1 reveals the centre cell plus its 6 immediate neighbours (7 cells),
 * giving a generous ~500 m reveal disc so the fog feels responsive to walking
 * without demanding pinpoint GPS. Low-accuracy fixes reveal only the centre.
 */
export const REVEAL_RING_SIZE = 1 as const;

/**
 * A location fix with horizontal accuracy worse than this (metres) is treated
 * as too noisy to expand into a full ring — we still reveal the centre cell but
 * do not paint neighbours we cannot vouch for.
 */
export const GOOD_ACCURACY_METERS = 50 as const;

/**
 * Fixes worse than this accuracy (metres) are rejected outright. A 2 km "fix"
 * from a cell tower must not silently paint a neighbourhood the user never saw.
 */
export const MAX_ACCEPTABLE_ACCURACY_METERS = 200 as const;

/** XP awarded for each brand-new hexagon revealed. */
export const XP_PER_NEW_CELL = 10 as const;

/** XP awarded per full 100 m of distance travelled while tracking. */
export const XP_PER_100M = 4 as const;

/** Base XP awarded for extending a daily streak, before the streak multiplier. */
export const XP_STREAK_DAY_BASE = 25 as const;

/**
 * Streak multiplier is capped so a very long streak cannot trivialise
 * levelling. Effective streak XP = base * min(streakDays, cap).
 */
export const STREAK_MULTIPLIER_CAP = 7 as const;

/**
 * Level curve base. Cost to advance from level L to L+1 is
 * `LEVEL_BASE_XP * L`, so cumulative XP to *reach* level L is
 * `LEVEL_BASE_XP * (L-1) * L / 2`. A gentle quadratic: early levels come fast
 * (dopamine) while high levels demand real-world exploration.
 */
export const LEVEL_BASE_XP = 100 as const;

/**
 * Maximum distance (metres) between two consecutive fixes that we still treat
 * as continuous travel. A jump larger than this is a teleport (flight, GPS
 * glitch, app resumed in a new city) and is excluded from distance XP.
 */
export const MAX_TRAVEL_SEGMENT_METERS = 5000 as const;
