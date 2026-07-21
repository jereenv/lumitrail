/**
 * Friendship graph — pure state transitions for the social layer.
 *
 * Friend requests and friendships are modelled as immutable records; every
 * operation returns a new array rather than mutating, which keeps the logic
 * trivially testable and plays nicely with a store like Zustand. The privacy
 * model lives above this (a user must opt in to being discoverable); this layer
 * only encodes the mechanics of requesting and accepting.
 */
export type FriendRequestStatus = 'pending' | 'accepted' | 'declined';

export interface FriendRequest {
  readonly id: string;
  readonly fromPlayerId: string;
  readonly toPlayerId: string;
  readonly status: FriendRequestStatus;
  readonly createdAt: number;
}

export class FriendshipError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FriendshipError';
  }
}

/** Canonical, order-independent key for a friendship between two players. */
export function friendshipKey(a: string, b: string): string {
  return a < b ? `${a}::${b}` : `${b}::${a}`;
}

function areAlreadyConnected(requests: readonly FriendRequest[], a: string, b: string): boolean {
  const key = friendshipKey(a, b);
  return requests.some(
    (r) =>
      r.status !== 'declined' &&
      friendshipKey(r.fromPlayerId, r.toPlayerId) === key &&
      (r.status === 'accepted' || r.status === 'pending'),
  );
}

/**
 * Creates a pending friend request. Rejects self-requests and duplicates of an
 * existing pending/accepted relationship.
 */
export function sendFriendRequest(
  requests: readonly FriendRequest[],
  request: { id: string; fromPlayerId: string; toPlayerId: string; createdAt: number },
): FriendRequest[] {
  if (request.fromPlayerId === request.toPlayerId) {
    throw new FriendshipError('Cannot send a friend request to yourself.');
  }
  if (areAlreadyConnected(requests, request.fromPlayerId, request.toPlayerId)) {
    throw new FriendshipError('A pending or accepted relationship already exists.');
  }
  return [...requests, { ...request, status: 'pending' }];
}

function transition(
  requests: readonly FriendRequest[],
  requestId: string,
  to: FriendRequestStatus,
): FriendRequest[] {
  let found = false;
  const next = requests.map((r) => {
    if (r.id !== requestId) {
      return r;
    }
    found = true;
    if (r.status !== 'pending') {
      throw new FriendshipError(`Request ${requestId} is not pending.`);
    }
    return { ...r, status: to };
  });
  if (!found) {
    throw new FriendshipError(`Request ${requestId} not found.`);
  }
  return next;
}

export function acceptFriendRequest(
  requests: readonly FriendRequest[],
  requestId: string,
): FriendRequest[] {
  return transition(requests, requestId, 'accepted');
}

export function declineFriendRequest(
  requests: readonly FriendRequest[],
  requestId: string,
): FriendRequest[] {
  return transition(requests, requestId, 'declined');
}

/** Returns the set of player ids who are accepted friends of `playerId`. */
export function friendsOf(requests: readonly FriendRequest[], playerId: string): Set<string> {
  const friends = new Set<string>();
  for (const r of requests) {
    if (r.status !== 'accepted') {
      continue;
    }
    if (r.fromPlayerId === playerId) {
      friends.add(r.toPlayerId);
    } else if (r.toPlayerId === playerId) {
      friends.add(r.fromPlayerId);
    }
  }
  return friends;
}

/** Pending requests addressed to `playerId` (their inbox). */
export function incomingRequests(
  requests: readonly FriendRequest[],
  playerId: string,
): FriendRequest[] {
  return requests.filter((r) => r.status === 'pending' && r.toPlayerId === playerId);
}
