/**
 * MedalGrid — a wrapping row of Medal components for one achievement category.
 *
 * Each medal fires a one-shot spring animation on mount when the achievement
 * is already unlocked, simulating the "pop" moment of earning it.
 *
 * MedalCell is an internal component so each medal gets its own Animated.Value
 * and useEffect (required by the Rules of Hooks — never call hooks inside a
 * .map() callback).
 */
import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { motion, palette, radii, spacing, typography } from '@/app/theme';
import Medal from '@/presentation/components/Medal';
import type { AchievementDefinition } from '@/domain/achievements/catalog';
import type { PlayerStats } from '@/domain/player/stats';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MedalGridProps {
  definitions: AchievementDefinition[];
  stats: PlayerStats;
  unlockedAchievements: ReadonlySet<string>;
}

// ---------------------------------------------------------------------------
// MedalCell — one medal + label, handles its own animation state
// ---------------------------------------------------------------------------

interface MedalCellProps {
  def: AchievementDefinition;
  unlocked: boolean;
  progress: number;
}

function MedalCell({ def, unlocked, progress }: MedalCellProps): React.ReactElement {
  // Initialise at 0.85 if unlocked (so the spring animates from 0.85 → 1),
  // or 1 if locked (full size, no animation needed).
  const [scale] = useState(() => new Animated.Value(unlocked ? 0.85 : 1));

  useEffect(() => {
    if (unlocked) {
      Animated.spring(scale, {
        toValue: 1,
        damping: motion.spring.damping,
        stiffness: motion.spring.stiffness,
        mass: motion.spring.mass,
        useNativeDriver: true,
      }).start();
    }
    // Empty deps: fire once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View
      testID={`medal-${def.id}`}
      style={styles.cell}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {/* Shine overlay — subtle glow on top of the medal for unlocked state */}
        {unlocked && (
          <View
            pointerEvents="none"
            style={styles.shineOverlay}
          />
        )}
        <Medal
          tier={def.tier}
          size={72}
          locked={!unlocked}
          progress={unlocked ? undefined : progress}
        />
      </Animated.View>

      <Text
        style={[styles.label, unlocked ? styles.labelUnlocked : styles.labelLocked]}
        numberOfLines={2}
      >
        {def.title}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// MedalGrid
// ---------------------------------------------------------------------------

export default function MedalGrid({
  definitions,
  stats,
  unlockedAchievements,
}: MedalGridProps): React.ReactElement {
  return (
    <View style={styles.grid}>
      {definitions.map((def) => {
        const unlocked = unlockedAchievements.has(def.id);
        const progress = Math.min(
          1,
          def.threshold > 0 ? (stats[def.metric] as number) / def.threshold : 0,
        );

        return (
          <MedalCell
            key={def.id}
            def={def}
            unlocked={unlocked}
            progress={progress}
          />
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cell: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  shineOverlay: {
    position: 'absolute',
    width: '60%',
    height: '30%',
    top: '5%',
    left: '20%',
    borderRadius: radii.pill,
    backgroundColor: palette.card,
    opacity: 0.3,
    zIndex: 1,
  },
  label: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    maxWidth: 80,
  },
  labelUnlocked: {
    color: palette.onCard,
  },
  labelLocked: {
    color: palette.onCardMuted,
  },
});
