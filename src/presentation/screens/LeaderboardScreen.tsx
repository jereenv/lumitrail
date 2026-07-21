/**
 * LeaderboardScreen — ranked player list with global and friends views.
 *
 * Two tabs (Global / Friends) with a metric switcher across the top.
 * Demo players are seeded so the screen looks populated immediately.
 * The current player's row is highlighted in lumen amber.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { palette, radii, spacing, typography } from '@/app/theme';
import { useExplorationStore } from '@/app/store/useExplorationStore';
import { ScreenHeader } from '@/presentation/components';
import { INITIAL_STATS } from '@/domain/player/stats';
import {
  rankBy,
  rankFriends,
  type LeaderboardCandidate,
  type LeaderboardEntry,
  type LeaderboardMetric,
} from '@/domain/leaderboard/ranking';

// ---------------------------------------------------------------------------
// Demo seed data
// ---------------------------------------------------------------------------

const DEMO_PLAYERS: LeaderboardCandidate[] = [
  {
    playerId: 'maya',
    displayName: 'Maya',
    stats: {
      ...INITIAL_STATS,
      cellsRevealed: 340,
      distanceMeters: 28000,
      countriesVisited: 3,
      totalXp: 4200,
      level: 8,
      longestStreakDays: 14,
    },
  },
  {
    playerId: 'kofi',
    displayName: 'Kofi',
    stats: {
      ...INITIAL_STATS,
      cellsRevealed: 120,
      distanceMeters: 9500,
      countriesVisited: 1,
      totalXp: 1400,
      level: 4,
      longestStreakDays: 5,
    },
  },
  {
    playerId: 'noor',
    displayName: 'Noor',
    stats: {
      ...INITIAL_STATS,
      cellsRevealed: 880,
      distanceMeters: 71000,
      countriesVisited: 7,
      totalXp: 11000,
      level: 15,
      longestStreakDays: 30,
    },
  },
  {
    playerId: 'alex',
    displayName: 'Alex',
    stats: {
      ...INITIAL_STATS,
      cellsRevealed: 55,
      distanceMeters: 4200,
      countriesVisited: 1,
      totalXp: 680,
      level: 3,
      longestStreakDays: 2,
    },
  },
];

const FRIEND_IDS = new Set(['maya', 'kofi']);

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

const METRICS: LeaderboardMetric[] = [
  'cellsRevealed',
  'distanceMeters',
  'countriesVisited',
  'totalXp',
];

const METRIC_LABELS: Record<LeaderboardMetric, string> = {
  cellsRevealed: 'Cells',
  distanceMeters: 'Distance',
  countriesVisited: 'Countries',
  totalXp: 'XP',
  longestStreakDays: 'Streak',
};

function formatValue(metric: LeaderboardMetric, value: number): string {
  switch (metric) {
    case 'cellsRevealed':
      return `${value} cells`;
    case 'distanceMeters':
      return `${(value / 1000).toFixed(1)} km`;
    case 'countriesVisited':
      return `${value} ${value === 1 ? 'country' : 'countries'}`;
    case 'totalXp':
      return `${value} XP`;
    case 'longestStreakDays':
      return `${value} day${value !== 1 ? 's' : ''}`;
  }
}

const RANK_COLORS: Record<number, string> = {
  1: '#FFC24B',
  2: '#C7D0DB',
  3: '#CD7F32',
};

// ---------------------------------------------------------------------------
// Row sub-component
// ---------------------------------------------------------------------------

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  metric: LeaderboardMetric;
  isCurrentPlayer: boolean;
}

function LeaderboardRow({
  entry,
  metric,
  isCurrentPlayer,
}: LeaderboardRowProps): React.ReactElement {
  const rankColor = RANK_COLORS[entry.rank] ?? palette.textMuted;

  return (
    <View style={[styles.row, isCurrentPlayer && styles.rowHighlighted]}>
      <Text style={[styles.rank, { color: rankColor }]}>{entry.rank}</Text>
      <Text
        style={[styles.playerName, isCurrentPlayer && styles.playerNameHighlighted]}
        numberOfLines={1}
      >
        {entry.displayName}
        {isCurrentPlayer ? ' (you)' : ''}
      </Text>
      <Text style={styles.valueText}>{formatValue(metric, entry.value)}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type BoardTab = 'global' | 'friends';

export default function LeaderboardScreen(): React.ReactElement {
  const { playerState } = useExplorationStore();
  const [tab, setTab] = useState<BoardTab>('global');
  const [metric, setMetric] = useState<LeaderboardMetric>('cellsRevealed');

  const currentUser: LeaderboardCandidate = {
    playerId: playerState.playerId,
    displayName: playerState.displayName,
    stats: playerState.stats,
  };

  const allCandidates: LeaderboardCandidate[] = [...DEMO_PLAYERS, currentUser];

  const entries: LeaderboardEntry[] =
    tab === 'global'
      ? rankBy(allCandidates, metric)
      : rankFriends(allCandidates, metric, playerState.playerId, FRIEND_IDS);

  return (
    <View style={styles.root}>
      <ScreenHeader title="Leaderboard" />

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        {(['global', 'friends'] as BoardTab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t }}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'global' ? 'Global' : 'Friends'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Metric switcher */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.metricScroll}
        contentContainerStyle={styles.metricRow}
      >
        {METRICS.map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.metricChip, metric === m && styles.metricChipActive]}
            onPress={() => setMetric(m)}
            accessibilityRole="button"
            accessibilityState={{ selected: metric === m }}
          >
            <Text style={[styles.metricChipText, metric === m && styles.metricChipTextActive]}>
              {METRIC_LABELS[m]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Entries */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {entries.length === 0 ? (
          <Text style={styles.emptyText}>No players to rank yet.</Text>
        ) : (
          entries.map((entry) => (
            <LeaderboardRow
              key={entry.playerId}
              entry={entry}
              metric={metric}
              isCurrentPlayer={entry.playerId === playerState.playerId}
            />
          ))
        )}
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
  tabRow: {
    flexDirection: 'row',
    backgroundColor: palette.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: palette.lumen,
  },
  tabText: {
    fontFamily: typography.display,
    fontSize: typography.sizes.sm,
    color: palette.textMuted,
    fontWeight: '600',
  },
  tabTextActive: {
    color: palette.ink,
  },
  metricScroll: {
    marginTop: spacing.sm,
  },
  metricRow: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    flexDirection: 'row',
  },
  metricChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: palette.surfaceAlt,
    backgroundColor: palette.surface,
  },
  metricChipActive: {
    borderColor: palette.lumen,
    backgroundColor: `${palette.lumen}22`,
  },
  metricChipText: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: palette.textMuted,
  },
  metricChipTextActive: {
    color: palette.lumen,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
    marginTop: spacing.md,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: radii.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  rowHighlighted: {
    backgroundColor: `${palette.lumen}18`,
    borderWidth: 1,
    borderColor: `${palette.lumen}44`,
  },
  rank: {
    fontFamily: typography.display,
    fontSize: typography.sizes.md,
    fontWeight: '700',
    width: 28,
    textAlign: 'center',
  },
  playerName: {
    flex: 1,
    fontFamily: typography.body,
    fontSize: typography.sizes.md,
    color: palette.text,
  },
  playerNameHighlighted: {
    color: palette.lumen,
    fontWeight: '600',
  },
  valueText: {
    fontFamily: typography.display,
    fontSize: typography.sizes.sm,
    color: palette.textMuted,
  },
  emptyText: {
    fontFamily: typography.body,
    fontSize: typography.sizes.md,
    color: palette.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  bottomPad: {
    height: spacing.xxl,
  },
});
