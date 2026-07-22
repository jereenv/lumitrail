/**
 * SettingsScreen — privacy controls, sharing toggles, data export, and
 * app info.
 *
 * All toggle states are local (not yet persisted) so they survive re-renders
 * within a session. Destructive actions are guarded with an Alert confirmation.
 *
 * Uses the cartoony gamified design system: cream GameCard containers,
 * Avatar for the player profile, and palette-only colors (no hardcoded hex).
 */
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { palette, radii, spacing, typography } from '@/app/theme';
import { useExplorationStore } from '@/app/store/useExplorationStore';
import { Avatar, GameCard, ScreenHeader, SectionHeader } from '@/presentation/components';
import { levelForXp } from '@/domain/progression/levels';
import SettingsToggleRow from '../components/settings/SettingsToggleRow';

const APP_VERSION = '1.0.0';

export default function SettingsScreen(): React.ReactElement {
  const { playerState, exportData, deleteAllData } = useExplorationStore();
  const { stats, displayName } = playerState;

  const levelProgress = levelForXp(stats.totalXp);

  const [showOnGlobal, setShowOnGlobal] = useState(true);
  const [showToFriends, setShowToFriends] = useState(true);
  const [allowFriendRequests, setAllowFriendRequests] = useState(true);

  function handleExport(): void {
    void exportData().then(() => {
      Alert.alert('Exported', 'Your data has been exported!');
    });
  }

  function handleDeleteAll(): void {
    Alert.alert(
      'Delete All Data?',
      'This cannot be undone. All your exploration history, achievements, and stats will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void deleteAllData();
          },
        },
      ],
    );
  }

  return (
    <View style={styles.root}>
      <ScreenHeader title="Settings" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ---------------------------------------------------------------- */}
        {/* About You                                                         */}
        {/* ---------------------------------------------------------------- */}
        <SectionHeader title="About You" />
        <GameCard testID="settings-card-about">
          <View style={styles.aboutRow}>
            <Avatar name={displayName} level={levelProgress.level} size={56} />
            <View style={styles.aboutInfo}>
              <Text style={styles.aboutName}>{displayName}</Text>
              <Text style={styles.aboutDetails}>
                Level {levelProgress.level} · {stats.cellsRevealed} cells revealed
              </Text>
            </View>
          </View>
        </GameCard>

        {/* ---------------------------------------------------------------- */}
        {/* Sharing toggles                                                   */}
        {/* ---------------------------------------------------------------- */}
        <SectionHeader title="Sharing" />
        <GameCard testID="settings-card-sharing">
          <SettingsToggleRow
            label="Appear on global leaderboard"
            description="Let others see your exploration rank"
            value={showOnGlobal}
            onValueChange={setShowOnGlobal}
            accessibilityLabel="Toggle global leaderboard visibility"
            testID="toggle-global-leaderboard"
            showDivider
          />
          <SettingsToggleRow
            label="Show my exploration to friends"
            description="Friends can see your stats and map"
            value={showToFriends}
            onValueChange={setShowToFriends}
            accessibilityLabel="Toggle exploration visibility to friends"
            testID="toggle-friends-visibility"
            showDivider
          />
          <SettingsToggleRow
            label="Allow friend requests"
            description="Let other players send you requests"
            value={allowFriendRequests}
            onValueChange={setAllowFriendRequests}
            accessibilityLabel="Toggle friend request permissions"
            testID="toggle-friend-requests"
            showDivider={false}
          />
        </GameCard>

        {/* ---------------------------------------------------------------- */}
        {/* Location explanation                                              */}
        {/* ---------------------------------------------------------------- */}
        <SectionHeader title="Location" />
        <GameCard testID="settings-card-location">
          <Text style={styles.bodyText}>
            Lumitrail uses your device&apos;s GPS to reveal hexagonal cells on your personal map as
            you walk, run, or cycle. Location data is processed on-device and only uploaded when you
            choose to sync.
          </Text>
          <Text style={styles.bodyText}>
            Background location is used to continue logging when the app is minimised. You can
            revoke this permission in your device settings at any time — the app will still work in
            the foreground.
          </Text>
        </GameCard>

        {/* ---------------------------------------------------------------- */}
        {/* Data management                                                   */}
        {/* ---------------------------------------------------------------- */}
        <SectionHeader title="Your Data" />
        <GameCard testID="settings-card-data">
          <Text style={styles.bodyText}>
            All exploration data is yours. Export a full copy or permanently delete everything at
            any time.
          </Text>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={handleExport}
            accessibilityLabel="Export my exploration data"
            accessibilityRole="button"
          >
            <Text style={styles.exportButtonText}>Export my data</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteAll}
            accessibilityLabel="Delete all my data — this cannot be undone"
            accessibilityRole="button"
          >
            <Text style={styles.deleteButtonText}>Delete all my data</Text>
          </TouchableOpacity>
        </GameCard>

        {/* ---------------------------------------------------------------- */}
        {/* App info                                                          */}
        {/* ---------------------------------------------------------------- */}
        <SectionHeader title="App Info" />
        <GameCard testID="settings-card-appinfo">
          <View style={styles.appInfoRow}>
            <Text style={styles.appInfoLabel}>Version</Text>
            <Text style={styles.appInfoValue}>{APP_VERSION}</Text>
          </View>
          <Text style={styles.tagline}>
            Walk the world out of the fog. ✦ Every step leaves a trail of light.
          </Text>
        </GameCard>

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.canvas,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  aboutInfo: {
    flex: 1,
    gap: 2,
  },
  aboutName: {
    fontFamily: typography.display,
    fontSize: typography.sizes.md,
    color: palette.onCard,
    fontWeight: '700',
  },
  aboutDetails: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: palette.onCardMuted,
  },
  bodyText: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: palette.onCardMuted,
    lineHeight: 22,
  },
  exportButton: {
    backgroundColor: palette.aurora,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  exportButtonText: {
    fontFamily: typography.display,
    fontSize: typography.sizes.md,
    color: palette.onCard,
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: palette.coral,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontFamily: typography.display,
    fontSize: typography.sizes.md,
    color: palette.card,
    fontWeight: '700',
  },
  appInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appInfoLabel: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: palette.onCardMuted,
  },
  appInfoValue: {
    fontFamily: typography.display,
    fontSize: typography.sizes.sm,
    color: palette.onCard,
    fontWeight: '600',
  },
  tagline: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: palette.onCardMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bottomPad: {
    height: spacing.xxl,
  },
});
