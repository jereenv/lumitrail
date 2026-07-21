/**
 * SettingsScreen — privacy controls, sharing toggles, data export, and
 * app info.
 *
 * All toggle states are local (not yet persisted) so they survive re-renders
 * within a session. Destructive actions are guarded with an Alert confirmation.
 */
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

import { palette, radii, spacing, typography } from '@/app/theme';
import { useExplorationStore } from '@/app/store/useExplorationStore';
import { ScreenHeader } from '@/presentation/components';
import { levelForXp } from '@/domain/progression/levels';

const APP_VERSION = '1.0.0';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionLabel({ title }: { title: string }): React.ReactElement {
  return <Text style={styles.sectionLabel}>{title}</Text>;
}

interface SettingsRowProps {
  label: string;
  description?: string;
  right: React.ReactNode;
}

function SettingsRow({ label, description, right }: SettingsRowProps): React.ReactElement {
  return (
    <View style={styles.settingsRow}>
      <View style={styles.settingsRowText}>
        <Text style={styles.settingsRowLabel}>{label}</Text>
        {description !== undefined && description !== '' && (
          <Text style={styles.settingsRowDesc}>{description}</Text>
        )}
      </View>
      <View style={styles.settingsRowRight}>{right}</View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

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
      <ScreenHeader title="Privacy &amp; Settings" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ---------------------------------------------------------------- */}
        {/* About You                                                         */}
        {/* ---------------------------------------------------------------- */}
        <SectionLabel title="About You" />
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileDetails}>
                Level {levelProgress.level} · {stats.cellsRevealed} cells revealed
              </Text>
            </View>
          </View>
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Sharing toggles                                                   */}
        {/* ---------------------------------------------------------------- */}
        <SectionLabel title="Sharing" />
        <View style={styles.card}>
          <SettingsRow
            label="Appear on global leaderboard"
            description="Let others see your exploration rank"
            right={
              <Switch
                value={showOnGlobal}
                onValueChange={setShowOnGlobal}
                trackColor={{ false: palette.surfaceAlt, true: palette.aurora }}
                thumbColor={palette.text}
                accessibilityLabel="Toggle global leaderboard visibility"
              />
            }
          />
          <View style={styles.divider} />
          <SettingsRow
            label="Show my exploration to friends"
            description="Friends can see your stats and map"
            right={
              <Switch
                value={showToFriends}
                onValueChange={setShowToFriends}
                trackColor={{ false: palette.surfaceAlt, true: palette.aurora }}
                thumbColor={palette.text}
                accessibilityLabel="Toggle exploration visibility to friends"
              />
            }
          />
          <View style={styles.divider} />
          <SettingsRow
            label="Allow friend requests"
            description="Let other players send you requests"
            right={
              <Switch
                value={allowFriendRequests}
                onValueChange={setAllowFriendRequests}
                trackColor={{ false: palette.surfaceAlt, true: palette.aurora }}
                thumbColor={palette.text}
                accessibilityLabel="Toggle friend request permissions"
              />
            }
          />
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Location explanation                                              */}
        {/* ---------------------------------------------------------------- */}
        <SectionLabel title="Location" />
        <View style={styles.card}>
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
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Data management                                                   */}
        {/* ---------------------------------------------------------------- */}
        <SectionLabel title="Your Data" />
        <View style={styles.card}>
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
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* App info                                                          */}
        {/* ---------------------------------------------------------------- */}
        <SectionLabel title="App Info" />
        <View style={styles.card}>
          <View style={styles.appInfoRow}>
            <Text style={styles.appInfoLabel}>Version</Text>
            <Text style={styles.appInfoValue}>{APP_VERSION}</Text>
          </View>
          <Text style={styles.tagline}>
            Walk the world out of the fog. ✦ Every step leaves a trail of light.
          </Text>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.ink,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  sectionLabel: {
    fontFamily: typography.display,
    fontSize: typography.sizes.md,
    color: palette.text,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: `${palette.lumen}22`,
    borderWidth: 2,
    borderColor: palette.lumen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontFamily: typography.display,
    fontSize: typography.sizes.xl,
    color: palette.lumen,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: typography.display,
    fontSize: typography.sizes.md,
    color: palette.text,
    fontWeight: '700',
  },
  profileDetails: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: palette.textMuted,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  settingsRowText: {
    flex: 1,
    gap: 2,
  },
  settingsRowLabel: {
    fontFamily: typography.body,
    fontSize: typography.sizes.md,
    color: palette.text,
  },
  settingsRowDesc: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: palette.textMuted,
  },
  settingsRowRight: {
    flexShrink: 0,
  },
  divider: {
    height: 1,
    backgroundColor: palette.surfaceAlt,
    marginVertical: spacing.xs,
  },
  bodyText: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: palette.textMuted,
    lineHeight: 22,
  },
  exportButton: {
    backgroundColor: palette.sky,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  exportButtonText: {
    fontFamily: typography.display,
    fontSize: typography.sizes.md,
    color: palette.ink,
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: palette.danger,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontFamily: typography.display,
    fontSize: typography.sizes.md,
    color: palette.text,
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
    color: palette.textMuted,
  },
  appInfoValue: {
    fontFamily: typography.display,
    fontSize: typography.sizes.sm,
    color: palette.text,
    fontWeight: '600',
  },
  tagline: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: palette.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bottomPad: {
    height: spacing.xxl,
  },
});
