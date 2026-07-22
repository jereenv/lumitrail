/**
 * TabBar — the custom bottom navigation bar.
 *
 * Each tab is a TouchableOpacity with an emoji icon and a short label. The
 * active tab glows in `palette.lumen`; inactive tabs are muted. A thin top
 * border visually separates the bar from screen content.
 *
 * We export `TabId` as a named type so screens can type their own navigation
 * state without importing from a navigation library.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { TabId } from '@/app/store/useNavigationStore';
import { palette, spacing, typography } from '@/app/theme';

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
  { id: 'map', icon: '🗺️', label: 'Map' },
  { id: 'stats', icon: '📊', label: 'Stats' },
  { id: 'achievements', icon: '🏅', label: 'Badges' },
  { id: 'leaderboard', icon: '🏆', label: 'Board' },
  { id: 'friends', icon: '👥', label: 'Friends' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
];

export default function TabBar({ activeTab, onTabPress }: TabBarProps): React.ReactElement {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        const color = isActive ? palette.lumen : palette.textMuted;

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
    backgroundColor: palette.surface,
    borderTopWidth: 1,
    borderTopColor: palette.surfaceAlt,
    flexDirection: 'row',
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
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
