/**
 * LeaderboardScreen — season leaderboard with podium, ranked bars, and filters.
 *
 * Layout (top → bottom):
 *   ScreenHeader "Ranks"
 *   GameCard  — Global/Crew toggle pill + metric chips + season label
 *   PodiumRow — top 3 players (only when ≥ 3 entries have ranks 1/2/3)
 *   FlatList  — rank 4+ entries as animated RankedBar rows
 *
 * The current player's entry always appears in the FlatList regardless of rank
 * so they can always find themselves. If their rank is > 3 the list auto-scrolls
 * to their entry on mount and whenever the tab or metric changes.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ListRenderItemInfo,
} from 'react-native';

import { palette, radii, spacing, typography } from '@/app/theme';
import { useExplorationStore } from '@/app/store/useExplorationStore';
import { GameCard, PodiumRow, ScreenHeader } from '@/presentation/components';
import { INITIAL_STATS } from '@/domain/player/stats';
import {
  rankBy,
  rankFriends,
  type LeaderboardCandidate,
  type LeaderboardEntry,
  type LeaderboardMetric,
} from '@/domain/leaderboard/ranking';

import RankedBar from '@/presentation/components/ranks/RankedBar';

// ---------------------------------------------------------------------------
// Demo seed — keep playerIds and stats exactly as-is (per brief)
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
// Metric config
// ---------------------------------------------------------------------------

const METRICS: LeaderboardMetric[] = [
  'cellsRevealed',
  'distanceMeters',
  'countriesVisited',
  'totalXp',
];

const METRIC_LABELS: Record<LeaderboardMetric, string> = {
  cellsRevealed: '🗺 Cells',
  distanceMeters: '📍 Distance',
  countriesVisited: '🌍 Countries',
  totalXp: '⚡ XP',
  longestStreakDays: '🔥 Streak',
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

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

type BoardTab = 'global' | 'crew';

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function LeaderboardScreen(): React.ReactElement {
  const { playerState } = useExplorationStore();
  const [tab, setTab] = useState<BoardTab>('global');
  const [metric, setMetric] = useState<LeaderboardMetric>('cellsRevealed');

  const flatListRef = useRef<FlatList<LeaderboardEntry>>(null);

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

  // Top-value for ratio calculation (rank 1's value, never 0 to avoid divide-by-zero).
  const topValue = entries.length > 0 ? entries[0].value : 1;
  const safeTopValue = topValue === 0 ? 1 : topValue;

  // Split: top 3 go to PodiumRow, rank 4+ go to FlatList.
  const podiumEntries = entries.filter((e) => e.rank <= 3);
  const hasPodium = podiumEntries.length >= 3;
  const listEntries = hasPodium ? entries.filter((e) => e.rank > 3) : entries;

  // Find the current player's index in the FlatList so we can scroll to them.
  const myIndex = listEntries.findIndex((e) => e.playerId === playerState.playerId);

  // Auto-scroll to current player's row whenever tab or metric changes.
  useEffect(() => {
    if (myIndex >= 0 && flatListRef.current !== null) {
      // Small delay lets the list finish its layout pass before scrolling.
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: myIndex, animated: true });
      }, 100);
      return () => {
        clearTimeout(timer);
      };
    }
    return undefined;
  }, [myIndex, tab, metric]);

  const renderItem = ({ item }: ListRenderItemInfo<LeaderboardEntry>): React.ReactElement => {
    const isCurrentPlayer = item.playerId === playerState.playerId;
    return (
      <RankedBar
        rank={item.rank}
        name={`${item.displayName}${isCurrentPlayer ? ' (you)' : ''}`}
        value={formatValue(metric, item.value)}
        ratio={item.value / safeTopValue}
        isCurrentPlayer={isCurrentPlayer}
        testID={isCurrentPlayer ? 'ranked-bar-you' : `ranked-bar-${item.playerId}`}
      />
    );
  };

  const keyExtractor = (item: LeaderboardEntry): string => item.playerId;

  // Graceful fallback when scrollToIndex fires before layout.
  const onScrollToIndexFailed = (): void => {
    // No-op: if the scroll fails (list not yet laid out), we simply don't scroll.
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Ranks" />

      {/* Controls card: toggle + metric chips + season label */}
      <View style={styles.controlsWrapper}>
        <GameCard style={styles.controlsCard}>
          {/* Global / Crew pill toggle */}
          <View style={styles.togglePill}>
            {(['global', 'crew'] as BoardTab[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.toggleSegment, tab === t && styles.toggleSegmentActive]}
                onPress={() => {
                  setTab(t);
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === t }}
              >
                <Text style={[styles.toggleText, tab === t && styles.toggleTextActive]}>
                  {t === 'global' ? 'Global' : 'Crew'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Metric chips — horizontally scrollable */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {METRICS.map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.chip, metric === m && styles.chipActive]}
                onPress={() => {
                  setMetric(m);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: metric === m }}
              >
                <Text style={[styles.chipText, metric === m && styles.chipTextActive]}>
                  {METRIC_LABELS[m]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Season framing line */}
          <Text style={styles.seasonText}>{"Season 1 · This season's rankings"}</Text>
        </GameCard>
      </View>

      {/* Podium — only when top 3 are present */}
      {hasPodium && (
        <View style={styles.podiumWrapper}>
          <PodiumRow
            entries={podiumEntries.map((e) => ({
              rank: e.rank as 1 | 2 | 3,
              name: e.displayName,
              value: formatValue(metric, e.value),
              you: e.playerId === playerState.playerId,
            }))}
          />
        </View>
      )}

      {/* Ranked bars list */}
      <FlatList
        ref={flatListRef}
        data={listEntries}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onScrollToIndexFailed={onScrollToIndexFailed}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.emptyText}>No players to rank yet.</Text>}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles — all colors from palette / theme; zero hard-coded hex values
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.canvas,
  },
  controlsWrapper: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  controlsCard: {
    gap: spacing.sm,
  },
  togglePill: {
    flexDirection: 'row',
    backgroundColor: palette.surface,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  toggleSegment: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radii.pill,
  },
  toggleSegmentActive: {
    backgroundColor: palette.lumen,
  },
  toggleText: {
    fontFamily: typography.display,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: palette.textMuted,
  },
  toggleTextActive: {
    color: palette.ink,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: palette.cardBorder,
    backgroundColor: palette.card,
  },
  chipActive: {
    borderColor: palette.lumen,
    backgroundColor: `${palette.lumen}22`,
  },
  chipText: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: palette.onCardMuted,
  },
  chipTextActive: {
    color: palette.lumen,
    fontWeight: '600',
  },
  seasonText: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: palette.onCardMuted,
    textAlign: 'center',
  },
  podiumWrapper: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  emptyText: {
    fontFamily: typography.body,
    fontSize: typography.sizes.md,
    color: palette.onCardMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
