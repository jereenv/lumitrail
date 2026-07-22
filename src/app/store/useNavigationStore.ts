/**
 * App navigation state — kept separate from game/domain state.
 *
 * `activeTab` drives which screen the shell renders. `focusTarget` lets any
 * screen command the map to fly somewhere (e.g. tapping a region in Journey):
 * the setter also switches to the map tab, and MapScreen clears it after it has
 * animated. This is the "one screen sets a value, another reacts" pattern —
 * cross-screen coordination without a router.
 */
import { create } from 'zustand';

import type { MapRegion } from '@/domain/geo/fog';

export type TabId = 'map' | 'stats' | 'achievements' | 'leaderboard' | 'friends' | 'settings';

export interface MapFocus extends MapRegion {
  readonly label?: string;
}

interface NavigationState {
  activeTab: TabId;
  focusTarget: MapFocus | null;
  setActiveTab: (tab: TabId) => void;
  focusMap: (target: MapFocus) => void;
  clearMapFocus: () => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  activeTab: 'map',
  focusTarget: null,
  setActiveTab: (tab) => set({ activeTab: tab }),
  focusMap: (target) => set({ focusTarget: target, activeTab: 'map' }),
  clearMapFocus: () => set({ focusTarget: null }),
}));
