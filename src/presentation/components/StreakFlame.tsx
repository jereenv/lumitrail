/**
 * StreakFlame — a compact streak indicator showing a flame emoji and the
 * current day count.
 *
 * When the streak is active the count glows in `palette.lumen`. When it has
 * lapsed (days === 0 or active === false) the component dims to `palette.textMuted`
 * to communicate the loss without being harsh.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { palette, typography } from '@/app/theme';

interface StreakFlameProps {
  days: number;
  /** Flame container size in dp. Defaults to 32. */
  size?: number;
  /** Whether the streak is currently active. Defaults to true. */
  active?: boolean;
}

export default function StreakFlame({
  days,
  size = 32,
  active = true,
}: StreakFlameProps): React.ReactElement {
  const isActive = active && days > 0;
  const color = isActive ? palette.coral : palette.onCardMuted;
  const emojiSize = size * 0.65;
  const countSize = size * 0.45;

  return (
    <View style={[styles.container, { height: size }]}>
      <Text style={[styles.flame, { fontSize: emojiSize, lineHeight: size }]}>🔥</Text>
      <Text style={[styles.count, { color, fontSize: countSize }]}>{days}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  flame: {
    // lineHeight set inline to match container height and prevent clipping
  },
  count: {
    fontFamily: typography.display,
    fontWeight: '700',
  },
});
