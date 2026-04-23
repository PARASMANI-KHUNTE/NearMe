import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocationStore } from '../store/locationStore';
import { useFriendStore } from '../store/friendStore';
import { locationService, geoService } from '../services/locationService';
import { socketService } from '../services/socketService';

interface LocationState {
  loading: boolean;
  error: string | null;
  isTracking: boolean;
  lastUpdate: Date | null;
}

export function useLocationTracker() {
  const { shareLocation, radius, preciseSharing } = useLocationStore();
  const { setFriends } = useFriendStore();
  const [state, setState] = useState<LocationState>({
    loading: true,
    error: null,
    isTracking: false,
    lastUpdate: null,
  });
  
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateLocation = useCallback(async () => {
    if (!shareLocation) {
      setState(prev => ({ ...prev, isTracking: false, loading: false }));
      return;
    }

    try {
      const position = await geoService.getCurrentPosition();
      
      // Send to backend
      await locationService.updateLocation({
        latitude: position.latitude,
        longitude: position.longitude,
        radius,
      });

      // Send to socket for real-time
      socketService.sendLocation(position.latitude, position.longitude, radius);

      // Fetch friends location status from server
      const friendsStatus = await locationService.getFriendsLocationStatus();

      // Update friend store with nearby status
      const currentFriends = useFriendStore.getState().friends;
      setFriends(
        currentFriends.map((friend) => {
          const friendStatus = friendsStatus.find(f => f.id === friend.id);
          return {
            ...friend,
            status: friendStatus?.status || 'offline',
          };
        })
      );

      setState(prev => ({
        ...prev,
        isTracking: true,
        loading: false,
        error: null,
        lastUpdate: new Date(),
      }));
    } catch (error: unknown) {
      console.error('Location error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to get location',
      }));
    }
  }, [shareLocation, radius, setFriends]);

  const startTracking = useCallback(() => {
    if (!shareLocation || !navigator.geolocation) return;

    // Initial update
    updateLocation();

    // Setup watch position
    watchIdRef.current = geoService.watchPosition(
      (pos) => {
        socketService.sendLocation(pos.latitude, pos.longitude, radius);
      },
      (error) => {
        console.error('Watch position error:', error);
      }
    );

    // Setup interval for periodic updates (every 30 seconds)
    intervalRef.current = setInterval(updateLocation, 30000);

    setState(prev => ({ ...prev, isTracking: true }));
  }, [shareLocation, radius, updateLocation]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      geoService.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setState(prev => ({ ...prev, isTracking: false }));
  }, []);

  // Handle shareLocation changes
  useEffect(() => {
    if (shareLocation) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => stopTracking();
  }, [shareLocation, startTracking, stopTracking]);

  // Manual refresh
  const refresh = useCallback(() => {
    setState(prev => ({ ...prev, loading: true }));
    updateLocation();
  }, [updateLocation]);

  return {
    ...state,
    refresh,
    canPreciseShare: shareLocation && preciseSharing,
  };
}

export default useLocationTracker;
