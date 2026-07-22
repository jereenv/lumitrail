/**
 * Demo friend data model for the Crew screen.
 * Provides sample friend profiles and utilities for accessing them.
 */

export interface FriendStats {
  cellsRevealed: number;
  distanceMeters: number;
  countriesVisited: number;
  totalXp: number;
}

export interface FriendProfile {
  playerId: string;
  displayName: string;
  stats: FriendStats;
}

export const DEMO_FRIEND_PROFILES: Record<string, FriendProfile> = {
  maya: {
    playerId: 'maya',
    displayName: 'Maya',
    stats: {
      cellsRevealed: 40,
      distanceMeters: 12000,
      countriesVisited: 3,
      totalXp: 520,
    },
  },
  kofi: {
    playerId: 'kofi',
    displayName: 'Kofi',
    stats: {
      cellsRevealed: 12,
      distanceMeters: 3200,
      countriesVisited: 1,
      totalXp: 130,
    },
  },
  priya: {
    playerId: 'priya',
    displayName: 'Priya',
    stats: {
      cellsRevealed: 65,
      distanceMeters: 24000,
      countriesVisited: 5,
      totalXp: 780,
    },
  },
};

export function getFriendProfile(playerId: string): FriendProfile {
  const existingProfile = DEMO_FRIEND_PROFILES[playerId];
  if (existingProfile) {
    return existingProfile;
  }

  // Return a stub profile for unknown friends
  return {
    playerId,
    displayName: playerId,
    stats: {
      cellsRevealed: 0,
      distanceMeters: 0,
      countriesVisited: 0,
      totalXp: 0,
    },
  };
}
