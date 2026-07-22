/**
 * StatCard — a compact card showing a single statistic with an optional emoji
 * icon, a muted label, and a prominent value.
 *
 * Used on the Stats screen and in summary rows throughout the app. The `accent`
 * prop lets callers override the value colour (e.g. danger red for a penalty
 * stat, aurora teal for a completion rate).
 */
import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { cardShadow, palette, radii, spacing, typography } from '@/app/theme';

interface StatCardProps {
  label: string;
  value: string | number;
  /** Optional emoji or short text displayed before the label. */
  icon?: string;
  /** Override colour for the value text. Defaults to `palette.coral`. */
  accent?: string;
  style?: ViewStyle;
}

export default function StatCard({
  label,
  value,
  icon,
  accent = palette.coral,
  style,
}: StatCardProps): React.ReactElement {
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.labelRow} numberOfLines={1}>
        {icon !== undefined && icon !== '' ? `${icon} ` : ''}
        <Text style={styles.label}>{label}</Text>
      </Text>
      <Text style={[styles.value, { color: accent }]} numberOfLines={1}>
        {String(value)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: palette.cardBorder,
    padding: spacing.md,
    gap: spacing.xs,
    ...cardShadow,
  },
  labelRow: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: palette.onCardMuted,
  },
  label: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: palette.onCardMuted,
  },
  value: {
    fontFamily: typography.display,
    fontSize: typography.sizes.xl,
    fontWeight: '700',
  },
});
