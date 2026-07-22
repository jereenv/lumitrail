/**
 * AchievementBadge — a square badge representing one achievement.
 *
 * Unlocked badges show the tier's brand colour; locked badges are dim so the
 * player can see what's coming without feeling like they've already earned it.
 * The accessibility label lets screen readers announce both the achievement
 * name and its locked/unlocked state.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { palette, radii, spacing, tierColors, typography } from '@/app/theme';
import type { AchievementDefinition } from '@/domain/achievements/catalog';

interface AchievementBadgeProps {
  achievement: AchievementDefinition;
  unlocked: boolean;
  /** Badge side length in dp. Defaults to 80. */
  size?: number;
}

export default function AchievementBadge({
  achievement,
  unlocked,
  size = 80,
}: AchievementBadgeProps): React.ReactElement {
  const tierColor = tierColors[achievement.tier];
  const backgroundColor = unlocked ? `${tierColor}22` : palette.cardBorder;
  const textColor = unlocked ? tierColor : palette.onCardMuted;
  const borderColor = unlocked ? tierColor : palette.cardBorder;

  return (
    <View
      accessible
      accessibilityLabel={`${achievement.title} - ${unlocked ? 'unlocked' : 'locked'}`}
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          backgroundColor,
          borderColor,
        },
      ]}
    >
      {/* Tier indicator dot */}
      <View
        style={[styles.tierDot, { backgroundColor: unlocked ? tierColor : palette.onCardMuted }]}
      />

      <Text
        style={[
          styles.title,
          { color: textColor, fontSize: size < 60 ? typography.sizes.xs : typography.sizes.sm },
        ]}
        numberOfLines={2}
        textBreakStrategy="simple"
      >
        {achievement.title}
      </Text>

      <Text style={[styles.tierLabel, { color: textColor }]}>{achievement.tier.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radii.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
    gap: spacing.xs,
  },
  tierDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    fontFamily: typography.display,
    fontWeight: '600',
    textAlign: 'center',
  },
  tierLabel: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    opacity: 0.7,
  },
});
