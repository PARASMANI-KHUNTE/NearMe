import { api } from './api';
import * as Location from 'expo-location';
import { logger } from '../utils/logger';

export interface LocationUpdateResponse {
  _id: string;
  userId: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export class LocationService {
  private static locationSubscription: Location.LocationSubscription | null = null;
  private static updateInterval: number = 45000; // 45 seconds default

  static async getForegroundPermissionStatus(): Promise<Location.PermissionStatus> {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status;
  }

  /**
   * Request location permissions
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      logger.error('Location permission request error:', error);
      return false;
    }
  }

  /**
   * Get current location
   */
  static async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return location;
    } catch (error: any) {
      logger.error('Get current location error:', error);
      throw new Error(error.message || 'Failed to get location');
    }
  }

  /**
   * Start periodic location updates
   * @param intervalMs - Update interval in milliseconds (default 60s)
   * @param onUpdate - Callback when location is updated
   */
  static async startLocationUpdates(
    intervalMs: number = 60000,
    onUpdate?: (location: LocationUpdateResponse | null) => void
  ): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      this.updateInterval = intervalMs;

      // Stop existing subscription
      this.stopLocationUpdates();

      // Start watching position
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: intervalMs,
          distanceInterval: 50, // Minimum 50m movement
        },
        async (location) => {
          try {
            const { longitude, latitude } = location.coords;
            const result = await this.updateLocation(longitude, latitude);
            if (onUpdate) {
              onUpdate(result);
            }
          } catch (error) {
            logger.error('Location update failed:', error);
          }
        }
      );
    } catch (error: any) {
      logger.error('Start location updates error:', error);
      throw new Error(error.message || 'Failed to start location updates');
    }
  }

  /**
   * Stop location updates
   */
  static stopLocationUpdates(): void {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
  }

  /**
   * Update user's current location
   * Backend may skip update if movement < threshold
   */
  static async updateLocation(longitude: number, latitude: number): Promise<LocationUpdateResponse | null> {
    try {
      const response = await api.post('/location/update', { longitude, latitude });
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update location');
      }
      return response.data.data;
    } catch (error: any) {
      logger.error('Update location error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Update location failed');
    }
  }
}
