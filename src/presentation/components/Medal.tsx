/**
 * Medal — a circular award disc for one of four tiers.
 *
 * Unlocked medals show the tier's brand colour with a subtle inner "shine"
 * highlight. Locked medals are dimmed (via opacity, so we avoid inventing new
 * colours) and, when a `progress` fraction is supplied, wrap the disc in a
 * `ProgressRing` so the player can see how close they are to earning it.
 *
 * The accessibility label announces both the tier and the locked/unlocked
 * state, which is also what the tests assert against (never the colour).
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { palette, radii, tierColors, typography } from '@/app/theme';
import ProgressRing from './ProgressRing';

type Tier = keyof typeof tierColors;

interface MedalProps {
  tier: Tier;
  /** Outer diameter in dp. Defaults to 56. */
  size?: number;
  /** Dim/desaturate the medal to show it is not yet earned. */
  locked?: boolean;
  /** Fractional progress (0..1) shown as a ring when locked. */
  progress?: number;
}

const TIER_SYMBOL: Record<Tier, string> = {
  bronze: '3',
  silver: '2',
  gold: '1',
  platinum: '★',
};

export default function Medal({
  tier,
  size = 56,
  locked = false,
  progress,
}: MedalProps): React.ReactElement {
  const tierColor = tierColors[tier];
  const showRing = locked && progress !== undefined;
  // Leave room for the ring stroke so the disc sits inside it.
  const ringStroke = Math.max(4, Math.round(size * 0.09));
  const discSize = showRing ? size - ringStroke * 2 : size;

  const disc = (
    <View
      style={[
        styles.disc,
        {
          width: discSize,
          height: discSize,
          borderRadius: radii.pill,
          backgroundColor: tierColor,
          opacity: locked ? 0.35 : 1,
        },
      ]}
    >
      {!locked && <View style={styles.shine} pointerEvents="none" />}
      <Text style={[styles.symbol, { fontSize: Math.round(discSize * 0.4) }]}>
        {TIER_SYMBOL[tier]}
      </Text>
    </View>
  );

  return (
    <View
      accessible
      accessibilityLabel={`${tier} medal - ${locked ? 'locked' : 'unlocked'}`}
      style={[styles.wrapper, { width: size, height: size }]}
    >
      {showRing ? (
        <ProgressRing progress={progress} size={size} strokeWidth={ringStroke} color={tierColor}>
          {disc}
        </ProgressRing>
      ) : (
        disc
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disc: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  shine: {
    position: 'absolute',
    top: '10%',
    left: '15%',
    width: '45%',
    height: '30%',
    borderRadius: radii.pill,
    backgroundColor: palette.card,
    opacity: 0.4,
  },
  symbol: {
    fontFamily: typography.display,
    fontWeight: '700',
    color: palette.onCard,
  },
});
