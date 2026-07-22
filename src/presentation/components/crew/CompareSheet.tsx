/**
 * CompareSheet — bottom-sheet modal showing side-by-side stats comparison
 * between a friend and the current player.
 *
 * Uses React Native's built-in Modal (animationType="slide") so no third-party
 * library is needed. The overlay dimms the background and the card slides in
 * from the bottom with rounded top corners.
 */
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { palette, radii, spacing, typography } from '@/app/theme';
import Avatar from '@/presentation/components/Avatar';
import type { FriendProfile } from './friendDemoData';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CompareSheetProps {
  visible: boolean;
  friendProfile: FriendProfile;
  playerStats: {
    cellsRevealed: number;
    distanceMeters: number;
    countriesVisited: number;
    totalXp: number;
  };
  playerName: string;
  onClose: () => void;
}

// A single row's data shape — keeps the rendering loop clean.
interface StatRowConfig {
  key: 'cells' | 'distance' | 'area' | 'countries';
  label: string;
  friendValue: string;
  playerValue: string;
  friendRaw: number;
  playerRaw: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Decide text colour for each side of a stat row.
 *
 * Rules:
 *   - Higher value → palette.aurora  (winning colour)
 *   - Lower value  → palette.onCardMuted  (muted)
 *   - Tie          → both get palette.aurora
 */
function winnerColors(friendRaw: number, playerRaw: number): { friend: string; player: string } {
  if (friendRaw > playerRaw) {
    return { friend: palette.aurora, player: palette.onCardMuted };
  }
  if (playerRaw > friendRaw) {
    return { friend: palette.onCardMuted, player: palette.aurora };
  }
  // Tie — both highlighted.
  return { friend: palette.aurora, player: palette.aurora };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CompareSheet({
  visible,
  friendProfile,
  playerStats,
  playerName,
  onClose,
}: CompareSheetProps): React.ReactElement {
  // Build the four stat rows from the props, deriving display strings here so
  // the JSX below stays purely presentational.
  const rows: StatRowConfig[] = [
    {
      key: 'cells',
      label: 'Cells',
      friendValue: String(friendProfile.stats.cellsRevealed),
      playerValue: String(playerStats.cellsRevealed),
      friendRaw: friendProfile.stats.cellsRevealed,
      playerRaw: playerStats.cellsRevealed,
    },
    {
      key: 'distance',
      label: 'Distance',
      friendValue: `${(friendProfile.stats.distanceMeters / 1000).toFixed(1)} km`,
      playerValue: `${(playerStats.distanceMeters / 1000).toFixed(1)} km`,
      friendRaw: friendProfile.stats.distanceMeters,
      playerRaw: playerStats.distanceMeters,
    },
    {
      key: 'area',
      label: 'Area',
      // Each res-9 hex ≈ 0.105 km²
      friendValue: `${(friendProfile.stats.cellsRevealed * 0.105).toFixed(1)} km²`,
      playerValue: `${(playerStats.cellsRevealed * 0.105).toFixed(1)} km²`,
      friendRaw: friendProfile.stats.cellsRevealed,
      playerRaw: playerStats.cellsRevealed,
    },
    {
      key: 'countries',
      label: 'Countries',
      friendValue: String(friendProfile.stats.countriesVisited),
      playerValue: String(playerStats.countriesVisited),
      friendRaw: friendProfile.stats.countriesVisited,
      playerRaw: playerStats.countriesVisited,
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* Full-screen dim overlay — testID on the outermost View inside Modal */}
      <View style={styles.overlay} testID="compare-sheet-overlay">
        {/* The card slides up from the bottom */}
        <View style={styles.card}>
          {/* ---- Header: friend | "vs" | you ---- */}
          <View style={styles.header}>
            {/* Friend side */}
            <View style={styles.headerSide}>
              <Avatar name={friendProfile.displayName} size={40} />
              <Text style={styles.headerName}>{friendProfile.displayName}</Text>
            </View>

            {/* Centre "vs" label */}
            <Text style={styles.vsLabel}>vs</Text>

            {/* Player side */}
            <View style={[styles.headerSide, styles.headerSideRight]}>
              <Avatar name={playerName} size={40} />
              <Text style={styles.headerName}>You</Text>
            </View>
          </View>

          {/* ---- Stat rows ---- */}
          <ScrollView
            style={styles.rowsContainer}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          >
            {rows.map((row) => {
              const colors = winnerColors(row.friendRaw, row.playerRaw);
              return (
                <View key={row.key} style={styles.statRow} testID={`compare-row-${row.key}`}>
                  <Text
                    style={[styles.statValue, { color: colors.friend }]}
                    accessibilityLabel={`${row.label} friend ${row.friendValue}`}
                  >
                    {row.friendValue}
                  </Text>

                  <Text style={styles.statLabel}>{row.label}</Text>

                  <Text
                    style={[styles.statValue, styles.statValueRight, { color: colors.player }]}
                    accessibilityLabel={`${row.label} you ${row.playerValue}`}
                  >
                    {row.playerValue}
                  </Text>
                </View>
              );
            })}
          </ScrollView>

          {/* ---- Close button ---- */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            testID="compare-sheet-close"
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    // palette.shadow (#123027) at 0.7 alpha — no hard-coded hex for non-token colours
    backgroundColor: 'rgba(18, 48, 39, 0.7)',
  },
  card: {
    backgroundColor: palette.card,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  // ---- Header ----
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerSide: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerSideRight: {
    alignItems: 'center',
  },
  headerName: {
    fontFamily: typography.display,
    fontWeight: '700',
    fontSize: typography.sizes.sm,
    color: palette.onCard,
    textAlign: 'center',
  },
  vsLabel: {
    fontFamily: typography.body,
    fontSize: typography.sizes.md,
    color: palette.onCardMuted,
    marginHorizontal: spacing.sm,
  },
  // ---- Stat rows ----
  rowsContainer: {
    marginBottom: spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.cardBorder,
  },
  statValue: {
    flex: 1,
    fontFamily: typography.display,
    fontWeight: '700',
    fontSize: typography.sizes.md,
    textAlign: 'left',
  },
  statValueRight: {
    textAlign: 'right',
  },
  statLabel: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: palette.onCardMuted,
    textAlign: 'center',
    minWidth: 72,
  },
  // ---- Close button ----
  closeButton: {
    backgroundColor: palette.coral,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  closeButtonText: {
    fontFamily: typography.display,
    fontWeight: '700',
    fontSize: typography.sizes.md,
    color: palette.card,
  },
});
