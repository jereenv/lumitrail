/**
 * FriendsScreen — social layer: incoming requests, friends list, and a
 * shareable exploration snapshot card.
 *
 * Friend request state is local (not persisted) and seeded with demo data so
 * the screen looks populated on first render. Accepts/declines update the local
 * array using the pure domain helpers.
 */
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { palette, radii, spacing, typography } from '@/app/theme';
import { useExplorationStore } from '@/app/store/useExplorationStore';
import { ScreenHeader } from '@/presentation/components';
import { levelForXp } from '@/domain/progression/levels';
import {
  acceptFriendRequest,
  declineFriendRequest,
  friendsOf,
  incomingRequests,
  type FriendRequest,
} from '@/domain/social/friendship';

// ---------------------------------------------------------------------------
// Demo seed
// ---------------------------------------------------------------------------

function buildInitialRequests(toPlayerId: string): FriendRequest[] {
  return [
    {
      id: 'req-1',
      fromPlayerId: 'maya',
      toPlayerId,
      status: 'accepted',
      createdAt: Date.now() - 86400000,
    },
    {
      id: 'req-2',
      fromPlayerId: 'kofi',
      toPlayerId,
      status: 'accepted',
      createdAt: Date.now() - 172800000,
    },
    {
      id: 'req-3',
      fromPlayerId: 'priya',
      toPlayerId,
      status: 'pending',
      createdAt: Date.now() - 3600000,
    },
  ];
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionLabel({ title }: { title: string }): React.ReactElement {
  return <Text style={styles.sectionLabel}>{title}</Text>;
}

interface IncomingRequestRowProps {
  request: FriendRequest;
  onAccept: () => void;
  onDecline: () => void;
}

function IncomingRequestRow({
  request,
  onAccept,
  onDecline,
}: IncomingRequestRowProps): React.ReactElement {
  return (
    <View style={styles.requestRow}>
      <View style={styles.requestAvatar}>
        <Text style={styles.requestAvatarText}>{request.fromPlayerId.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.requestInfo}>
        <Text style={styles.requestName}>{request.fromPlayerId}</Text>
        <Text style={styles.requestTime}>wants to be your friend</Text>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={onAccept}
          accessibilityLabel={`Accept friend request from ${request.fromPlayerId}`}
          accessibilityRole="button"
        >
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.declineButton}
          onPress={onDecline}
          accessibilityLabel={`Decline friend request from ${request.fromPlayerId}`}
          accessibilityRole="button"
        >
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface FriendRowProps {
  friendId: string;
}

function FriendRow({ friendId }: FriendRowProps): React.ReactElement {
  function handleCompare(): void {
    Alert.alert('Compare', `Comparison with ${friendId} coming soon!`);
  }

  return (
    <View style={styles.friendRow}>
      <View style={styles.requestAvatar}>
        <Text style={styles.requestAvatarText}>{friendId.charAt(0).toUpperCase()}</Text>
      </View>
      <Text style={styles.friendName}>{friendId}</Text>
      <TouchableOpacity
        style={styles.compareButton}
        onPress={handleCompare}
        accessibilityLabel={`Compare exploration with ${friendId}`}
        accessibilityRole="button"
      >
        <Text style={styles.compareButtonText}>Compare</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function FriendsScreen(): React.ReactElement {
  const { playerState } = useExplorationStore();
  const [requests, setRequests] = useState<FriendRequest[]>(() =>
    buildInitialRequests(playerState.playerId),
  );

  const { playerId, displayName, stats } = playerState;
  const levelProgress = levelForXp(stats.totalXp);

  const pending = incomingRequests(requests, playerId);
  const friends = Array.from(friendsOf(requests, playerId));

  function handleAccept(reqId: string): void {
    setRequests((prev) => acceptFriendRequest(prev, reqId));
  }

  function handleDecline(reqId: string): void {
    setRequests((prev) => declineFriendRequest(prev, reqId));
  }

  function handleShare(): void {
    Alert.alert('Share', 'Sharing coming soon!');
  }

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Friends"
        subtitle={`${friends.length} friend${friends.length !== 1 ? 's' : ''}`}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ---------------------------------------------------------------- */}
        {/* Incoming requests                                                 */}
        {/* ---------------------------------------------------------------- */}
        {pending.length > 0 && (
          <>
            <SectionLabel title="Incoming Requests" />
            <View style={styles.card}>
              {pending.map((req) => (
                <IncomingRequestRow
                  key={req.id}
                  request={req}
                  onAccept={() => handleAccept(req.id)}
                  onDecline={() => handleDecline(req.id)}
                />
              ))}
            </View>
          </>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Friends list                                                      */}
        {/* ---------------------------------------------------------------- */}
        <SectionLabel title="Friends" />
        {friends.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.emptyText}>
              No friends yet. Share your profile to invite people!
            </Text>
          </View>
        ) : (
          <View style={styles.card}>
            {friends.map((friendId) => (
              <FriendRow key={friendId} friendId={friendId} />
            ))}
          </View>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Exploration snapshot card                                         */}
        {/* ---------------------------------------------------------------- */}
        <SectionLabel title="Your Snapshot" />
        <View style={styles.snapshotCard}>
          <View style={styles.snapshotHeader}>
            <View style={styles.snapshotAvatar}>
              <Text style={styles.snapshotAvatarText}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.snapshotInfo}>
              <Text style={styles.snapshotName}>{displayName}</Text>
              <Text style={styles.snapshotLevel}>Level {levelProgress.level} Explorer</Text>
            </View>
          </View>
          <View style={styles.snapshotStats}>
            <View style={styles.snapshotStat}>
              <Text style={styles.snapshotStatValue}>{stats.cellsRevealed}</Text>
              <Text style={styles.snapshotStatLabel}>Cells</Text>
            </View>
            <View style={styles.snapshotDivider} />
            <View style={styles.snapshotStat}>
              <Text style={styles.snapshotStatValue}>
                {(stats.distanceMeters / 1000).toFixed(1)} km
              </Text>
              <Text style={styles.snapshotStatLabel}>Distance</Text>
            </View>
            <View style={styles.snapshotDivider} />
            <View style={styles.snapshotStat}>
              <Text style={styles.snapshotStatValue}>{stats.countriesVisited}</Text>
              <Text style={styles.snapshotStatLabel}>Countries</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            accessibilityLabel="Share your exploration snapshot"
            accessibilityRole="button"
          >
            <Text style={styles.shareButtonText}>Share Snapshot</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.ink,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  sectionLabel: {
    fontFamily: typography.display,
    fontSize: typography.sizes.md,
    color: palette.text,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.surfaceAlt,
  },
  requestAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestAvatarText: {
    fontFamily: typography.display,
    fontSize: typography.sizes.md,
    color: palette.lumen,
    fontWeight: '700',
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontFamily: typography.body,
    fontSize: typography.sizes.md,
    color: palette.text,
    fontWeight: '600',
  },
  requestTime: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: palette.textMuted,
  },
  requestActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  acceptButton: {
    backgroundColor: palette.aurora,
    borderRadius: radii.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  acceptButtonText: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: palette.ink,
    fontWeight: '600',
  },
  declineButton: {
    backgroundColor: palette.surfaceAlt,
    borderRadius: radii.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  declineButtonText: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: palette.textMuted,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.surfaceAlt,
  },
  friendName: {
    flex: 1,
    fontFamily: typography.body,
    fontSize: typography.sizes.md,
    color: palette.text,
  },
  compareButton: {
    borderWidth: 1.5,
    borderColor: palette.sky,
    borderRadius: radii.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  compareButtonText: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: palette.sky,
    fontWeight: '600',
  },
  snapshotCard: {
    backgroundColor: palette.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: `${palette.lumen}30`,
  },
  snapshotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  snapshotAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: `${palette.lumen}22`,
    borderWidth: 2,
    borderColor: palette.lumen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapshotAvatarText: {
    fontFamily: typography.display,
    fontSize: typography.sizes.xl,
    color: palette.lumen,
    fontWeight: '700',
  },
  snapshotInfo: {
    flex: 1,
  },
  snapshotName: {
    fontFamily: typography.display,
    fontSize: typography.sizes.md,
    color: palette.text,
    fontWeight: '700',
  },
  snapshotLevel: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: palette.lumen,
  },
  snapshotStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: palette.surfaceAlt,
    borderRadius: radii.sm,
    paddingVertical: spacing.md,
  },
  snapshotStat: {
    alignItems: 'center',
    flex: 1,
  },
  snapshotStatValue: {
    fontFamily: typography.display,
    fontSize: typography.sizes.lg,
    color: palette.aurora,
    fontWeight: '700',
  },
  snapshotStatLabel: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: palette.textMuted,
    marginTop: 2,
  },
  snapshotDivider: {
    width: 1,
    height: 40,
    backgroundColor: palette.surface,
  },
  shareButton: {
    backgroundColor: palette.lumen,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  shareButtonText: {
    fontFamily: typography.display,
    fontSize: typography.sizes.md,
    color: palette.ink,
    fontWeight: '700',
  },
  emptyText: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: palette.textMuted,
    textAlign: 'center',
    padding: spacing.lg,
  },
  bottomPad: {
    height: spacing.xxl,
  },
});
