/**
 * CategoryShelf — a section header + next-goal card for one achievement category.
 *
 * Renders the category name via SectionHeader with an unlocked/total count chip
 * on the right, then shows the player's next locked achievement as a GameCard.
 * If all achievements in the category are unlocked, a completion card is shown
 * instead.
 *
 * The badge grid (Task 3) is rendered via optional `children`.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { palette, radii, spacing, tierColors, typography } from '@/app/theme';
import GameCard from '@/presentation/components/GameCard';
import SectionHeader from '@/presentation/components/SectionHeader';
import {
  nextAchievementInCategory,
  type AchievementCategory,
  type AchievementDefinition,
} from '@/domain/achievements/catalog';
import type { PlayerStats } from '@/domain/player/stats';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CategoryShelfProps {
  category: AchievementCategory;
  stats: PlayerStats;
  unlockedAchievements: ReadonlySet<string>;
  definitions: AchievementDefinition[];
  /** Optional: the badge grid renders inside this component if passed */
  children?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CategoryShelf({
  category,
  stats,
  unlockedAchievements,
  definitions,
  children,
}: CategoryShelfProps): React.ReactElement {
  const next = nextAchievementInCategory(category, stats, unlockedAchievements);

  const unlockedInCategory = definitions.filter((d) => unlockedAchievements.has(d.id)).length;
  const totalInCategory = definitions.length;

  const countChip = (
    <Text style={styles.countChip}>
      {unlockedInCategory} / {totalInCategory}
    </Text>
  );

  return (
    <View style={styles.shelf}>
      <SectionHeader title={capitalise(category)} action={countChip} />

      {next === undefined ? (
        // All trophies in this category are unlocked.
        <GameCard
          accent={palette.aurora}
          testID={`next-goal-card-${category}`}
        >
          <Text style={styles.completeText}>
            All {capitalise(category)} trophies unlocked!
          </Text>
        </GameCard>
      ) : (
        // Show the next locked achievement as a nudge card.
        <NextGoalCard category={category} stats={stats} next={next} />
      )}

      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// NextGoalCard — internal sub-component
// ---------------------------------------------------------------------------

interface NextGoalCardInternalProps {
  category: AchievementCategory;
  stats: PlayerStats;
  next: AchievementDefinition;
}

function NextGoalCard({
  category,
  stats,
  next,
}: NextGoalCardInternalProps): React.ReactElement {
  const tierColor = tierColors[next.tier];
  const current = stats[next.metric] as number;
  const progress = Math.min(1, next.threshold > 0 ? current / next.threshold : 0);

  return (
    <GameCard
      accent={tierColor}
      testID={`next-goal-card-${category}`}
    >
      {/* Top row: "Next goal" label + tier chip */}
      <View style={styles.topRow}>
        <Text style={styles.nextGoalLabel}>NEXT GOAL</Text>
        <View style={[styles.tierChip, { backgroundColor: `${tierColor}20` }]}>
          <Text style={[styles.tierChipText, { color: tierColor }]}>
            {next.tier.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>{next.title}</Text>

      {/* Description */}
      <Text style={styles.description}>{next.description}</Text>

      {/* Progress row */}
      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%`, backgroundColor: tierColor },
            ]}
          />
        </View>
        <Text style={styles.fractionText}>
          {current} / {next.threshold}
        </Text>
      </View>
    </GameCard>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  shelf: {
    gap: spacing.md,
  },
  countChip: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: palette.onCardMuted,
  },
  completeText: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: palette.aurora,
    textAlign: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  nextGoalLabel: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: palette.onCardMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  tierChip: {
    borderRadius: radii.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  tierChipText: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  title: {
    fontFamily: typography.display,
    fontSize: typography.sizes.md,
    fontWeight: '700',
    color: palette.onCard,
    marginBottom: spacing.xs,
  },
  description: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: palette.onCardMuted,
    marginBottom: spacing.sm,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: palette.cardBorder,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: radii.pill,
  },
  fractionText: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: palette.onCardMuted,
  },
});
