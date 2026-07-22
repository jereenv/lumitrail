/**
 * OnboardingScreen — 3-slide introduction to Lumitrail.
 *
 * Slides walk the user through the fog-of-war concept, how hexagons reveal,
 * and an honest explanation of why we need location permissions. The final
 * slide calls `onComplete` to hand control back to the app shell.
 */
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Svg, { Polygon, Rect } from 'react-native-svg';

import { cardShadow, palette, radii, spacing, typography } from '@/app/theme';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Slide 1: decorative hex grid
// ---------------------------------------------------------------------------

/** Flat-top hexagon centre points for a decorative background grid. */
const HEX_CENTRES: { cx: number; cy: number; lit: boolean }[] = [
  { cx: 80, cy: 160, lit: true },
  { cx: 160, cy: 120, lit: true },
  { cx: 240, cy: 160, lit: false },
  { cx: 320, cy: 120, lit: true },
  { cx: 80, cy: 240, lit: false },
  { cx: 160, cy: 200, lit: false },
  { cx: 240, cy: 240, lit: true },
  { cx: 320, cy: 200, lit: false },
  { cx: 120, cy: 300, lit: true },
  { cx: 200, cy: 260, lit: true },
  { cx: 280, cy: 300, lit: false },
];

function hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 30);
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
}

function HeroHexGrid(): React.ReactElement {
  return (
    <Svg width={SCREEN_WIDTH} height={340}>
      <Rect x={0} y={0} width={SCREEN_WIDTH} height={340} fill="none" />
      {HEX_CENTRES.map((h) => (
        <Polygon
          key={`${h.cx}-${h.cy}`}
          points={hexPoints(h.cx, h.cy, 44)}
          fill={h.lit ? 'rgba(255,122,102,0.18)' : 'rgba(111,224,176,0.20)'}
          stroke={h.lit ? 'rgba(255,122,102,0.55)' : 'rgba(111,224,176,0.45)'}
          strokeWidth={1.5}
        />
      ))}
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Individual slides
// ---------------------------------------------------------------------------

function Slide1(): React.ReactElement {
  return (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <View style={styles.heroGraphic}>
        <HeroHexGrid />
      </View>
      <View style={styles.slideContent}>
        <Text style={styles.heroTitle}>Walk the world{'\n'}out of the fog.</Text>
        <Text style={styles.tagline}>
          Every step you take lifts the darkness from the map — one glowing hexagon at a time.
        </Text>
      </View>
    </View>
  );
}

function Slide2(): React.ReactElement {
  return (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <View style={styles.slideIconRow}>
        <Text style={styles.bigEmoji}>🗺️</Text>
      </View>
      <View style={styles.slideContent}>
        <Text style={styles.slideTitle}>Your trail of light.</Text>
        <Text style={styles.slideBody}>
          The world starts as a blank fog. As you walk, your GPS traces a path and reveals the
          hexagonal cells beneath your feet.
        </Text>
        <Text style={styles.slideBody}>
          Each cell is roughly 0.1 km². Visit new neighbourhoods, parks, cities, and countries to
          paint more of the world in light.
        </Text>
        <View style={styles.featureList}>
          <Text style={styles.featureItem}>⬡ Hexagonal cells that cover the globe</Text>
          <Text style={styles.featureItem}>📍 Distance and region tracking</Text>
          <Text style={styles.featureItem}>🏆 Achievements &amp; streaks</Text>
          <Text style={styles.featureItem}>📊 Live XP &amp; level progression</Text>
        </View>
      </View>
    </View>
  );
}

function Slide3({ onComplete }: { onComplete: () => void }): React.ReactElement {
  return (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <View style={styles.slideIconRow}>
        <Text style={styles.bigEmoji}>🔒</Text>
      </View>
      <View style={styles.slideContent}>
        <Text style={styles.slideTitle}>Your data stays yours.</Text>
        <Text style={styles.slideBody}>
          We need <Text style={styles.highlight}>location access</Text> while you explore. Your data
          is stored locally on your device first — we only sync to our servers when you choose to.
        </Text>
        <Text style={styles.slideBody}>
          <Text style={styles.highlight}>Background location</Text> lets us log your walks even when
          the app is minimised, so you never miss a step. You can turn this off at any time in
          Settings.
        </Text>
        <Text style={styles.slideBody}>
          You control sync. You can export or delete all your data from Settings.
        </Text>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={onComplete}
          accessibilityLabel="Start Exploring — enter the app"
          accessibilityRole="button"
        >
          <Text style={styles.ctaButtonText}>Start Exploring</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function OnboardingScreen({
  onComplete,
}: OnboardingScreenProps): React.ReactElement {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const TOTAL = 3;

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>): void {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentIndex(index);
  }

  function goToSlide(index: number): void {
    scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    setCurrentIndex(index);
  }

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        <Slide1 />
        <Slide2 />
        <Slide3 onComplete={onComplete} />
      </ScrollView>

      {/* Pagination dots */}
      <View style={styles.dotsRow}>
        {Array.from({ length: TOTAL }, (_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => goToSlide(i)}
            accessibilityLabel={`Go to slide ${i + 1}`}
            accessibilityRole="button"
          >
            <View
              style={[styles.dot, i === currentIndex ? styles.dotActive : styles.dotInactive]}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Next button — hidden on last slide (it has its own CTA) */}
      {currentIndex < TOTAL - 1 && (
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => goToSlide(currentIndex + 1)}
          accessibilityLabel="Next slide"
          accessibilityRole="button"
        >
          <Text style={styles.nextButtonText}>Next →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.canvas,
  },
  slide: {
    flex: 1,
    height: SCREEN_HEIGHT,
    backgroundColor: palette.canvas,
    alignItems: 'center',
  },
  heroGraphic: {
    width: SCREEN_WIDTH,
    height: 340,
    overflow: 'hidden',
  },
  slideIconRow: {
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  bigEmoji: {
    fontSize: 80,
  },
  slideContent: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    alignItems: 'center',
  },
  heroTitle: {
    fontFamily: typography.display,
    fontSize: typography.sizes.xxl,
    color: palette.coral,
    textAlign: 'center',
    fontWeight: '700',
    lineHeight: 48,
    marginBottom: spacing.md,
  },
  tagline: {
    fontFamily: typography.body,
    fontSize: typography.sizes.md,
    color: palette.onCardMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  slideTitle: {
    fontFamily: typography.display,
    fontSize: typography.sizes.xl,
    color: palette.onCard,
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  slideBody: {
    fontFamily: typography.body,
    fontSize: typography.sizes.md,
    color: palette.onCardMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  highlight: {
    color: palette.coral,
    fontWeight: '600',
  },
  featureList: {
    alignSelf: 'stretch',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  featureItem: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: palette.onCard,
    lineHeight: 22,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: palette.coral,
    width: 24,
  },
  dotInactive: {
    backgroundColor: palette.cardBorder,
  },
  nextButton: {
    position: 'absolute',
    bottom: 48,
    right: spacing.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: palette.coral,
    backgroundColor: palette.card,
    ...cardShadow,
  },
  nextButtonText: {
    fontFamily: typography.display,
    fontSize: typography.sizes.sm,
    color: palette.coral,
    fontWeight: '600',
  },
  ctaButton: {
    marginTop: spacing.xl,
    alignSelf: 'stretch',
    backgroundColor: palette.coral,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...cardShadow,
  },
  ctaButtonText: {
    fontFamily: typography.display,
    fontSize: typography.sizes.md,
    color: palette.card,
    fontWeight: '700',
  },
});
