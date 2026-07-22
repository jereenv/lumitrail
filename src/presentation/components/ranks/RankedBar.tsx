/**
 * RankedBar — a single leaderboard row with an animated progress bar.
 *
 * Each row shows the player's rank number, their display name, their formatted
 * value, and a bar that animates to a width proportional to their score
 * relative to the top-ranked player. The current player's row uses coral
 * accents so they can spot themselves instantly.
 *
 * Animation: Animated.spring with the shared `motion.spring` config so the
 * bar "bounces" into position — consistent with the rest of the app's motion.
 */
import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { motion, palette, radii, spacing, typography } from '@/app/theme';
import { GameCard } from '@/presentation/components';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RankedBarProps {
  rank: number;
  name: string;
  value: string;
  /** Ratio 0–1: this entry's raw value divided by the top-ranked raw value. */
  ratio: number;
  /** True when this row represents the currently signed-in player. */
  isCurrentPlayer: boolean;
  testID?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RankedBar({
  rank,
  name,
  value,
  ratio,
  isCurrentPlayer,
  testID,
}: RankedBarProps): React.ReactElement {
  // clamp ratio to [0,1] so bars never overflow
  const clampedRatio = Math.min(1, Math.max(0, ratio));

  // Animated.Value holds the bar width as a 0-1 interpolation input.
  const [animatedRatio] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.spring(animatedRatio, {
      toValue: clampedRatio,
      damping: motion.spring.damping,
      stiffness: motion.spring.stiffness,
      mass: motion.spring.mass,
      useNativeDriver: false, // width animation requires JS driver
    }).start();
  }, [animatedRatio, clampedRatio]);

  const barColor = isCurrentPlayer ? palette.coral : palette.aurora;
  const accentColor = isCurrentPlayer ? palette.coral : undefined;

  return (
    <GameCard testID={testID} accent={accentColor} style={styles.card}>
      {/* Top row: rank badge + name + value */}
      <View style={styles.topRow}>
        <Text style={styles.rank}>{rank}</Text>
        <Text style={[styles.name, isCurrentPlayer && styles.nameYou]} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.value}>{value}</Text>
      </View>

      {/* Animated progress bar */}
      <View style={styles.barTrack}>
        <Animated.View
          style={[
            styles.barFill,
            {
              backgroundColor: barColor,
              width: animatedRatio.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </GameCard>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rank: {
    fontFamily: typography.display,
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: palette.onCardMuted,
    width: 24,
    textAlign: 'center',
  },
  name: {
    flex: 1,
    fontFamily: typography.body,
    fontSize: typography.sizes.md,
    color: palette.onCard,
  },
  nameYou: {
    color: palette.coral,
    fontWeight: '600',
  },
  value: {
    fontFamily: typography.display,
    fontSize: typography.sizes.sm,
    color: palette.onCardMuted,
  },
  barTrack: {
    height: 4,
    backgroundColor: palette.cardBorder,
    borderRadius: radii.pill,
    overflow: 'hidden',
    marginLeft: 24 + spacing.sm, // align under the name, past the rank badge
  },
  barFill: {
    height: '100%',
    borderRadius: radii.pill,
  },
});
