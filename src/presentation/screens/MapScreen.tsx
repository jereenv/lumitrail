/**
 * MapScreen — the primary fog-of-war view, drawn on a REAL interactive basemap.
 *
 * A `react-native-maps` MapView renders real streets, roads, and place names and
 * owns the projection (pan/zoom, centred on the user on open). The fog-of-war is
 * a single dark Polygon covering the viewport with a HOLE punched for every
 * explored area (`overlay.holes`), so the real map shows through where you've
 * been. Unexplored pockets fully surrounded by explored land are re-fogged as
 * islands, and freshly revealed cells flash briefly (the reveal animation).
 *
 * All of the fog geometry is computed by the pure, unit-tested
 * `@/domain/geo/fog` module — this file only binds it to the map SDK and the
 * on-map HUD (level, XP, and "% uncovered", shown the moment the map opens).
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Polygon, Polyline, type Region } from 'react-native-maps';
import * as Location from 'expo-location';

import { palette, radii, spacing, typography } from '@/app/theme';
import { mapStyle } from '@/app/mapStyle';
import { createCachedReverseGeocoder } from '@/data/location/reverseGeocode';
import { useExplorationStore } from '@/app/store/useExplorationStore';
import {
  EventToast,
  LevelBadge,
  RegionBanner,
  StreakFlame,
  XpBar,
} from '@/presentation/components';
import { cellCenter } from '@/domain/geo/grid';
import {
  approximateAreaKm2,
  buildFogOverlay,
  computeFogGeometry,
  viewExploredPercent,
  type Ring,
} from '@/domain/geo/fog';
import { smoothRings } from '@/domain/geo/smooth';
import type { H3Index } from '@/domain/geo/types';
import { levelForXp } from '@/domain/progression/levels';

/** Fallback view when we have neither a device fix nor any revealed cells. */
const DEFAULT_REGION: Region = {
  latitude: 59.3293,
  longitude: 18.0686,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

const REVEAL_PULSE_START = 0.55;
const REVEAL_PULSE_STEP = 0.11;

/** One cached geocoder for the app session (expo-location matches the Geocoder shape). */
const lookupLocality = createCachedReverseGeocoder(Location);

/** Ensure a ring is a closed loop so Polyline draws the full boundary. */
function closedRing(ring: Ring): Ring {
  if (ring.length === 0) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first.latitude === last.latitude && first.longitude === last.longitude) return ring;
  return [...ring, first];
}

/** Region centred on the centroid of already-revealed cells, if any. */
function centroidRegion(cells: readonly H3Index[]): Region | null {
  if (cells.length === 0) {
    return null;
  }
  let lat = 0;
  let lng = 0;
  for (const cell of cells) {
    const c = cellCenter(cell);
    lat += c.latitude;
    lng += c.longitude;
  }
  return {
    latitude: lat / cells.length,
    longitude: lng / cells.length,
    latitudeDelta: 0.06,
    longitudeDelta: 0.06,
  };
}

function HudStat({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <View style={styles.hudStat}>
      <Text style={styles.hudStatValue}>{value}</Text>
      <Text style={styles.hudStatLabel}>{label}</Text>
    </View>
  );
}

