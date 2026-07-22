/**
 * FriendsScreen — social layer: incoming requests, friends list, and a
 * shareable exploration snapshot card.
 *
 * Composes all the new crew components:
 *   - RequestCard for pending friend requests
 *   - CrewCard for accepted friends
 *   - AddCrewButton as an action inside the "Your Crew" section header
 *   - SnapshotCard for the player's own exploration stats
 *   - CompareSheet (modal) opened when tapping Compare on a CrewCard
 *
 * Friend request state is local (not persisted) and seeded with demo data so
 * the screen looks populated on first render. Accepts/declines update the local
 * array using the pure domain helpers.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { palette, spacing, typography } from '@/app/theme';
import { useExplorationStore } from '@/app/store/useExplorationStore';
import { SectionHeader, ScreenHeader, GameCard } from '@/presentation/components';
import { levelForXp } from '@/domain/progression/levels';
import {
  acceptFriendRequest,
  declineFriendRequest,
  friendsOf,
  incomingRequests,
  type FriendRequest,
} from '@/domain/social/friendship';

import { getFriendProfile } from '../components/crew/friendDemoData';
import CompareSheet from '../components/crew/CompareSheet';
import CrewCard from '../components/crew/CrewCard';
import RequestCard from '../components/crew/RequestCard';
import AddCrewButton from '../components/crew/AddCrewButton';
import SnapshotCard from '../components/crew/SnapshotCard';

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
// Main component
// ---------------------------------------------------------------------------

export default function FriendsScreen(): React.ReactElement {
  const { playerState } = useExplorationStore();
  const [requests, setRequests] = useState<FriendRequest[]>(() =>
    buildInitialRequests(playerState.playerId),
  );
  const [compareTarget, setCompareTarget] = useState<string | null>(null);

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

  return (
    <View style={styles.root}>
      {/* ------------------------------------------------------------------ */}
      {/* Screen header                                                        */}
      {/* ------------------------------------------------------------------ */}
      <ScreenHeader
        title="Crew"
        subtitle={`${friends.length} explorer${friends.length !== 1 ? 's' : ''}`}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Scrollable body                                                      */}
      {/* ------------------------------------------------------------------ */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ---- Incoming Requests ---- */}
        {pending.length > 0 && (
          <>
            <SectionHeader title="Incoming Requests" />
            {pending.map((req) => (
              <RequestCard
                key={req.id}
                request={req}
                onAccept={() => handleAccept(req.id)}
                onDecline={() => handleDecline(req.id)}
              />
            ))}
          </>
        )}

        {/* ---- Your Crew ---- */}
        <SectionHeader title="Your Crew" action={<AddCrewButton />} />
        {friends.length === 0 ? (
          <GameCard>
            <Text style={styles.emptyText}>No crew yet. Invite friends to explore together!</Text>
          </GameCard>
        ) : (
          friends.map((friendId) => (
            <CrewCard
              key={friendId}
              friendProfile={getFriendProfile(friendId)}
              onCompare={() => setCompareTarget(friendId)}
            />
          ))
        )}

        {/* ---- Explorer Snapshot ---- */}
        <SectionHeader title="Explorer Snapshot" />
        <SnapshotCard playerName={displayName} level={levelProgress.level} stats={stats} />

        <View style={styles.bottomPad} />
      </ScrollView>

      {/* ------------------------------------------------------------------ */}
      {/* CompareSheet — rendered at root level so it overlays everything     */}
      {/* ------------------------------------------------------------------ */}
      <CompareSheet
        visible={compareTarget !== null}
        friendProfile={getFriendProfile(compareTarget ?? '')}
        playerStats={stats}
        playerName={displayName}
        onClose={() => setCompareTarget(null)}
      />
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
