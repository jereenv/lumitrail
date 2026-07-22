/**
 * StatsScreen — exploration dashboard.
 *
 * Shows summary stat cards, level/XP progress, streak info, and a
 * region-by-region breakdown sorted by exploration percentage.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { palette, radii, spacing, typography } from '@/app/theme';
import { useExplorationStore } from '@/app/store/useExplorationStore';
import { useNavigationStore } from '@/app/store/useNavigationStore';
import {
  LevelBadge,
  ProgressRing,
  ScreenHeader,
  StreakFlame,
  XpBar,
} from '@/presentation/components';
import { levelForXp } from '@/domain/progression/levels';
import { regionCompletion, worldwidePercent } from '@/domain/regions/exploration';
import { regionCenter } from '@/domain/regions/resolver';
import type { RegionTally } from '@/domain/loop/state';
import JourneyHero from '@/presentation/components/journey/JourneyHero';
import StatTile from '@/presentation/components/journey/StatTile';
import RegionCard, { type RegionRow } from '@/presentation/components/journey/RegionCard';

const MAX_REGIONS = 10;

function buildRegionRows(regions: ReadonlyMap<string, RegionTally>): RegionRow[] {
  const rows: RegionRow[] = [];
  regions.forEach((tally, id) => {
    const completion = regionCompletion(tally.ref, tally.revealedCells);
    rows.push({ id, tally, percent: completion.percent });
  });
  rows.sort((a, b) => b.percent - a.percent);
  return rows.slice(0, MAX_REGIONS);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionLabel({ title }: { title: string }): React.ReactElement {
  return <Text style={styles.sectionLabel}>{title}</Text>;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function StatsScreen(): React.ReactElement {
  const { playerState } = useExplorationStore();
  const { stats, streak } = playerState;
  const focusMap = useNavigationStore((s) => s.focusMap);

  const levelProgress = levelForXp(stats.totalXp);

  const streakProgress =
    stats.longestStreakDays === 0
      ? 0
      : Math.min(1, stats.currentStreakDays / stats.longestStreakDays);

  const regionRows = buildRegionRows(playerState.regions);

  const handleRegionPress = (row: RegionRow): void => {
    const c = regionCenter(row.tally.ref.id);
    if (c !== null) {
      focusMap({ ...c, label: row.tally.ref.name });
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Your Exploration" subtitle="Walk the world out of the fog." />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ---------------------------------------------------------------- */}
        {/* Hero section                                                      */}
        {/* ---------------------------------------------------------------- */}
        <JourneyHero
          displayName={playerState.displayName}
          level={levelProgress.level}
          worldPercent={worldwidePercent(stats.cellsRevealed)}
        />

        {/* ---------------------------------------------------------------- */}
        {/* Stat tiles — 8-tile 2×4 animated count-up grid                  */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.statsGrid}>
          <StatTile
            label="Cells revealed"
            value={stats.cellsRevealed}
            icon="⬡"
            accent={palette.aurora}
            style={styles.statTile}
          />
          <StatTile
            label="Distance"
            value={stats.distanceMeters / 1000}
            format={(n) => `${n.toFixed(1)} km`}
            icon="📍"
            accent={palette.lumen}
            style={styles.statTile}
          />
          <StatTile
            label="Area"
            value={stats.cellsRevealed * 0.105}
            format={(n) => `${n.toFixed(1)} km²`}
            icon="◼"
            accent={palette.aurora}
            style={styles.statTile}
          />
          <StatTile
            label="Countries"
            value={stats.countriesVisited}
            icon="🌍"
            accent={palette.sky}
            style={styles.statTile}
          />
          <StatTile
            label="Cities"
            value={stats.citiesVisited}
            icon="🏙"
            accent={palette.berry}
            style={styles.statTile}
          />
          <StatTile
            label="Active days"
            value={stats.activeDays}
            icon="📅"
            accent={palette.lumen}
            style={styles.statTile}
          />
          <StatTile
            label="Streak"
            value={stats.currentStreakDays}
            icon="🔥"
            accent={palette.coral}
            style={styles.statTile}
          />
          <StatTile
            label="Coins"
            value={Math.floor(stats.totalXp / 10)}
            icon="🪙"
            accent={palette.lumen}
            style={styles.statTile}
          />
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Level & XP section                                               */}
        {/* ---------------------------------------------------------------- */}
        <SectionLabel title="Level &amp; XP" />
        <View style={styles.card}>
          <View style={styles.levelRow}>
            <LevelBadge level={levelProgress.level} size="lg" />
            <View style={styles.levelDetails}>
              <Text style={styles.levelText}>
                Level {levelProgress.level} · {levelProgress.xpToNextLevel} XP to next level
              </Text>
              <XpBar
                progress={levelProgress.progress}
                xpIntoLevel={levelProgress.xpIntoLevel}
                xpForLevelSpan={levelProgress.xpForLevelSpan}
                height={10}
                showLabel
              />
            </View>
          </View>
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Streak section                                                    */}
        {/* ---------------------------------------------------------------- */}
        <SectionLabel title="Streak" />
        <View style={styles.card}>
          <View style={styles.streakRow}>
            <ProgressRing progress={streakProgress} size={80} strokeWidth={7} color={palette.lumen}>
              <StreakFlame days={stats.currentStreakDays} size={24} />
            </ProgressRing>
            <View style={styles.streakDetails}>
              <Text style={styles.streakCurrent}>
                {stats.currentStreakDays} day{stats.currentStreakDays !== 1 ? 's' : ''} current
                streak
              </Text>
              <Text style={styles.streakLongest}>
                Best: {stats.longestStreakDays} day{stats.longestStreakDays !== 1 ? 's' : ''}
              </Text>
              <Text style={styles.streakSince}>
                Last active day:{' '}
                {streak.lastActiveDay !== null
                  ? new Date(streak.lastActiveDay * 86400000).toLocaleDateString()
                  : 'never'}
              </Text>
            </View>
          </View>
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Region breakdown                                                  */}
        {/* ---------------------------------------------------------------- */}
        <SectionLabel title="Regions Explored" />
        {regionRows.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.emptyRegions}>
              Explore new places to see region breakdown here.
            </Text>
          </View>
        ) : (
          <View style={styles.regionList}>
            {regionRows.map((row) => (
              <RegionCard
                key={row.id}
                row={row}
                onPress={() => handleRegionPress(row)}
                testID={`region-card-${row.id}`}
              />
            ))}
          </View>
        )}

        {/* Extra bottom padding so content clears tab bar */}
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statTile: {
    flex: 1,
    minWidth: '45%',
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  levelDetails: {
    flex: 1,
    gap: spacing.sm,
  },
  levelText: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: palette.textMuted,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  streakDetails: {
    flex: 1,
    gap: spacing.xs,
  },
  streakCurrent: {
    fontFamily: typography.display,
    fontSize: typography.sizes.md,
    color: palette.lumen,
    fontWeight: '700',
  },
  streakLongest: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: palette.textMuted,
  },
  streakSince: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: palette.textMuted,
  },
  regionList: {
    gap: spacing.sm,
  },
  emptyRegions: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: palette.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  bottomPad: {
    height: spacing.xxl,
  },
});