export default function MapScreen(): React.ReactElement {
  const { playerState, currentLocation, recentEvents, isDemoWalking, runDemoWalk, locateMe } =
    useExplorationStore();

  const cells = useMemo(
    () => Array.from(playerState.revealedCells) as H3Index[],
    [playerState.revealedCells],
  );

  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(() => centroidRegion(cells) ?? DEFAULT_REGION);

  // Centre on the user's real location as soon as it resolves.
  useEffect(() => {
    void locateMe();
  }, [locateMe]);

  useEffect(() => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        600,
      );
    }
  }, [currentLocation]);

  // Fog geometry for the current viewport (pure, memoised).
  const overlay = useMemo(() => buildFogOverlay(region, cells), [region, cells]);

  // Smooth the frontier rings once and reuse across all three render sites (fog, islands, frontier border).
  const smoothedHoles = useMemo(() => smoothRings(overlay.holes, 2), [overlay.holes]);
  const smoothedIslands = useMemo(() => smoothRings(overlay.islands, 2), [overlay.islands]);

  const levelProgress = levelForXp(playerState.stats.totalXp);
  const viewPct = viewExploredPercent(overlay.exploredInView, overlay.estimatedCellsInView);
  const areaKm2 = approximateAreaKm2(playerState.stats.cellsRevealed);

  const [locality, setLocality] = useState<string>('Your area');

  useEffect(() => {
    let cancelled = false;
    void lookupLocality({ latitude: region.latitude, longitude: region.longitude }).then((name) => {
      if (!cancelled && name) setLocality(name);
    });
    return () => {
      cancelled = true;
    };
  }, [region.latitude, region.longitude]);

  // --- Reveal animation: flash newly revealed outlines, then fade out. -------
  const [pulseRings, setPulseRings] = useState<Ring[]>([]);
  const [pulseAlpha, setPulseAlpha] = useState(0);
  const lastPulsedRef = useRef<readonly H3Index[] | null>(null);

  useEffect(() => {
    const latest = recentEvents[0];
    if (latest?.type === 'cellsRevealed' && latest.cells !== lastPulsedRef.current) {
      lastPulsedRef.current = latest.cells;
      setPulseRings(computeFogGeometry(latest.cells).revealedOutlines);
      setPulseAlpha(REVEAL_PULSE_START);
    }
  }, [recentEvents]);

  useEffect(() => {
    // Step the fade down over time. setState happens only in the timer callback
    // (never synchronously in the effect body), and the pulse polygons are
    // rendered only while `pulseAlpha > 0`, so there is no need to clear the
    // rings — stale ones simply stop rendering once the flash finishes.
    if (pulseAlpha <= 0) {
      return;
    }
    const timer = setTimeout(() => setPulseAlpha((a) => Math.max(0, a - REVEAL_PULSE_STEP)), 110);
    return () => clearTimeout(timer);
  }, [pulseAlpha]);

  // --- Toasts ----------------------------------------------------------------
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const visibleEvents = recentEvents
    .map((event, idx) => ({ event, idx }))
    .filter(({ event, idx }) => !dismissed.has(idx) && event.type !== 'xpGained')
    .slice(0, 3);

  return (
    <View style={styles.root}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton={false}
        toolbarEnabled={false}
        loadingEnabled
        loadingBackgroundColor={palette.ink}
        loadingIndicatorColor={palette.lumen}
        customMapStyle={mapStyle}
      >
        {/* The fog: one green-teal polygon over the viewport, holes where explored. */}
        <Polygon
          coordinates={overlay.outer}
          holes={smoothedHoles}
          fillColor={palette.fog}
          strokeColor="transparent"
          strokeWidth={0}
          tappable={false}
        />
        {/* Fog islands: unexplored pockets surrounded by explored land. */}
        {smoothedIslands.map((ring, i) => (
          <Polygon
            key={`island-${i}`}
            coordinates={ring}
            fillColor={palette.fog}
            strokeColor="transparent"
            strokeWidth={0}
            tappable={false}
          />
        ))}
        {/* Dashed frontier border tracing the edge of explored land. */}
        {[...smoothedHoles, ...smoothedIslands].map((ring, i) => {
          const path = closedRing(ring);
          return (
            <React.Fragment key={`frontier-${i}`}>
              <Polyline coordinates={path} strokeColor={palette.frontierCasing} strokeWidth={6} />
              <Polyline
                coordinates={path}
                strokeColor={palette.frontier}
                strokeWidth={3}
                lineDashPattern={[10, 8]}
              />
            </React.Fragment>
          );
        })}
        {/* Reveal flash on newly uncovered cells. */}
        {pulseAlpha > 0 &&
          smoothRings(pulseRings, 2).map((ring, i) => (
            <Polygon
              key={`pulse-${i}`}
              coordinates={ring}
              fillColor={`rgba(255,183,77,${pulseAlpha})`}
              strokeColor={`rgba(255,183,77,${Math.min(1, pulseAlpha + 0.35)})`}
              strokeWidth={2}
              tappable={false}
            />
          ))}
      </MapView>

      {/* HUD — the first thing you see: how much you've uncovered. */}
      <SafeAreaView style={styles.hudWrap} pointerEvents="box-none" edges={['top']}>
        <View style={styles.hud} pointerEvents="none">
          <View style={styles.hudTopRow}>
            <LevelBadge level={levelProgress.level} size="md" />
            <View style={styles.hudXp}>
              <XpBar
                progress={levelProgress.progress}
                xpIntoLevel={levelProgress.xpIntoLevel}
                xpForLevelSpan={levelProgress.xpForLevelSpan}
                showLabel
              />
            </View>
            <StreakFlame days={playerState.stats.currentStreakDays} size={32} />
          </View>

          <View style={styles.hudStatsRow}>
            <HudStat label="Area" value={`${areaKm2.toFixed(1)} km²`} />
            <HudStat
              label="Distance"
              value={`${(playerState.stats.distanceMeters / 1000).toFixed(1)} km`}
            />
            <HudStat label="Cells" value={`${playerState.stats.cellsRevealed}`} />
          </View>
        </View>
      </SafeAreaView>

      {/* Event toasts */}
      <View style={styles.toastColumn} pointerEvents="box-none">
        {visibleEvents.map(({ event, idx }) => (
          <EventToast
            key={idx}
            event={event}
            onDismiss={() => setDismissed((prev) => new Set([...prev, idx]))}
          />
        ))}
      </View>

      {/* Floating action buttons */}
      <View style={styles.fabColumn} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            void locateMe();
          }}
          accessibilityLabel="Centre the map on my location"
          accessibilityRole="button"
        >
          <Text style={styles.fabIcon}>◎</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.demoFab, isDemoWalking && styles.demoFabDisabled]}
          onPress={() => {
            void runDemoWalk();
          }}
          disabled={isDemoWalking}
          accessibilityLabel={isDemoWalking ? 'Demo walk in progress' : 'Take a demo walk'}
          accessibilityRole="button"
        >
          <Text style={styles.demoFabText}>{isDemoWalking ? 'Walking…' : 'Demo walk'}</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom region banner: where you are + how much of the view is uncovered. */}
      <SafeAreaView style={styles.bannerWrap} pointerEvents="box-none" edges={['bottom']}>
        <RegionBanner locality={locality} percent={viewPct} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.ink,
  },
  hudWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  hud: {
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(15,27,45,0.82)',
    gap: spacing.sm,
  },
  hudTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  hudXp: {
    flex: 1,
  },
  hudStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hudStat: {
    alignItems: 'center',
    flex: 1,
  },
  hudStatValue: {
    fontFamily: typography.display,
    fontSize: typography.sizes.md,
    color: palette.text,
    fontWeight: '700',
  },
  hudStatLabel: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: palette.textMuted,
  },
  toastColumn: {
    position: 'absolute',
    top: 190,
    left: 0,
    right: 0,
    gap: spacing.sm,
  },
  fabColumn: {
    position: 'absolute',
    right: spacing.md,
    // Sit clear above the bottom region banner so the Demo-walk button is not
    // overlapped by it.
    bottom: spacing.xxl * 2,
    alignItems: 'flex-end',
    gap: spacing.md,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.surfaceAlt,
  },
  fabIcon: {
    fontSize: 24,
    color: palette.lumen,
  },
  demoFab: {
    backgroundColor: palette.lumen,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  demoFabDisabled: {
    backgroundColor: palette.surfaceAlt,
  },
  demoFabText: {
    fontFamily: typography.display,
    fontSize: typography.sizes.md,
    color: palette.ink,
    fontWeight: '700',
  },
  bannerWrap: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
  },
});
