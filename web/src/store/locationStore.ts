import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LocationState } from '../types';
import { userService } from '../services/userService';
import { logger } from '../utils/logger';

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      shareLocation: true,
      radius: 5000,
      preciseSharing: false,
      invisibleMode: false,

      setShareLocation: (shareLocation) => {
        set({ shareLocation });
        userService.updateSettings({ locationSharingEnabled: shareLocation, radius: get().radius }).catch((err) => {
          logger.error(err);
        });
      },
      setRadius: (radius) => {
        set({ radius });
        userService.updateSettings({ radius, locationSharingEnabled: get().shareLocation }).catch((err) => {
          logger.error(err);
        });
      },
      setPreciseSharing: (preciseSharing) => {
        set({ preciseSharing });
      },
      setInvisibleMode: (invisibleMode) => {
        set({ invisibleMode });
        userService.updateSettings({ invisibleMode, locationSharingEnabled: get().shareLocation, radius: get().radius }).catch((err) => {
          logger.error(err);
        });
      },
    }),
    { name: 'location-storage' }
  )
);
