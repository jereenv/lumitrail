/**
 * RegionCard — a tappable card showing one explored region's progress.
 *
 * Tapping the card triggers `onPress`, which the parent (StatsScreen) wires up
 * to call `focusMap` on the navigation store so the map tab flies to the region.
 *
 * Layout:
 *   Row 1 — region name (bold) + kind badge (pill)
 *   Row 2 — ProgressRing (size 40) + "X / Y cells" muted text
 *   Row 3 — percentage text in aurora accent colour
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { palette, radii, spacing, typography } from '@/app/theme';
import GameCard from '@/presentation/components/GameCard';
import { ProgressRing } from '@/presentation/components';
import type { RegionTally } from '@/domain/loop/state';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RegionRow {
  id: string;
  tally: RegionTally;
  percent: number;
}

interface RegionCardProps {
  row: RegionRow;
  onPress: () => void;
  testID?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RegionCard({ row, onPress, testID }: RegionCardProps): React.ReactElement {
  const { ref, revealedCells } = row.tally;
  const pct = Math.min(100, Math.max(0, row.percent));

  return (
    <GameCard onPress={onPress} accent={palette.aurora} style={styles.card} testID={testID}>
      {/* Row 1 — name + kind badge */}
      <View style={styles.headerRow}>
        <Text style={styles.name} numberOfLines={1}>
          {ref.name}
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{ref.kind}</Text>
        </View>
      </View>

      {/* Row 2 — progress ring + cell count */}
      <View style={styles.progressRow}>
        <ProgressRing progress={pct / 100} size={40} strokeWidth={4} color={palette.aurora} />
        <Text style={styles.cellCount}>
          {revealedCells} / {ref.targetCells} cells
        </Text>
      </View>

      {/* Row 3 — percentage */}
      <Text style={styles.percent}>{pct.toFixed(1)}%</Text>
    </GameCard>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    // Extra left padding to keep content clear of the accent stripe
    paddingLeft: spacing.md + spacing.xs,
    gap: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    flex: 1,
    fontFamily: typography.display,
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: palette.onCard,
  },
  badge: {
    backgroundColor: palette.canvas,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: palette.onCardMuted,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cellCount: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: palette.onCardMuted,
  },
  percent: {
    fontFamily: typography.display,
    fontSize: typography.sizes.md,
    fontWeight: '700',
    color: palette.aurora,
  },
});
