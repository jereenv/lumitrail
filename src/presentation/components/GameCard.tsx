/**
 * GameCard — the standard surface for grouped content across the app.
 *
 * It renders a soft cream card with a rounded border and the shared drop
 * shadow. When an `onPress` handler is supplied the card becomes interactive:
 * it wraps its content in a `Pressable` and gently scales down while held, an
 * affordance driven by the shared `motion.spring` config via the `Animated`
 * API. An optional `accent` colour paints a thin stripe down the left edge to
 * categorise the card (e.g. coral for "you", aurora for progress).
 *
 * The `style` prop is merged onto the card container so callers can tweak
 * layout (margins, width) without forking the component, and `testID` is
 * forwarded to the root so tests can target the pressable/container directly.
 */
import React, { useState } from 'react';
import { Animated, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { cardShadow, motion, palette, radii, spacing } from '@/app/theme';

interface GameCardProps {
  children: React.ReactNode;
  /** When provided, the card becomes pressable and animates on touch. */
  onPress?: () => void;
  /** Optional palette colour for a left accent stripe. */
  accent?: string;
  style?: ViewStyle;
  testID?: string;
}

export default function GameCard({
  children,
  onPress,
  accent,
  style,
  testID,
}: GameCardProps): React.ReactElement {
  // A persistent Animated.Value survives re-renders via lazy useState so the
  // spring animates from its current position rather than resetting each
  // render. (A lazy initialiser means `new Animated.Value(1)` runs only once.)
  const [scale] = useState(() => new Animated.Value(1));

  const animateTo = (toValue: number): void => {
    Animated.spring(scale, {
      toValue,
      damping: motion.spring.damping,
      stiffness: motion.spring.stiffness,
      mass: motion.spring.mass,
      useNativeDriver: true,
    }).start();
  };

  const content = (
    <>
      {accent !== undefined && (
        <View style={[styles.accent, { backgroundColor: accent }]} pointerEvents="none" />
      )}
      {children}
    </>
  );

  if (onPress === undefined) {
    return (
      <View testID={testID} style={[styles.card, style]}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      onPressIn={() => {
        animateTo(0.97);
      }}
      onPressOut={() => {
        animateTo(1);
      }}
      accessibilityRole="button"
    >
      <Animated.View style={[styles.card, { transform: [{ scale }] }, style]}>
        {content}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    padding: spacing.md,
    overflow: 'hidden',
    ...cardShadow,
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: spacing.xs,
  },
});
