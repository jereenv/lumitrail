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
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Polygon, Polyline, type Region } from 'react-native-maps';
import * as Location from 'expo-location';

import { cardShadow, motion, palette, radii, spacing, typography } from '@/app/theme';
import { mapStyle } from '@/app/mapStyle';
import { createCachedReverseGeocoder } from '@/data/location/reverseGeocode';
import { useExplorationStore } from '@/app/store/useExplorationStore';
import { useNavigationStore } from '@/app/store/useNavigationStore';
import {
  EventToast,
  LevelBadge,
  ProgressRing,
  RegionBanner,
  StreakFlame,
  XpBar,
} from '@/presentation/components';
import HudCard from '../components/explore/HudCard';
import CoinsChip from '../components/explore/CoinsChip';
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
  const { focusTarget, clearMapFocus } = useNavigationStore();

  const cells = useMemo(
    () => Array.from(playerState.revealedCells) as H3Index[],
    [playerState.revealedCells],
  );

  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(() => centroidRegion(cells) ?? DEFAULT_REGION);
  const [focusLabel, setFocusLabel] = useState<string | null>(null);

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

  // Fly to a focus target set by another screen (e.g. a region tapped in Journey).
  // clearMapFocus() is called immediately so the store is cleared, but the label
  // is captured into focusLabel state first. The auto-hide timer runs in the
  // separate effect below, keyed on focusLabel — so clearing the store does NOT
  // cancel the hide timer.
  useEffect(() => {
    if (focusTarget && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: focusTarget.latitude,
          longitude: focusTarget.longitude,
          latitudeDelta: focusTarget.latitudeDelta,
          longitudeDelta: focusTarget.longitudeDelta,
        },
        600,
      );
      if (focusTarget.label) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFocusLabel(focusTarget.label);
      }
      clearMapFocus();
    }
  }, [focusTarget, clearMapFocus]);

  // Auto-hide the focus label chip after 2 s. This effect is keyed on focusLabel
  // only, so it is NOT cancelled when clearMapFocus() runs in the effect above.
  const LABEL_HIDE_MS = 2000;
  useEffect(() => {
    if (focusLabel === null) return;
    const timer = setTimeout(() => {
      setFocusLabel(null);
    }, LABEL_HIDE_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [focusLabel]);

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

  // --- Reveal animation: springy scale-pop glow + amber polygon flash. -------
  const [pulseRings, setPulseRings] = useState<Ring[]>([]);
  const smoothedPulseRings = useMemo(() => smoothRings(pulseRings, 2), [pulseRings]);
  const pulseScale = useMemo(() => new Animated.Value(0), []);
  const [pulseAlpha, setPulseAlpha] = useState(0);
  const lastPulsedRef = useRef<readonly H3Index[] | null>(null);

  useEffect(() => {
    const latest = recentEvents[0];
    if (latest?.type === 'cellsRevealed' && latest.cells !== lastPulsedRef.current) {
      lastPulsedRef.current = latest.cells;
      setPulseRings(computeFogGeometry(latest.cells).revealedOutlines);

      // Reset scale to 0, then spring to 1 (scale-pop on the glow overlay).
      pulseScale.setValue(0);
      setPulseAlpha(0.65); // start visible; timer steps it down

      Animated.spring(pulseScale, {
        toValue: 1,
        damping: motion.spring.damping,
        stiffness: motion.spring.stiffness,
        mass: motion.spring.mass,
        useNativeDriver: true, // scale CAN use native driver
      }).start();
    }
  }, [recentEvents, pulseScale]);

  useEffect(() => {
    // Step the alpha down over ~750ms (150ms × 5 steps). setState happens only
    // in the timer callback; the pulse polygons stop rendering once alpha hits 0.
    if (pulseAlpha <= 0) {
      return;
    }
    const timer = setTimeout(() => setPulseAlpha((a) => Math.max(0, a - 0.13)), 150);
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
        {/* Reveal flash on newly uncovered cells (amber fill, JS-driven alpha). */}
        {pulseAlpha > 0 &&
          smoothedPulseRings.map((ring, i) => (
            <Polygon
              key={`pulse-${i}`}
              coordinates={ring}
              // palette.lumen (#FFB74D) with animated alpha — can't use the token
              // string directly here because the alpha varies per frame.
              fillColor={`rgba(255,183,77,${pulseAlpha})`}
              strokeColor={`rgba(255,183,77,${Math.min(1, pulseAlpha + 0.35)})`}
              strokeWidth={3}
              tappable={false}
            />
          ))}
      </MapView>

      {/* Scale-pop glow overlay — springy entrance animation on reveal (native driver). */}
      {pulseAlpha > 0 && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.revealGlow,
            {
              opacity: pulseAlpha * 0.18, // subtle glow, not blinding
              transform: [{ scale: pulseScale }],
            },
          ]}
          pointerEvents="none"
        />
      )}

      {/* HUD — the first thing you see: how much you've uncovered. */}
      <SafeAreaView style={styles.hudWrap} pointerEvents="box-none" edges={['top']}>
        <HudCard>
          <View style={styles.hudTopRow} pointerEvents="none">
            <ProgressRing progress={levelProgress.progress} size={48} strokeWidth={4}>
              <LevelBadge level={levelProgress.level} size="sm" />
            </ProgressRing>
            <View style={styles.hudXp}>
              <XpBar
                progress={levelProgress.progress}
                xpIntoLevel={levelProgress.xpIntoLevel}
                xpForLevelSpan={levelProgress.xpForLevelSpan}
                showLabel
              />
            </View>
            <CoinsChip totalXp={playerState.stats.totalXp} />
            <StreakFlame days={playerState.stats.currentStreakDays} size={32} />
          </View>

          <View style={styles.hudStatsRow} pointerEvents="none">
            <HudStat label="Area" value={`${areaKm2.toFixed(1)} km²`} />
            <HudStat
              label="Distance"
              value={`${(playerState.stats.distanceMeters / 1000).toFixed(1)} km`}
            />
            <HudStat label="Cells" value={`${playerState.stats.cellsRevealed}`} />
          </View>
        </HudCard>
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

      {/* Focus label chip — briefly shows the name of a location flown to from another screen. */}
      {focusLabel !== null && (
        <View style={styles.focusLabelWrap} pointerEvents="none">
          <View style={styles.focusLabelChip}>
            <Text style={styles.focusLabelText}>{focusLabel}</Text>
          </View>
        </View>
      )}

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
    color: palette.onCard,
    fontWeight: '700',
  },
  hudStatLabel: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: palette.onCardMuted,
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
    backgroundColor: palette.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: palette.cardBorder,
    ...cardShadow,
  },
  fabIcon: {
    fontSize: 24,
    color: palette.coral,
  },
  demoFab: {
    backgroundColor: palette.aurora,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    ...cardShadow,
  },
  demoFabDisabled: {
    backgroundColor: palette.cardBorder,
  },
  demoFabText: {
    fontFamily: typography.display,
    fontSize: typography.sizes.sm,
    color: palette.ink,
    fontWeight: '700',
  },
  bannerWrap: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
  },
  revealGlow: {
    backgroundColor: palette.lumen,
    borderRadius: radii.lg,
  },
  focusLabelWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: spacing.xxl + spacing.xl,
    alignItems: 'center',
  },
  focusLabelChip: {
    backgroundColor: palette.card,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: palette.cardBorder,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    ...cardShadow,
  },
  focusLabelText: {
    fontFamily: typography.display,
    fontSize: typography.sizes.md,
    color: palette.onCard,
    fontWeight: '700',
  },
});
