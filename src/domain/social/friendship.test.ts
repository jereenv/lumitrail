import {
  acceptFriendRequest,
  declineFriendRequest,
  FriendshipError,
  friendsOf,
  incomingRequests,
  sendFriendRequest,
  type FriendRequest,
} from './friendship';

function send(reqs: FriendRequest[], id: string, from: string, to: string): FriendRequest[] {
  return sendFriendRequest(reqs, { id, fromPlayerId: from, toPlayerId: to, createdAt: 0 });
}

describe('friendship', () => {
  it('creates a pending request', () => {
    const reqs = send([], 'r1', 'ada', 'bo');
    expect(reqs[0]?.status).toBe('pending');
    expect(incomingRequests(reqs, 'bo')).toHaveLength(1);
  });

  it('rejects self-requests', () => {
    expect(() => send([], 'r1', 'ada', 'ada')).toThrow(FriendshipError);
  });

  it('rejects duplicate pending/accepted relationships regardless of direction', () => {
    const reqs = send([], 'r1', 'ada', 'bo');
    expect(() => send(reqs, 'r2', 'bo', 'ada')).toThrow(FriendshipError);
  });

  it('makes both players friends once accepted', () => {
    let reqs = send([], 'r1', 'ada', 'bo');
    reqs = acceptFriendRequest(reqs, 'r1');
    expect(friendsOf(reqs, 'ada')).toEqual(new Set(['bo']));
    expect(friendsOf(reqs, 'bo')).toEqual(new Set(['ada']));
  });

  it('declined requests create no friendship and free up the pair', () => {
    let reqs = send([], 'r1', 'ada', 'bo');
    reqs = declineFriendRequest(reqs, 'r1');
    expect(friendsOf(reqs, 'ada').size).toBe(0);
    // The pair is free to try again after a decline.
    expect(() => send(reqs, 'r2', 'ada', 'bo')).not.toThrow();
  });

  it('cannot accept a non-pending or missing request', () => {
    const reqs = send([], 'r1', 'ada', 'bo');
    const accepted = acceptFriendRequest(reqs, 'r1');
    expect(() => acceptFriendRequest(accepted, 'r1')).toThrow(FriendshipError);
    expect(() => acceptFriendRequest(reqs, 'nope')).toThrow(FriendshipError);
  });
});
