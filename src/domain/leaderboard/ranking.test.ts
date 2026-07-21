import { INITIAL_STATS, type PlayerStats } from '@/domain/player/stats';

import { rankBy, rankFriends, type LeaderboardCandidate } from './ranking';

function candidate(id: string, overrides: Partial<PlayerStats>): LeaderboardCandidate {
  return { playerId: id, displayName: id.toUpperCase(), stats: { ...INITIAL_STATS, ...overrides } };
}

const CANDIDATES: LeaderboardCandidate[] = [
  candidate('ada', { cellsRevealed: 500 }),
  candidate('bo', { cellsRevealed: 900 }),
  candidate('cy', { cellsRevealed: 500 }),
  candidate('di', { cellsRevealed: 100 }),
];

describe('rankBy', () => {
  it('orders descending by the chosen metric', () => {
    const board = rankBy(CANDIDATES, 'cellsRevealed');
    expect(board.map((e) => e.playerId)).toEqual(['bo', 'ada', 'cy', 'di']);
  });

  it('uses competition ranking for ties (1, 2, 2, 4)', () => {
    const board = rankBy(CANDIDATES, 'cellsRevealed');
    expect(board.map((e) => e.rank)).toEqual([1, 2, 2, 4]);
  });

  it('is deterministic within a tie (stable by playerId)', () => {
    const board = rankBy(CANDIDATES, 'cellsRevealed');
    const tied = board.filter((e) => e.value === 500).map((e) => e.playerId);
    expect(tied).toEqual(['ada', 'cy']);
  });
});

describe('rankFriends', () => {
  it('restricts the board to the player and their friends', () => {
    const board = rankFriends(CANDIDATES, 'cellsRevealed', 'di', new Set(['ada']));
    expect(board.map((e) => e.playerId)).toEqual(['ada', 'di']);
    expect(board[0]?.rank).toBe(1);
  });
});
