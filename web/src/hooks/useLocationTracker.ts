import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocationStore } from '../store/locationStore';
import { useFriendStore } from '../store/friendStore';
import { locationService, geoService } from '../services/locationService';
import { socketService } from '../services/socketService';
import { logger } from '../utils/logger';

const LOCATION_UPDATE_INTERVAL = 45000; // 45 seconds
const MIN_DISTANCE_THRESHOLD = 50; // 50 meters

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
  const lastPositionRef = useRef<{ latitude: number; longitude: number } | null>(null);

  const shouldUpdate = useCallback((lat: number, lng: number): boolean => {
    if (!lastPositionRef.current) return true;
    const { latitude, longitude } = lastPositionRef.current;
    const dLat = lat - latitude;
    const dLng = lng - longitude;
    const distance = Math.sqrt(dLat * dLat + dLng * dLng) * 111000;
    return distance >= MIN_DISTANCE_THRESHOLD;
  }, []);

  const updateLocation = useCallback(async (position?: { latitude: number; longitude: number }) => {
    if (!shareLocation) {
      setState(prev => ({ ...prev, isTracking: false, loading: false }));
      return;
    }

    try {
      let lat: number, lng: number;
      if (position) {
        lat = position.latitude;
        lng = position.longitude;
      } else {
        const pos = await geoService.getCurrentPosition();
        lat = pos.latitude;
        lng = pos.longitude;
      }

      if (!shouldUpdate(lat, lng)) {
        socketService.sendLocation(lat, lng, radius);
        return;
      }

      lastPositionRef.current = { latitude: lat, longitude: lng };

      await locationService.updateLocation({
        latitude: lat,
        longitude: lng,
        radius,
      });

      socketService.sendLocation(lat, lng, radius);

      const friendsStatus = await locationService.getFriendsLocationStatus();

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
      logger.error('Location error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to get location',
      }));
    }
  }, [shareLocation, radius, setFriends, shouldUpdate]);

  const startTracking = useCallback(() => {
    if (!shareLocation || !navigator.geolocation) return;

    updateLocation();

    watchIdRef.current = geoService.watchPosition(
      (pos) => {
        socketService.sendLocation(pos.latitude, pos.longitude, radius);
        lastPositionRef.current = { latitude: pos.latitude, longitude: pos.longitude };
      },
      (error) => {
        logger.error('Watch position error:', error);
      }
    );

    intervalRef.current = setInterval(() => updateLocation(), LOCATION_UPDATE_INTERVAL);

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

    lastPositionRef.current = null;
    setState(prev => ({ ...prev, isTracking: false }));
  }, []);

  useEffect(() => {
    if (shareLocation) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => stopTracking();
  }, [shareLocation, startTracking, stopTracking]);

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
