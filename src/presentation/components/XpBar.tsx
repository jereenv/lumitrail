/**
 * XpBar — a horizontal progress bar showing XP progress within the current level.
 *
 * The filled track uses `palette.lumen` (warm amber) with a subtle brightness
 * boost at the leading edge to simulate the "trail of light" brand motif. The
 * dark unfilled track is `palette.surface`, giving good contrast on the
 * `palette.ink` screen background.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { palette, spacing, typography } from '@/app/theme';

interface XpBarProps {
  /** Fractional fill from 0 (empty) to 1 (full). */
  progress: number;
  /** Raw XP accumulated in the current level. */
  xpIntoLevel: number;
  /** Total XP needed to complete this level (level span). */
  xpForLevelSpan: number;
  /** Track height in dp. Defaults to 8. */
  height?: number;
  /** Whether to render the "{xpIntoLevel} / {xpForLevelSpan} XP" label. */
  showLabel?: boolean;
}

export default function XpBar({
  progress,
  xpIntoLevel,
  xpForLevelSpan,
  height = 8,
  showLabel = true,
}: XpBarProps): React.ReactElement {
  // Clamp progress to [0, 1] so the bar never overflows its track.
  const clamped = Math.min(1, Math.max(0, progress));

  return (
    <View style={styles.wrapper}>
      {/* Track */}
      <View style={[styles.track, { height }]}>
        {/* Filled portion */}
        <View
          style={[
            styles.fill,
            {
              width: `${clamped * 100}%`,
              height,
              borderRadius: height / 2,
            },
          ]}
        >
          {/* Glow highlight at the leading edge */}
          <View
            style={[
              styles.glowEdge,
              {
                width: height * 1.5,
                height,
                borderRadius: height / 2,
              },
            ]}
          />
        </View>
      </View>

      {showLabel && (
        <Text style={styles.label}>
          {xpIntoLevel} / {xpForLevelSpan} XP
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  track: {
    backgroundColor: palette.surface,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    backgroundColor: palette.lumen,
    position: 'relative',
    overflow: 'hidden',
  },
  glowEdge: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: palette.lumenBright,
    opacity: 0.6,
  },
  label: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: palette.textMuted,
    textAlign: 'right',
  },
});
