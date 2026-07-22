/**
 * RequestCard — a GameCard row representing an incoming friend request.
 *
 * Lays out three zones left-to-right:
 *   Left   — Avatar for the requesting player.
 *   Center — Player ID + "wants to join your crew" subtitle.
 *   Right  — Accept (aurora bg) and Decline (cardBorder bg) buttons.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { palette, radii, spacing, typography } from '@/app/theme';
import Avatar from '@/presentation/components/Avatar';
import GameCard from '@/presentation/components/GameCard';
import type { FriendRequest } from '@/domain/social/friendship';

interface RequestCardProps {
  request: FriendRequest;
  onAccept: () => void;
  onDecline: () => void;
}

export default function RequestCard({
  request,
  onAccept,
  onDecline,
}: RequestCardProps): React.ReactElement {
  return (
    <GameCard testID={`request-card-${request.id}`}>
      <View style={styles.row}>
        {/* Left — Avatar */}
        <Avatar name={request.fromPlayerId} size={40} />

        {/* Center — Name + subtitle */}
        <View style={styles.center}>
          <Text style={styles.name} numberOfLines={1}>
            {request.fromPlayerId}
          </Text>
          <Text style={styles.subtitle}>wants to join your crew</Text>
        </View>

        {/* Right — Accept and Decline buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            testID={`request-accept-${request.id}`}
            onPress={onAccept}
            style={styles.acceptButton}
            accessibilityRole="button"
            accessibilityLabel="Accept friend request"
          >
            <Text style={styles.acceptText}>Accept</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID={`request-decline-${request.id}`}
            onPress={onDecline}
            style={styles.declineButton}
            accessibilityRole="button"
            accessibilityLabel="Decline friend request"
          >
            <Text style={styles.declineText}>Decline</Text>
          </TouchableOpacity>
        </View>
      </View>
    </GameCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontFamily: typography.display,
    fontSize: typography.sizes.md,
    color: palette.onCard,
  },
  subtitle: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: palette.onCardMuted,
  },
  actions: {
    flexDirection: 'column',
    gap: spacing.xs,
  },
  acceptButton: {
    backgroundColor: palette.aurora,
    borderRadius: radii.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptText: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: palette.ink,
  },
  declineButton: {
    backgroundColor: palette.cardBorder,
    borderRadius: radii.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineText: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: palette.onCardMuted,
  },
});
