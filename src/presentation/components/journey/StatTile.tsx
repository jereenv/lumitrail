/**
 * StatTile — a single gamified stat tile for the Journey screen.
 *
 * Wraps `GameCard` (the standard card surface) and `AnimatedNumber` (the
 * count-up animation). Each tile shows a small icon + label row above a large
 * animated number that counts from 0 to its target value on first mount.
 *
 * The `accent` prop is forwarded to `GameCard` which paints a thin coloured
 * stripe down the left edge, giving each tile its unique category colour.
 *
 * Tiles are non-tappable — no `onPress` is passed to `GameCard`.
 *
 * `GameCard.style` is typed as `ViewStyle` (not an array), so we merge the
 * tile's base style with any caller-supplied overrides via `StyleSheet.flatten`
 * before passing it down.
 */
import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { palette, spacing, typography } from '@/app/theme';
import AnimatedNumber from '@/presentation/components/AnimatedNumber';
import GameCard from '@/presentation/components/GameCard';

export interface StatTileProps {
  label: string;
  /** Raw numeric value passed to AnimatedNumber. */
  value: number;
  /** Formats the animated value into display text. Defaults to Math.round(n).toString(). */
  format?: (n: number) => string;
  icon: string;
  /** Palette accent colour for the left stripe — use palette tokens only. */
  accent: string;
  style?: ViewStyle;
  testID?: string;
}

export default function StatTile({
  label,
  value,
  format,
  icon,
  accent,
  style,
  testID,
}: StatTileProps): React.ReactElement {
  // StyleSheet.flatten merges an array of styles into a plain ViewStyle object.
  // GameCard's `style` prop is strictly typed as ViewStyle, not StyleProp<ViewStyle>,
  // so we cannot pass an array directly.
  const mergedStyle = StyleSheet.flatten([styles.tile, style]);

  return (
    <GameCard accent={accent} style={mergedStyle} testID={testID}>
      <View style={styles.labelRow}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <AnimatedNumber value={value} format={format} countUpOnMount />
    </GameCard>
  );
}

const styles = StyleSheet.create({
  tile: {
    gap: spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  icon: {
    fontSize: typography.sizes.sm,
  },
  label: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: palette.onCardMuted,
    flex: 1,
  },
});
