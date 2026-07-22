/**
 * AchievementsScreen — grouped achievement gallery with next-goal nudges.
 *
 * Achievements are grouped by category. Each group is rendered by
 * CategoryShelf, which shows a section header, a next-goal nudge card, and a
 * MedalGrid of all achievements in that category.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { cardShadow, palette, spacing, typography } from '@/app/theme';
import { useExplorationStore } from '@/app/store/useExplorationStore';
import { ProgressRing } from '@/presentation/components';
import {
  ACHIEVEMENTS,
  type AchievementCategory,
  type AchievementDefinition,
} from '@/domain/achievements/catalog';
import CategoryShelf from '../components/trophies/CategoryShelf';
import MedalGrid from '../components/trophies/MedalGrid';

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
            <CategoryShelf
              key={category}
              category={category}
              stats={stats}
              unlockedAchievements={unlockedAchievements}
              definitions={defs}
            >
              <MedalGrid
                definitions={defs}
                stats={stats}
                unlockedAchievements={unlockedAchievements}
              />
            </CategoryShelf>
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
  bottomPad: {
    height: spacing.xxl,
  },
});
