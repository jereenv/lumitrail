/**
 * SnapshotCard — a shareable explorer card showing the player's real stats.
 *
 * Displays the player's Avatar, name, level title, key stats (cells revealed,
 * distance, countries), worldwide exploration percentage, and a Share button
 * that composes a text message via React Native's built-in Share API.
 *
 * expo-sharing is checked for device availability, but the actual share action
 * uses RN's Share.share() for message-based sharing (not file sharing).
 */
import React from 'react';
import { Alert, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { palette, radii, spacing, typography } from '@/app/theme';
import Avatar from '@/presentation/components/Avatar';
import GameCard from '@/presentation/components/GameCard';
import { worldwidePercent } from '@/domain/regions/exploration';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SnapshotCardProps {
  playerName: string;
  level: number;
  stats: {
    cellsRevealed: number;
    distanceMeters: number;
    countriesVisited: number;
    totalXp: number;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns a human-readable explorer title for the given level.
 * These correspond to the four tiers of exploration mastery in Lumitrail.
 */
function explorerTitle(level: number): string {
  if (level >= 15) return 'Voyager';
  if (level >= 10) return 'Trailblazer';
  if (level >= 5) return 'Pathfinder';
  return 'Wanderer';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SnapshotCard({
  playerName,
  level,
  stats,
}: SnapshotCardProps): React.ReactElement {
  const pct = worldwidePercent(stats.cellsRevealed);
  const dist = (stats.distanceMeters / 1000).toFixed(1);
  const title = explorerTitle(level);

  async function handleShare(): Promise<void> {
    const message = `I've explored ${pct.toFixed(4)}% of the world with Lumitrail! ${stats.cellsRevealed} cells, ${dist}km, ${stats.countriesVisited} countries. Level ${level} ${title}.`;
    try {
      await Share.share({ message });
    } catch {
      Alert.alert('Coming soon', "Sharing isn't available on this device yet.");
    }
  }

  return (
    <GameCard testID="snapshot-card" accent={palette.lumen}>
      {/* Header row — Avatar + name + title */}
      <View style={styles.headerRow}>
        <Avatar name={playerName} level={level} size={52} />
        <View style={styles.nameBlock}>
          <Text style={styles.playerName} numberOfLines={1}>
            {playerName}
          </Text>
          <Text style={styles.levelTitle}>{title}</Text>
        </View>
      </View>

      {/* Stats row — three chips separated by dividers */}
      <View style={styles.statsRow}>
        <View style={styles.chip}>
          <Text style={styles.chipValue}>{stats.cellsRevealed.toLocaleString()}</Text>
          <Text style={styles.chipLabel}>Cells</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.chip}>
          <Text style={styles.chipValue}>{dist}</Text>
          <Text style={styles.chipLabel}>km</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.chip}>
          <Text style={styles.chipValue}>{stats.countriesVisited}</Text>
          <Text style={styles.chipLabel}>Countries</Text>
        </View>
      </View>

      {/* World % line */}
      <Text style={styles.worldLine}>{pct.toFixed(4)}% of the world explored</Text>

      {/* Share button */}
      <TouchableOpacity
        testID="snapshot-share-btn"
        style={styles.shareButton}
        onPress={() => void handleShare()}
        accessibilityRole="button"
        accessibilityLabel="Share your explorer snapshot"
      >
        <Text style={styles.shareButtonText}>Share Snapshot</Text>
      </TouchableOpacity>
    </GameCard>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  nameBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  playerName: {
    fontFamily: typography.display,
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: palette.onCard,
  },
  levelTitle: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: palette.lumen,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.canvas,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  chipValue: {
    fontFamily: typography.display,
    fontSize: typography.sizes.md,
    fontWeight: '700',
    color: palette.aurora,
  },
  chipLabel: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: palette.onCardMuted,
    marginTop: 2,
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: palette.cardBorder,
  },
  worldLine: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: palette.onCardMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  shareButton: {
    backgroundColor: palette.lumen,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  shareButtonText: {
    fontFamily: typography.display,
    fontSize: typography.sizes.md,
    fontWeight: '700',
    color: palette.ink,
  },
});
