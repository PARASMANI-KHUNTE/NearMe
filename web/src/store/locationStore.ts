import { create } from 'zustand';
import type { LocationState } from '../types';

export const useLocationStore = create<LocationState>((set) => ({
  shareLocation: true,
  radius: 1000,
  preciseSharing: false,

  setShareLocation: (shareLocation) => set({ shareLocation }),
  setRadius: (radius) => set({ radius }),
  setPreciseSharing: (preciseSharing) => set({ preciseSharing }),
}));