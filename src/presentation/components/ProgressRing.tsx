/**
 * ProgressRing — a circular progress indicator rendered entirely in SVG.
 *
 * It draws two `<Circle>` elements sharing the same centre:
 *   1. A background ring (full circumference, dimmer colour).
 *   2. A progress arc that uses `strokeDasharray` + `strokeDashoffset` to show
 *      only the filled fraction.
 *
 * Children are absolutely centred inside the ring, so you can drop a level
 * number or percentage text in without any extra layout work.
 *
 * Note on `strokeDasharray`: the circumference of a circle is 2πr. Setting
 * `strokeDasharray` to exactly the circumference and then adjusting
 * `strokeDashoffset` from 0 (full) to circumference (empty) produces a clean
 * partial arc — this is the canonical CSS/SVG trick and it works identically in
 * react-native-svg.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Circle, Svg } from 'react-native-svg';

import { palette } from '@/app/theme';

interface ProgressRingProps {
  /** Fractional fill from 0 (empty) to 1 (full). */
  progress: number;
  /** Outer diameter of the ring in dp. Defaults to 64. */
  size?: number;
  /** Stroke width in dp. Defaults to 6. */
  strokeWidth?: number;
  /** Arc colour. Defaults to `palette.lumen`. */
  color?: string;
  /** Background ring colour. Defaults to `palette.surfaceAlt`. */
  backgroundColor?: string;
  children?: React.ReactNode;
}

export default function ProgressRing({
  progress,
  size = 64,
  strokeWidth = 6,
  color = palette.lumen,
  backgroundColor = palette.surfaceAlt,
  children,
}: ProgressRingProps): React.ReactElement {
  const clamped = Math.min(1, Math.max(0, progress));
  const radius = (size - strokeWidth) / 2;
  const centre = size / 2;
  const circumference = 2 * Math.PI * radius;
  // Offset 0 = full arc visible; circumference = none visible.
  const offset = circumference * (1 - clamped);

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {/* Background ring */}
        <Circle
          cx={centre}
          cy={centre}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc — rotated so it starts at the top (−90°) */}
        <Circle
          cx={centre}
          cy={centre}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${centre}, ${centre}`}
        />
      </Svg>

      {/* Centred children (e.g. a number label) */}
      {children !== undefined && (
        <View style={styles.children} pointerEvents="none">
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  children: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
