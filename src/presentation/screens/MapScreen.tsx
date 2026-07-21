/**
 * MapScreen — the primary fog-of-war map view.
 *
 * Revealed H3 hexagons are projected from lat/lng into SVG screen space via
 * a simple equirectangular projection centred on the bounding box of all
 * revealed cells. Each hexagon is drawn as a Polygon in react-native-svg.
 *
 * Below the map: XP bar, level badge, streak, and the worldwide exploration %.
 * Recent domain events float as EventToast banners above the map.
 */
import React, { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Polygon, Rect } from 'react-native-svg';

import { palette, radii, spacing, typography } from '@/app/theme';
import { useExplorationStore } from '@/app/store/useExplorationStore';
import { EventToast, LevelBadge, StreakFlame, XpBar } from '@/presentation/components';
import { cellPolygon } from '@/domain/geo/grid';
import type { Coordinates, H3Index } from '@/domain/geo/types';
import { levelForXp } from '@/domain/progression/levels';
import { worldwidePercent } from '@/domain/regions/exploration';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAP_HEIGHT = SCREEN_HEIGHT * 0.5;
const SCALE = 8000;

// ---------------------------------------------------------------------------
// Projection helpers
// ---------------------------------------------------------------------------

function latLngToSvg(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  scale: number,
  svgWidth: number,
  svgHeight: number,
): { x: number; y: number } {
  const x = (lng - centerLng) * scale + svgWidth / 2;
  const y = (centerLat - lat) * scale + svgHeight / 2;
  return { x, y };
}

