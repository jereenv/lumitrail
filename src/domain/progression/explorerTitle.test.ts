import { explorerTitle } from './explorerTitle';

describe('explorerTitle', () => {
  describe('Wanderer tier (level 1-4)', () => {
    it('returns "Wanderer" for level 1', () => {
      expect(explorerTitle(1)).toBe('Wanderer');
    });

    it('returns "Wanderer" for level 4', () => {
      expect(explorerTitle(4)).toBe('Wanderer');
    });

    it('returns "Wanderer" for level 0', () => {
      expect(explorerTitle(0)).toBe('Wanderer');
    });

    it('returns "Wanderer" for negative levels', () => {
      expect(explorerTitle(-5)).toBe('Wanderer');
    });
  });

  describe('Pathfinder tier (level 5-9)', () => {
    it('returns "Pathfinder" for level 5', () => {
      expect(explorerTitle(5)).toBe('Pathfinder');
    });

    it('returns "Pathfinder" for level 9', () => {
      expect(explorerTitle(9)).toBe('Pathfinder');
    });
  });

  describe('Trailblazer tier (level 10-19)', () => {
    it('returns "Trailblazer" for level 10', () => {
      expect(explorerTitle(10)).toBe('Trailblazer');
    });

    it('returns "Trailblazer" for level 19', () => {
      expect(explorerTitle(19)).toBe('Trailblazer');
    });
  });

  describe('Voyager tier (level 20+)', () => {
    it('returns "Voyager" for level 20', () => {
      expect(explorerTitle(20)).toBe('Voyager');
    });

    it('returns "Voyager" for level 99', () => {
      expect(explorerTitle(99)).toBe('Voyager');
    });
  });
});
