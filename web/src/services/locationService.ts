import { api, type ApiResponse } from './api';

interface LocationData {
  latitude: number;
  longitude: number;
  radius: number;
}

interface NearbyUser {
  id: string;
  name: string;
  distance?: number;
}

export const locationService = {
  async updateLocation(data: LocationData): Promise<void> {
    const response = await api.post<ApiResponse>('/api/location/update', data);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update location');
    }
  },

  async getNearbyUsers(data: LocationData): Promise<NearbyUser[]> {
    const response = await api.get<ApiResponse<NearbyUser[]>>('/api/location/nearby', {
      params: {
        lat: data.latitude,
        lng: data.longitude,
        radius: data.radius,
      },
    });
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    return [];
  },

  async getFriendsLocationStatus(): Promise<{ id: string; name: string; status: 'nearby' | 'offline' }[]> {
    const response = await api.get<ApiResponse<{ id: string; name: string; status: 'nearby' | 'offline' }[]>>('/api/location/friends-status');
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    return [];
  },
};

// Browser Geolocation helper
export const geoService = {
  getCurrentPosition(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(new Error(error.message));
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 60000, // 1 minute cache
        }
      );
    });
  },

  watchPosition(
    onSuccess: (pos: { latitude: number; longitude: number }) => void,
    onError: (error: GeolocationPositionError | Error) => void
  ): number | null {
    if (!navigator.geolocation) {
      onError(new Error('Geolocation is not supported'));
      return null;
    }

    return navigator.geolocation.watchPosition(
      (position) => {
        onSuccess({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => onError(new Error(error.message)),
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 30000, // 30 seconds
      }
    );
  },

  clearWatch(watchId: number): void {
    if (navigator.geolocation && watchId) {
      navigator.geolocation.clearWatch(watchId);
    }
  },
};

export default locationService;
