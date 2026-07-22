/**
 * AchievementsScreen — grouped achievement gallery with next-goal nudges.
 *
 * Achievements are grouped by category. Each group shows a "next goal" card
 * (the lowest-threshold locked achievement for that category) and a 2-column
 * grid of AchievementBadge components. Locked badges are rendered at reduced
 * opacity so players can see what's coming.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { cardShadow, palette, radii, spacing, tierColors, typography } from '@/app/theme';
import { useExplorationStore } from '@/app/store/useExplorationStore';
import { AchievementBadge, ProgressRing } from '@/presentation/components';
import {
  ACHIEVEMENTS,
  nextAchievementInCategory,
  type AchievementCategory,
  type AchievementDefinition,
} from '@/domain/achievements/catalog';
import type { PlayerStats } from '@/domain/player/stats';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ALL_CATEGORIES: AchievementCategory[] = [
  'discovery',
  'distance',
  'world',
  'streak',
  'progression',
];

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function groupByCategory(
  achievements: readonly AchievementDefinition[],
): Map<AchievementCategory, AchievementDefinition[]> {
  const map = new Map<AchievementCategory, AchievementDefinition[]>();
  for (const a of achievements) {
    const existing = map.get(a.category);
    if (existing !== undefined) {
      existing.push(a);
    } else {
      map.set(a.category, [a]);
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// Next-goal nudge card
// ---------------------------------------------------------------------------

interface NextGoalCardProps {
  category: AchievementCategory;
  stats: PlayerStats;
  unlockedAchievements: ReadonlySet<string>;
}

function NextGoalCard({
  category,
  stats,
  unlockedAchievements,
}: NextGoalCardProps): React.ReactElement | null {
  const next = nextAchievementInCategory(category, stats, unlockedAchievements);
  if (next === undefined) {
    return (
      <View style={styles.nextGoalCard}>
        <Text style={styles.nextGoalComplete}>✓ Category complete!</Text>
      </View>
    );
  }

  const current = stats[next.metric] as number;
  const progress = Math.min(1, next.threshold > 0 ? current / next.threshold : 0);
  const tierColor = tierColors[next.tier];

  return (
    <View style={[styles.nextGoalCard, { borderColor: `${tierColor}40` }]}>
      <View style={styles.nextGoalHeader}>
        <Text style={styles.nextGoalLabel}>Next goal</Text>
        <Text style={[styles.nextGoalTier, { color: tierColor }]}>{next.tier.toUpperCase()}</Text>
      </View>
      <Text style={styles.nextGoalTitle}>{next.title}</Text>
      <Text style={styles.nextGoalDesc}>{next.description}</Text>
      <View style={styles.nextGoalProgressRow}>
        <View style={styles.nextGoalTrack}>
          <View
            style={[
              styles.nextGoalFill,
              { width: `${progress * 100}%`, backgroundColor: tierColor },
            ]}
          />
        </View>
        <Text style={styles.nextGoalFraction}>
          {current} / {next.threshold}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AchievementsScreen(): React.ReactElement {
  const { playerState } = useExplorationStore();
  const { stats, unlockedAchievements } = playerState;

  const grouped = groupByCategory(ACHIEVEMENTS);
  const unlockedCount = unlockedAchievements.size;
  const total = ACHIEVEMENTS.length;

  return (
    <View style={styles.root}>
      <View testID="trophies-header" style={styles.header}>
        <View testID="header-ring">
          <ProgressRing
            progress={total > 0 ? unlockedCount / total : 0}
            size={72}
            strokeWidth={6}
            color={palette.aurora}
          >
            <Text style={styles.headerRingCount}>{unlockedCount}</Text>
          </ProgressRing>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Trophies</Text>
          <Text style={styles.headerSubtitle}>{unlockedCount} of {total} unlocked</Text>
        </View>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {ALL_CATEGORIES.map((category) => {
          const defs = grouped.get(category) ?? [];
          return (
            <View key={category} style={styles.categorySection}>
              {/* Category header */}
              <Text style={styles.categoryHeader}>{capitalise(category)}</Text>

              {/* Next goal nudge */}
              <NextGoalCard
                category={category}
                stats={stats}
                unlockedAchievements={unlockedAchievements}
              />

              {/* Badge grid */}
              <View style={styles.badgeGrid}>
                {defs.map((achievement) => {
                  const unlocked = unlockedAchievements.has(achievement.id);
                  return (
                    <View
                      key={achievement.id}
                      style={[styles.badgeWrapper, !unlocked && styles.badgeLocked]}
                    >
                      <AchievementBadge achievement={achievement} unlocked={unlocked} size={88} />
                      {!unlocked && (
                        <Text style={styles.badgeProgress}>
                          {Math.min(stats[achievement.metric] as number, achievement.threshold)} /{' '}
                          {achievement.threshold}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: palette.card,
    borderBottomWidth: 1,
    borderBottomColor: palette.cardBorder,
    ...cardShadow,
  },
  headerRingCount: {
    fontFamily: typography.display,
    fontSize: typography.sizes.lg,
    color: palette.onCard,
    fontWeight: '700',
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  headerTitle: {
    fontFamily: typography.display,
    fontSize: typography.sizes.xl,
    color: palette.onCard,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: palette.onCardMuted,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: spacing.lg,
    backgroundColor: palette.canvas,
  },
  categorySection: {
    gap: spacing.md,
  },
  categoryHeader: {
    fontFamily: typography.display,
    fontSize: typography.sizes.lg,
    color: palette.text,
    fontWeight: '700',
  },
  nextGoalCard: {
    backgroundColor: palette.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: palette.surfaceAlt,
    gap: spacing.xs,
  },
  nextGoalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextGoalLabel: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  nextGoalTier: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  nextGoalTitle: {
    fontFamily: typography.display,
    fontSize: typography.sizes.md,
    color: palette.text,
    fontWeight: '600',
  },
  nextGoalDesc: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: palette.textMuted,
  },
  nextGoalProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  nextGoalTrack: {
    flex: 1,
    height: 4,
    backgroundColor: palette.surfaceAlt,
    borderRadius: 2,
    overflow: 'hidden',
  },
  nextGoalFill: {
    height: 4,
    borderRadius: 2,
  },
  nextGoalFraction: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: palette.textMuted,
  },
  nextGoalComplete: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: palette.aurora,
    textAlign: 'center',
    paddingVertical: spacing.xs,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badgeWrapper: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  badgeLocked: {
    opacity: 0.4,
  },
  badgeProgress: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: palette.textMuted,
    textAlign: 'center',
  },
  bottomPad: {
    height: spacing.xxl,
  },
});
