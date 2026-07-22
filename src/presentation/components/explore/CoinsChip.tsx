/**
 * CoinsChip — a compact pill-shaped chip showing the player's derived coin balance.
 *
 * Coins are a cosmetic currency derived from total XP accumulated.
 * Formula: floor(totalXp / 10). E.g. 1500 XP → 150 coins.
 * This is display-only and has no effect on game state.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { palette, radii, spacing, typography } from '@/app/theme';

export function deriveCoins(totalXp: number): number {
  return Math.floor(totalXp / 10);
}

interface CoinsChipProps {
  totalXp: number;
}

export default function CoinsChip({ totalXp }: CoinsChipProps): React.ReactElement {
  return (
    <View style={styles.chip}>
      <Text style={styles.label}>🪙 {deriveCoins(totalXp)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    borderRadius: radii.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignSelf: 'center',
  },
  label: {
    fontFamily: typography.display,
    fontSize: typography.sizes.sm,
    color: palette.onCard,
    fontWeight: '700',
  },
});
