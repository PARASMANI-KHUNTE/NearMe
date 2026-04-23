import { create } from 'zustand';
import type { GeoPosition, FriendZoneData, RouteData } from '../../../types';

interface MapStore {
  userLocation: GeoPosition | null;
  nearbyFriends: FriendZoneData[];
  activeRoute: RouteData | null;
  isRoutingEnabled: boolean;
  setUserLocation: (location: GeoPosition | null) => void;
  setNearbyFriends: (friends: FriendZoneData[]) => void;
  setActiveRoute: (route: RouteData | null) => void;
  setIsRoutingEnabled: (enabled: boolean) => void;
  clearRoute: () => void;
}

export const useMapStore = create<MapStore>((set) => ({
  userLocation: null,
  nearbyFriends: [],
  activeRoute: null,
  isRoutingEnabled: false,

  setUserLocation: (userLocation) => set({ userLocation }),
  setNearbyFriends: (nearbyFriends) => set({ nearbyFriends }),
  setActiveRoute: (activeRoute) => set({ activeRoute }),
  setIsRoutingEnabled: (isRoutingEnabled) => set({ isRoutingEnabled }),
  clearRoute: () => set({ activeRoute: null, isRoutingEnabled: false }),
}));