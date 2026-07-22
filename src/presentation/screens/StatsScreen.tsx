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
import {
  LevelBadge,
  ProgressRing,
  ScreenHeader,
  StatCard,
  StreakFlame,
  XpBar,
} from '@/presentation/components';
import { levelForXp } from '@/domain/progression/levels';
import { regionCompletion, worldwidePercent } from '@/domain/regions/exploration';
import type { RegionTally } from '@/domain/loop/state';
import JourneyHero from '@/presentation/components/journey/JourneyHero';

const MAX_REGIONS = 10;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface RegionRow {
  id: string;
  tally: RegionTally;
  percent: number;
}

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

interface RegionBarProps {
  row: RegionRow;
}

function RegionBar({ row }: RegionBarProps): React.ReactElement {
  const { ref, revealedCells } = row.tally;
  const pct = Math.min(100, Math.max(0, row.percent));

  return (
    <View style={styles.regionRow}>
      <View style={styles.regionHeader}>
        <Text style={styles.regionName} numberOfLines={1}>
          {ref.name}
        </Text>
        <View style={styles.regionMeta}>
          <Text style={styles.regionKindBadge}>{ref.kind}</Text>
          <Text style={styles.regionPct}>{pct.toFixed(1)}%</Text>
        </View>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.regionCells}>
        {revealedCells} / {ref.targetCells} cells
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function StatsScreen(): React.ReactElement {
  const { playerState } = useExplorationStore();
  const { stats, streak } = playerState;

  const levelProgress = levelForXp(stats.totalXp);

  const streakProgress =
    stats.longestStreakDays === 0
      ? 0
      : Math.min(1, stats.currentStreakDays / stats.longestStreakDays);

  const regionRows = buildRegionRows(playerState.regions);

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
        {/* Big stats row                                                     */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.statsGrid}>
          <StatCard
            label="Cells revealed"
            value={stats.cellsRevealed}
            icon="⬡"
            accent={palette.aurora}
            style={styles.statCard}
          />
          <StatCard
            label="Distance"
            value={`${(stats.distanceMeters / 1000).toFixed(1)} km`}
            icon="📍"
            accent={palette.lumen}
            style={styles.statCard}
          />
          <StatCard
            label="Countries"
            value={stats.countriesVisited}
            icon="🌍"
            accent={palette.sky}
            style={styles.statCard}
          />
          <StatCard
            label="Active days"
            value={stats.activeDays}
            icon="📅"
            accent={palette.aurora}
            style={styles.statCard}
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
          <View style={styles.card}>
            {regionRows.map((row) => (
              <RegionBar key={row.id} row={row} />
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
  statCard: {
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
  regionRow: {
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.surfaceAlt,
  },
  regionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  regionName: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: palette.text,
    flex: 1,
  },
  regionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  regionKindBadge: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: palette.textMuted,
    backgroundColor: palette.surfaceAlt,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  regionPct: {
    fontFamily: typography.display,
    fontSize: typography.sizes.sm,
    color: palette.aurora,
    fontWeight: '600',
  },
  progressTrack: {
    height: 4,
    backgroundColor: palette.surfaceAlt,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: palette.aurora,
    borderRadius: 2,
  },
  regionCells: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: palette.textMuted,
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
