import { create } from 'zustand';
import type { LocationState } from '../types';
import { userService } from '../services/userService';

export const useLocationStore = create<LocationState>((set, get) => ({
  shareLocation: true,
  radius: 5000,
  preciseSharing: false,
  invisibleMode: false,

  setShareLocation: (shareLocation) => {
    set({ shareLocation });
    // Server expects locationSharingEnabled, not shareLocation
    userService.updateSettings({ locationSharingEnabled: shareLocation, radius: get().radius }).catch(console.error);
  },
  setRadius: (radius) => {
    set({ radius });
    userService.updateSettings({ radius, locationSharingEnabled: get().shareLocation }).catch(console.error);
  },
  setPreciseSharing: (preciseSharing) => {
    set({ preciseSharing });
    // preciseSharing is frontend-only; server does not persist this
  },
  setInvisibleMode: (invisibleMode) => {
    set({ invisibleMode });
    userService.updateSettings({ invisibleMode, locationSharingEnabled: get().shareLocation, radius: get().radius }).catch(console.error);
  },
}));