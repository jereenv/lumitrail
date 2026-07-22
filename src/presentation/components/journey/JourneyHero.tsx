/**
 * JourneyHero — the gamified hero section at the top of the Journey screen.
 *
 * Displays the player's avatar with level ring, their explorer title derived
 * from their level, and the percentage of the world they have uncovered so far.
 * Rendered inside a cream GameCard for visual consistency with other surfaces.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { palette, spacing, typography } from '@/app/theme';
import Avatar from '@/presentation/components/Avatar';
import GameCard from '@/presentation/components/GameCard';
import { explorerTitle } from '@/domain/progression/explorerTitle';

interface JourneyHeroProps {
  displayName: string;
  level: number;
  /** Already-computed worldwide completion percentage (0–100). */
  worldPercent: number;
  testID?: string;
}

export default function JourneyHero({
  displayName,
  level,
  worldPercent,
  testID,
}: JourneyHeroProps): React.ReactElement {
  const title = explorerTitle(level);
  const percentLabel = `${worldPercent.toFixed(3)}%`;

  return (
    <GameCard testID={testID} accent={palette.coral} style={styles.card}>
      <View style={styles.row}>
        <Avatar name={displayName} level={level} size={64} />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.worldRow}>
            <Text style={styles.worldLabel}>World uncovered</Text>
            <Text style={styles.worldPercent}>{percentLabel}</Text>
          </View>
        </View>
      </View>
    </GameCard>
  );
}

const styles = StyleSheet.create({
  card: {
    // Extra left padding to clear the accent stripe from GameCard
    paddingLeft: spacing.md + spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    fontFamily: typography.display,
    fontSize: typography.sizes.md,
    fontWeight: '700',
    color: palette.onCard,
  },
  title: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: palette.coral,
    fontWeight: '600',
  },
  worldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  worldLabel: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: palette.onCardMuted,
  },
  worldPercent: {
    fontFamily: typography.display,
    fontSize: typography.sizes.md,
    fontWeight: '700',
    color: palette.aurora,
  },
});
