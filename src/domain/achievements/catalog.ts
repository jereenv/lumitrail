/**
 * The achievement catalog and evaluation logic.
 *
 * An achievement is a pure predicate over PlayerStats plus presentation
 * metadata. Keeping the criteria as data (a `threshold` + a `metric` selector)
 * rather than bespoke code per badge means the catalog is easy to audit,
 * localise, and extend, and evaluation is a single generic loop.
 */
import type { PlayerStats } from '@/domain/player/stats';

export type AchievementCategory = 'discovery' | 'distance' | 'world' | 'streak' | 'progression';

/** Tiers drive badge colour/prestige in the UI. */
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface AchievementDefinition {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: AchievementCategory;
  readonly tier: AchievementTier;
  /** The PlayerStats field this badge tracks. */
  readonly metric: keyof PlayerStats;
  /** The value of `metric` at which the badge unlocks. */
  readonly threshold: number;
}

/**
 * The full catalog. Ordered roughly by the journey a new player takes so the
 * "next achievement" hint feels natural.
 */
export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
  // Discovery — revealing cells.
  {
    id: 'first-light',
    title: 'First Light',
    description: 'Reveal your very first patch of the world.',
    category: 'discovery',
    tier: 'bronze',
    metric: 'cellsRevealed',
    threshold: 1,
  },
  {
    id: 'pathfinder',
    title: 'Pathfinder',
    description: 'Reveal 100 cells.',
    category: 'discovery',
    tier: 'silver',
    metric: 'cellsRevealed',
    threshold: 100,
  },
  {
    id: 'cartographer',
    title: 'Cartographer',
    description: 'Reveal 1,000 cells.',
    category: 'discovery',
    tier: 'gold',
    metric: 'cellsRevealed',
    threshold: 1_000,
  },
  {
    id: 'grand-surveyor',
    title: 'Grand Surveyor',
    description: 'Reveal 10,000 cells.',
    category: 'discovery',
    tier: 'platinum',
    metric: 'cellsRevealed',
    threshold: 10_000,
  },

  // Distance — metres travelled.
  {
    id: 'first-mile',
    title: 'First Mile',
    description: 'Travel 1 km while exploring.',
    category: 'distance',
    tier: 'bronze',
    metric: 'distanceMeters',
    threshold: 1_000,
  },
  {
    id: 'trailblazer',
    title: 'Trailblazer',
    description: 'Travel 10 km while exploring.',
    category: 'distance',
    tier: 'silver',
    metric: 'distanceMeters',
    threshold: 10_000,
  },
  {
    id: 'long-hauler',
    title: 'Long Hauler',
    description: 'Travel 100 km while exploring.',
    category: 'distance',
    tier: 'gold',
    metric: 'distanceMeters',
    threshold: 100_000,
  },
  {
    id: 'globe-strider',
    title: 'Globe Strider',
    description: 'Travel 1,000 km while exploring.',
    category: 'distance',
    tier: 'platinum',
    metric: 'distanceMeters',
    threshold: 1_000_000,
  },

  // World — breadth of places.
  {
    id: 'first-border',
    title: 'First Border',
    description: 'Set foot in your first country.',
    category: 'world',
    tier: 'bronze',
    metric: 'countriesVisited',
    threshold: 1,
  },
  {
    id: 'jet-setter',
    title: 'Jet Setter',
    description: 'Explore in 5 countries.',
    category: 'world',
    tier: 'silver',
    metric: 'countriesVisited',
    threshold: 5,
  },
  {
    id: 'continental',
    title: 'Continental',
    description: 'Explore in 10 countries.',
    category: 'world',
    tier: 'gold',
    metric: 'countriesVisited',
    threshold: 10,
  },
  {
    id: 'world-citizen',
    title: 'World Citizen',
    description: 'Explore in 25 countries.',
    category: 'world',
    tier: 'platinum',
    metric: 'countriesVisited',
    threshold: 25,
  },

  // Streak — consecutive days.
  {
    id: 'warming-up',
    title: 'Warming Up',
    description: 'Explore 3 days in a row.',
    category: 'streak',
    tier: 'bronze',
    metric: 'longestStreakDays',
    threshold: 3,
  },
  {
    id: 'consistent',
    title: 'Consistent',
    description: 'Explore 7 days in a row.',
    category: 'streak',
    tier: 'silver',
    metric: 'longestStreakDays',
    threshold: 7,
  },
  {
    id: 'devoted',
    title: 'Devoted',
    description: 'Explore 30 days in a row.',
    category: 'streak',
    tier: 'gold',
    metric: 'longestStreakDays',
    threshold: 30,
  },
  {
    id: 'unstoppable',
    title: 'Unstoppable',
    description: 'Explore 100 days in a row.',
    category: 'streak',
    tier: 'platinum',
    metric: 'longestStreakDays',
    threshold: 100,
  },

  // Progression — levels.
  {
    id: 'level-5',
    title: 'Getting Somewhere',
    description: 'Reach level 5.',
    category: 'progression',
    tier: 'bronze',
    metric: 'level',
    threshold: 5,
  },
  {
    id: 'level-20',
    title: 'Seasoned Explorer',
    description: 'Reach level 20.',
    category: 'progression',
    tier: 'silver',
    metric: 'level',
    threshold: 20,
  },
  {
    id: 'level-50',
    title: 'Master Explorer',
    description: 'Reach level 50.',
    category: 'progression',
    tier: 'gold',
    metric: 'level',
    threshold: 50,
  },
];

/** Fast lookup by id. */
export const ACHIEVEMENTS_BY_ID: ReadonlyMap<string, AchievementDefinition> = new Map(
  ACHIEVEMENTS.map((a) => [a.id, a]),
);

/**
 * Returns the ids of achievements that are satisfied by `stats` but not yet in
 * `alreadyUnlocked`. Pure: it does not mutate the input set.
 */
export function evaluateAchievements(
  stats: PlayerStats,
  alreadyUnlocked: ReadonlySet<string>,
): string[] {
  const newlyUnlocked: string[] = [];
  for (const achievement of ACHIEVEMENTS) {
    if (alreadyUnlocked.has(achievement.id)) {
      continue;
    }
    if (stats[achievement.metric] >= achievement.threshold) {
      newlyUnlocked.push(achievement.id);
    }
  }
  return newlyUnlocked;
}

/**
 * For a given category, returns the next locked achievement (lowest unmet
 * threshold), used to render a "next goal" nudge. Returns undefined if the
 * category is fully cleared.
 */
export function nextAchievementInCategory(
  category: AchievementCategory,
  stats: PlayerStats,
  alreadyUnlocked: ReadonlySet<string>,
): AchievementDefinition | undefined {
  return ACHIEVEMENTS.filter((a) => a.category === category && !alreadyUnlocked.has(a.id)).sort(
    (a, b) => a.threshold - b.threshold,
  )[0];
}
