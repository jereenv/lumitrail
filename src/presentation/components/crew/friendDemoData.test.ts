import {
  FriendStats,
  FriendProfile,
  DEMO_FRIEND_PROFILES,
  getFriendProfile,
} from './friendDemoData';

describe('friendDemoData', () => {
  describe('DEMO_FRIEND_PROFILES', () => {
    it('includes maya, kofi, and priya', () => {
      expect(DEMO_FRIEND_PROFILES).toHaveProperty('maya');
      expect(DEMO_FRIEND_PROFILES).toHaveProperty('kofi');
      expect(DEMO_FRIEND_PROFILES).toHaveProperty('priya');
    });

    it('has correct stats for maya', () => {
      const maya = DEMO_FRIEND_PROFILES.maya;
      expect(maya.displayName).toBe('Maya');
      expect(maya.stats.cellsRevealed).toBe(40);
      expect(maya.stats.distanceMeters).toBe(12000);
      expect(maya.stats.countriesVisited).toBe(3);
      expect(maya.stats.totalXp).toBe(520);
    });

    it('has correct stats for kofi', () => {
      const kofi = DEMO_FRIEND_PROFILES.kofi;
      expect(kofi.displayName).toBe('Kofi');
      expect(kofi.stats.cellsRevealed).toBe(12);
      expect(kofi.stats.distanceMeters).toBe(3200);
      expect(kofi.stats.countriesVisited).toBe(1);
      expect(kofi.stats.totalXp).toBe(130);
    });

    it('has correct stats for priya', () => {
      const priya = DEMO_FRIEND_PROFILES.priya;
      expect(priya.displayName).toBe('Priya');
      expect(priya.stats.cellsRevealed).toBe(65);
      expect(priya.stats.distanceMeters).toBe(24000);
      expect(priya.stats.countriesVisited).toBe(5);
      expect(priya.stats.totalXp).toBe(780);
    });
  });

  describe('getFriendProfile', () => {
    it('returns full profile for known friend maya', () => {
      const profile = getFriendProfile('maya');
      expect(profile.playerId).toBe('maya');
      expect(profile.displayName).toBe('Maya');
      expect(profile.stats.cellsRevealed).toBe(40);
      expect(profile.stats.distanceMeters).toBe(12000);
      expect(profile.stats.countriesVisited).toBe(3);
      expect(profile.stats.totalXp).toBe(520);
    });

    it('returns full profile for known friend kofi', () => {
      const profile = getFriendProfile('kofi');
      expect(profile.playerId).toBe('kofi');
      expect(profile.displayName).toBe('Kofi');
      expect(profile.stats.cellsRevealed).toBe(12);
      expect(profile.stats.distanceMeters).toBe(3200);
      expect(profile.stats.countriesVisited).toBe(1);
      expect(profile.stats.totalXp).toBe(130);
    });

    it('returns full profile for known friend priya', () => {
      const profile = getFriendProfile('priya');
      expect(profile.playerId).toBe('priya');
      expect(profile.displayName).toBe('Priya');
      expect(profile.stats.cellsRevealed).toBe(65);
      expect(profile.stats.distanceMeters).toBe(24000);
      expect(profile.stats.countriesVisited).toBe(5);
      expect(profile.stats.totalXp).toBe(780);
    });

    it('returns stub profile for unknown friend', () => {
      const profile = getFriendProfile('xyz');
      expect(profile.playerId).toBe('xyz');
      expect(profile.displayName).toBe('xyz');
      expect(profile.stats.cellsRevealed).toBe(0);
      expect(profile.stats.distanceMeters).toBe(0);
      expect(profile.stats.countriesVisited).toBe(0);
      expect(profile.stats.totalXp).toBe(0);
    });

    it('returns stub profile with correct shape for any unknown playerId', () => {
      const profile = getFriendProfile('unknown-player-456');
      expect(profile).toMatchObject({
        playerId: 'unknown-player-456',
        displayName: 'unknown-player-456',
        stats: {
          cellsRevealed: 0,
          distanceMeters: 0,
          countriesVisited: 0,
          totalXp: 0,
        },
      });
    });
  });
});
