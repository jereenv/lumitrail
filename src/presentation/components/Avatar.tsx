/**
 * Avatar — a round identity bubble for a player.
 *
 * If an `imageUri` is supplied it renders that photo; otherwise it falls back
 * to the uppercased first initial of the player's `name` on a coral bubble.
 * When a `level` is provided the bubble gains a coral ring and a small badge
 * in the bottom-right corner showing the level number — the leaderboard and
 * friends screens use this to convey standing at a glance.
 */
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { palette, radii, typography } from '@/app/theme';

interface AvatarProps {
  name: string;
  /** When set, draws a coral ring and a level badge. */
  level?: number;
  /** Diameter of the bubble in dp. Defaults to 48. */
  size?: number;
  /** When set, renders this image instead of the name initial. */
  imageUri?: string;
}

function initialOf(name: string): string {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() : '?';
}

export default function Avatar({
  name,
  level,
  size = 48,
  imageUri,
}: AvatarProps): React.ReactElement {
  const ringWidth = level !== undefined ? 2 : 0;
  const badgeSize = Math.max(16, Math.round(size * 0.38));

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <View
        style={[
          styles.bubble,
          {
            width: size,
            height: size,
            borderRadius: radii.pill,
            borderWidth: ringWidth,
          },
        ]}
      >
        {imageUri !== undefined ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            accessibilityLabel={`${name} avatar`}
          />
        ) : (
          <Text style={[styles.initial, { fontSize: Math.round(size * 0.42) }]}>
            {initialOf(name)}
          </Text>
        )}
      </View>

      {level !== undefined && (
        <View
          style={[styles.badge, { width: badgeSize, height: badgeSize, borderRadius: radii.pill }]}
        >
          <Text style={[styles.badgeText, { fontSize: Math.round(badgeSize * 0.55) }]}>
            {level}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  bubble: {
    backgroundColor: palette.coral,
    borderColor: palette.coral,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initial: {
    fontFamily: typography.display,
    fontWeight: '700',
    color: palette.card,
  },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    backgroundColor: palette.coral,
    borderWidth: 1.5,
    borderColor: palette.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: typography.display,
    fontWeight: '700',
    color: palette.card,
  },
});
