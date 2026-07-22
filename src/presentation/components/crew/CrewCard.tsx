/**
 * CrewCard — a single row in the friends/crew list.
 *
 * Wraps a GameCard surface and lays out three zones left-to-right:
 *   Left   — Avatar with level ring and badge.
 *   Center — Player display name + level label + area stat.
 *   Right  — "Compare" button that triggers the CompareSheet.
 *
 * The card itself is not pressable; only the Compare button is interactive.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { palette, radii, spacing, typography } from '@/app/theme';
import Avatar from '@/presentation/components/Avatar';
import GameCard from '@/presentation/components/GameCard';
import { approximateAreaKm2 } from '@/domain/geo/fog';
import { levelForXp } from '@/domain/progression/levels';
import type { FriendProfile } from './friendDemoData';

interface CrewCardProps {
  friendProfile: FriendProfile;
  onCompare: () => void;
}

export default function CrewCard({ friendProfile, onCompare }: CrewCardProps): React.ReactElement {
  const { playerId, displayName, stats } = friendProfile;
  const { level } = levelForXp(stats.totalXp);
  const areaStat = approximateAreaKm2(stats.cellsRevealed).toFixed(1) + ' km²';

  return (
    <GameCard testID={`crew-card-${playerId}`}>
      <View style={styles.row}>
        {/* Left — Avatar */}
        <Avatar name={displayName} level={level} size={44} />

        {/* Center — Name + level label + area */}
        <View style={styles.center}>
          <Text style={styles.displayName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.levelLabel}>{`Lv ${level}`}</Text>
          <Text style={styles.areaStat}>{areaStat}</Text>
        </View>

        {/* Right — Compare button */}
        <TouchableOpacity
          testID={`crew-card-compare-${playerId}`}
          onPress={onCompare}
          style={styles.compareButton}
          accessibilityRole="button"
          accessibilityLabel={`Compare with ${displayName}`}
        >
          <Text style={styles.compareText}>Compare</Text>
        </TouchableOpacity>
      </View>
    </GameCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
  },
  displayName: {
    fontFamily: typography.display,
    fontSize: typography.sizes.md,
    color: palette.onCard,
  },
  levelLabel: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: palette.onCardMuted,
  },
  areaStat: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: palette.onCardMuted,
  },
  compareButton: {
    borderWidth: 1,
    borderColor: palette.coral,
    borderRadius: radii.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compareText: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: palette.coral,
  },
});
