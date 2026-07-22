/**
 * EventToast — converts a single DomainEvent into a brief notification banner.
 *
 * The component returns null for events that should be silent (fixRejected),
 * which lets the caller render it unconditionally without checking the type
 * first — a null return simply vanishes from the layout.
 *
 * Each event type maps to a colour and message:
 *   - cellsRevealed  → aurora teal  (discovery feel)
 *   - xpGained       → lumen amber  (reward feel)
 *   - leveledUp      → lumenBright  (celebration)
 *   - achievementUnlocked → gold    (prestige)
 *   - regionCompleted → aurora      (milestone)
 *   - streakExtended  → lumen       (habit)
 *   - fixRejected    → silent       (no toast)
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { cardShadow, palette, radii, spacing, tierColors, typography } from '@/app/theme';
import { ACHIEVEMENTS_BY_ID } from '@/domain/achievements/catalog';
import type { DomainEvent } from '@/domain/loop/events';

interface EventToastProps {
  event: DomainEvent;
  onDismiss: () => void;
}

interface ToastContent {
  readonly message: string;
  readonly color: string;
}

function resolveContent(event: DomainEvent): ToastContent | null {
  switch (event.type) {
    case 'cellsRevealed':
      return {
        message: `Unfogged ${event.cells.length} cells!`,
        color: palette.aurora,
      };
    case 'xpGained':
      return {
        message: `+${event.breakdown.total} XP`,
        color: palette.lumen,
      };
    case 'leveledUp':
      return {
        message: `Level Up! → ${event.to}`,
        color: palette.lumenBright,
      };
    case 'achievementUnlocked': {
      const def = ACHIEVEMENTS_BY_ID.get(event.achievementId);
      const label = def !== undefined ? def.title : event.achievementId;
      return {
        message: `Achievement: ${label}`,
        color: tierColors.gold,
      };
    }
    case 'regionCompleted':
      return {
        message: `Explored: ${event.regionName}`,
        color: palette.aurora,
      };
    case 'streakExtended':
      return {
        message: `🔥 ${event.days} day streak!`,
        color: palette.lumen,
      };
    case 'fixRejected':
      return null;
  }
}

export default function EventToast({
  event,
  onDismiss,
}: EventToastProps): React.ReactElement | null {
  const content = resolveContent(event);
  if (content === null) {
    return null;
  }

  return (
    <View style={[styles.container, { borderColor: content.color }]}>
      <Text style={[styles.message, { color: content.color }]} numberOfLines={2}>
        {content.message}
      </Text>
      <TouchableOpacity
        onPress={onDismiss}
        style={styles.dismissButton}
        accessibilityLabel="Dismiss notification"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={[styles.dismissText, { color: content.color }]}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: palette.card,
    borderWidth: 1.5,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    ...cardShadow,
  },
  message: {
    flex: 1,
    fontFamily: typography.display,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  dismissButton: {
    flexShrink: 0,
  },
  dismissText: {
    fontFamily: typography.body,
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    lineHeight: typography.sizes.lg,
  },
});