function coordinatesToPolygonPoints(
  coords: Coordinates[],
  centerLat: number,
  centerLng: number,
): string {
  return coords
    .map(({ latitude, longitude }) => {
      const { x, y } = latLngToSvg(
        latitude,
        longitude,
        centerLat,
        centerLng,
        SCALE,
        SCREEN_WIDTH,
        MAP_HEIGHT,
      );
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

// ---------------------------------------------------------------------------
// Placeholder fog hex grid when no cells are revealed
// ---------------------------------------------------------------------------

function PlaceholderFogGrid(): React.ReactElement {
  const cols = 6;
  const rows = 5;
  const r = 28;
  const dx = r * Math.sqrt(3);
  const dy = r * 1.5;

  const hexes: { points: string; key: string }[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cx = col * dx + (row % 2 === 0 ? 0 : dx / 2) + r;
      const cy = row * dy + r;
      const pts = Array.from({ length: 6 }, (_, i) => {
        const angle = (Math.PI / 180) * (60 * i - 30);
        return `${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`;
      }).join(' ');
      hexes.push({ points: pts, key: `${row}-${col}` });
    }
  }

  return (
    <Svg width={SCREEN_WIDTH} height={MAP_HEIGHT}>
      <Rect x={0} y={0} width={SCREEN_WIDTH} height={MAP_HEIGHT} fill={palette.ink} />
      {hexes.map((h) => (
        <Polygon
          key={h.key}
          points={h.points}
          fill="rgba(30,49,73,0.4)"
          stroke="rgba(30,49,73,0.8)"
          strokeWidth={0.8}
        />
      ))}
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function MapScreen(): React.ReactElement {
  const { playerState, isDemoWalking, runDemoWalk, recentEvents } = useExplorationStore();
  const [dismissedEventIds, setDismissedEventIds] = useState<Set<number>>(new Set());

  const cells = Array.from(playerState.revealedCells) as H3Index[];
  const hasRevealedCells = cells.length > 0;

  // ---------------------------------------------------------------------------
  // Build polygon data for all revealed cells
  // ---------------------------------------------------------------------------

  const cellPolygons: { points: string; key: string }[] = [];
  let totalLat = 0;
  let totalLng = 0;
  let totalCount = 0;

  if (hasRevealedCells) {
    // First pass: collect all vertex coords to compute centre
    const allCoords: Coordinates[] = [];
    const polygonCache = new Map<string, Coordinates[]>();
    for (const cell of cells) {
      const coords = cellPolygon(cell);
      polygonCache.set(cell, coords);
      for (const c of coords) {
        allCoords.push(c);
        totalLat += c.latitude;
        totalLng += c.longitude;
        totalCount += 1;
      }
    }

    const centerLat = totalCount > 0 ? totalLat / totalCount : 0;
    const centerLng = totalCount > 0 ? totalLng / totalCount : 0;

    // Second pass: project to SVG
    for (const cell of cells) {
      const coords = polygonCache.get(cell);
      if (coords === undefined || coords.length === 0) {
        continue;
      }
      const points = coordinatesToPolygonPoints(coords, centerLat, centerLng);
      cellPolygons.push({ points, key: cell });
    }
  }

  // ---------------------------------------------------------------------------
  // XP / level
  // ---------------------------------------------------------------------------
  const levelProgress = levelForXp(playerState.stats.totalXp);
  const worldPct = worldwidePercent(playerState.stats.cellsRevealed);

  // ---------------------------------------------------------------------------
  // Recent toasts (last 3, non-dismissed)
  // ---------------------------------------------------------------------------
  const visibleEvents = recentEvents.filter((_, idx) => !dismissedEventIds.has(idx)).slice(0, 3);

  function dismissEvent(idx: number): void {
    setDismissedEventIds((prev) => new Set([...prev, idx]));
  }

  return (
    <View style={styles.root}>
      {/* ------------------------------------------------------------------ */}
      {/* Map SVG area                                                         */}
      {/* ------------------------------------------------------------------ */}
      <View style={styles.mapContainer}>
        {hasRevealedCells ? (
          <Svg width={SCREEN_WIDTH} height={MAP_HEIGHT}>
            <Rect x={0} y={0} width={SCREEN_WIDTH} height={MAP_HEIGHT} fill={palette.ink} />
            {cellPolygons.map(({ points, key }) => (
              <Polygon
                key={key}
                points={points}
                fill="rgba(56,224,166,0.3)"
                stroke="rgba(56,224,166,0.7)"
                strokeWidth={0.5}
              />
            ))}
          </Svg>
        ) : (
          <PlaceholderFogGrid />
        )}

        {/* Empty-state overlay */}
        {!hasRevealedCells && (
          <View style={styles.emptyOverlay} pointerEvents="none">
            <Text style={styles.emptyTitle}>The world awaits.</Text>
            <Text style={styles.emptySubtitle}>Take a walk to reveal the map!</Text>
          </View>
        )}

        {/* Event toasts — float above the map */}
        {visibleEvents.map((event, idx) => (
          <View
            key={idx}
            style={{ top: spacing.lg + idx * 64, position: 'absolute', left: 0, right: 0 }}
          >
            <EventToast event={event} onDismiss={() => dismissEvent(idx)} />
          </View>
        ))}
      </View>

      {/* ------------------------------------------------------------------ */}
      {/* Stats strip below the map                                           */}
      {/* ------------------------------------------------------------------ */}
      <ScrollView
        style={styles.statsScroll}
        contentContainerStyle={styles.statsContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Level + XP row */}
        <View style={styles.levelRow}>
          <LevelBadge level={levelProgress.level} size="md" />
          <View style={styles.xpBarWrapper}>
            <XpBar
              progress={levelProgress.progress}
              xpIntoLevel={levelProgress.xpIntoLevel}
              xpForLevelSpan={levelProgress.xpForLevelSpan}
              showLabel
            />
            <Text style={styles.levelLabel}>
              Level {levelProgress.level} · {levelProgress.xpToNextLevel} XP to next
            </Text>
          </View>
          <StreakFlame days={playerState.stats.currentStreakDays} size={36} />
        </View>

        {/* Worldwide % stat */}
        <View style={styles.worldRow}>
          <Text style={styles.worldLabel}>World explored</Text>
          <Text style={styles.worldValue}>
            {worldPct < 0.0001 ? worldPct.toExponential(2) : worldPct.toFixed(6)}%
          </Text>
        </View>

        {/* Demo walk button */}
        <TouchableOpacity
          style={[styles.demoButton, isDemoWalking && styles.demoButtonDisabled]}
          onPress={() => {
            void runDemoWalk();
          }}
          disabled={isDemoWalking}
          accessibilityLabel={isDemoWalking ? 'Demo walk in progress' : 'Take a demo walk'}
          accessibilityRole="button"
        >
          <Text style={[styles.demoButtonText, isDemoWalking && styles.demoButtonTextDisabled]}>
            {isDemoWalking ? 'Walking…' : 'Take a demo walk'}
          </Text>
        </TouchableOpacity>
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
  mapContainer: {
    width: SCREEN_WIDTH,
    height: MAP_HEIGHT,
    backgroundColor: palette.ink,
    overflow: 'hidden',
  },
  emptyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: typography.display,
    fontSize: typography.sizes.xl,
    color: palette.text,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontFamily: typography.body,
    fontSize: typography.sizes.md,
    color: palette.textMuted,
  },
  statsScroll: {
    flex: 1,
  },
  statsContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: palette.surface,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  xpBarWrapper: {
    flex: 1,
    gap: spacing.xs,
  },
  levelLabel: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: palette.textMuted,
  },
  worldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  worldLabel: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: palette.textMuted,
  },
  worldValue: {
    fontFamily: typography.display,
    fontSize: typography.sizes.sm,
    color: palette.aurora,
    fontWeight: '600',
  },
  demoButton: {
    backgroundColor: palette.lumen,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  demoButtonDisabled: {
    backgroundColor: palette.surfaceAlt,
  },
  demoButtonText: {
    fontFamily: typography.display,
    fontSize: typography.sizes.md,
    color: palette.ink,
    fontWeight: '700',
  },
  demoButtonTextDisabled: {
    color: palette.textMuted,
  },
});
