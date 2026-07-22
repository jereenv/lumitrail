/**
 * Bottom banner showing where you are and how much of the current view you have
 * uncovered — e.g. "Richmond · 0.3%". Pure presentational: all data is passed
 * in as props so it is trivial to test and reuse.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { palette, radii, spacing, typography } from '@/app/theme';

export function RegionBanner({
  locality,
  percent,
}: {
  locality: string;
  percent: number;
}): React.ReactElement {
  return (
    <View style={styles.banner}>
      <Text style={styles.name} testID="region-banner-name" numberOfLines={1}>
        {locality}
      </Text>
      <Text style={styles.percent} testID="region-banner-percent">
        {`${percent.toFixed(1)}%`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: palette.card,
    borderWidth: 1.5,
    borderColor: palette.cardBorder,
  },
  name: {
    flex: 1,
    fontFamily: typography.display,
    fontSize: typography.sizes.md,
    color: palette.onCard,
    fontWeight: '700',
  },
  percent: {
    fontFamily: typography.display,
    fontSize: typography.sizes.lg,
    color: palette.coral,
    fontWeight: '800',
    marginLeft: spacing.md,
  },
});
