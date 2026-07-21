/**
 * LevelBadge — a square badge with heavy rounded corners (hexagonal-ish)
 * displaying the player's current level.
 *
 * Three sizes (sm / md / lg) allow the badge to be embedded in headers,
 * stat cards, and leaderboard rows without the consumer doing math.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { palette, radii, typography } from '@/app/theme';

interface LevelBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
}

const DIMENSIONS: Record<'sm' | 'md' | 'lg', number> = {
  sm: 40,
  md: 56,
  lg: 72,
};

const FONT_SIZES: Record<'sm' | 'md' | 'lg', number> = {
  sm: typography.sizes.xs,
  md: typography.sizes.sm,
  lg: typography.sizes.md,
};

export default function LevelBadge({ level, size = 'md' }: LevelBadgeProps): React.ReactElement {
  const dim = DIMENSIONS[size];
  const fontSize = FONT_SIZES[size];

  return (
    <View
      style={[
        styles.badge,
        {
          width: dim,
          height: dim,
          borderRadius: radii.md,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize }]}>Lv</Text>
      <Text style={[styles.number, { fontSize: fontSize + 2 }]}>{level}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: palette.surface,
    borderWidth: 2,
    borderColor: palette.lumen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: typography.display,
    color: palette.lumen,
    lineHeight: undefined,
  },
  number: {
    fontFamily: typography.display,
    color: palette.lumen,
    fontWeight: '700',
    lineHeight: undefined,
  },
});
