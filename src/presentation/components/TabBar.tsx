/**
 * TabBar — the custom bottom navigation bar.
 *
 * Each tab is a TouchableOpacity with an emoji icon and a game-voice label.
 * The active tab uses `palette.coral`; inactive tabs use `palette.onCardMuted`.
 * A soft top border and card shadow separate the bar from screen content.
 * `useSafeAreaInsets` ensures the bar clears the home indicator on iOS and
 * gesture navigation bar on Android.
 *
 * We export `TabId` as a named type so screens can type their own navigation
 * state without importing from a navigation library.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { TabId } from '@/app/store/useNavigationStore';
import { cardShadow, palette, spacing, typography } from '@/app/theme';

export type { TabId };

interface TabBarProps {
  activeTab: TabId;
  onTabPress: (tab: TabId) => void;
}

interface TabMeta {
  readonly id: TabId;
  readonly icon: string;
  readonly label: string;
}

const TABS: readonly TabMeta[] = [
  { id: 'map', icon: '🗺️', label: 'Explore' },
  { id: 'stats', icon: '📊', label: 'Journey' },
  { id: 'achievements', icon: '🏅', label: 'Trophies' },
  { id: 'leaderboard', icon: '🏆', label: 'Ranks' },
  { id: 'friends', icon: '👥', label: 'Crew' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
];

export default function TabBar({ activeTab, onTabPress }: TabBarProps): React.ReactElement {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(spacing.sm, insets.bottom) }]}>
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        const color = isActive ? palette.coral : palette.onCardMuted;

        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => {
              onTabPress(tab.id);
            }}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.icon, { color }]}>{tab.icon}</Text>
            <Text style={[styles.label, { color }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.card,
    borderTopWidth: 1,
    borderTopColor: palette.cardBorder,
    flexDirection: 'row',
    paddingHorizontal: spacing.xs,
    ...cardShadow,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.sm,
    gap: 2,
  },
  icon: {
    fontSize: 20,
  },
  label: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
  },
});
