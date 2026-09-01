import { create } from 'zustand';

export type ActivityLevel = 'idle' | 'active' | 'hot';

export interface CourtPulseState {
  activeCount: number;
  recentEventTimestamps: number[];
  unseenCount: number;
  lastSeenAt: number;
  activityLevel: ActivityLevel;
  registerJobEvent: () => void;
  markSeen: () => void;
  setActiveCount: (count: number) => void;
}

export const useCourtPulseStore = create<CourtPulseState>((set, get) => ({
  activeCount: 0,
  recentEventTimestamps: [],
  unseenCount: 0,
  lastSeenAt: Date.now(),
  activityLevel: 'idle',

  registerJobEvent: () => {
    const now = Date.now();
    const fiveMinsAgo = now - 5 * 60 * 1000;
    
    set((state) => {
      // Prune old entries
      const validTimestamps = state.recentEventTimestamps.filter(t => t > fiveMinsAgo);
      validTimestamps.push(now);

      const eventCount = validTimestamps.length;
      let newLevel: ActivityLevel = 'idle';
      if (eventCount >= 3) {
        newLevel = 'hot';
      } else if (eventCount >= 1) {
        newLevel = 'active';
      }

      return {
        recentEventTimestamps: validTimestamps,
        unseenCount: state.unseenCount + 1,
        activityLevel: newLevel,
      };
    });
  },

  markSeen: () => {
    set({
      unseenCount: 0,
      lastSeenAt: Date.now(),
    });
  },

  setActiveCount: (count: number) => {
    set({ activeCount: count });
  },
}));
