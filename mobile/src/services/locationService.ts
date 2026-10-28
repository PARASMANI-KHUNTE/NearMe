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
  private static updateInterval: number = 60000; // 60 seconds default (reduced for battery)
  private static pendingUpdates: { longitude: number; latitude: number; timestamp: number }[] = [];
  private static readonly MAX_PENDING = 10;

  static async getForegroundPermissionStatus(): Promise<Location.PermissionStatus> {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status;
  }

  /**
   * Request location permissions (foreground + background)
   */
  static async requestPermissions(requireBackground: boolean = false): Promise<boolean> {
    try {
      const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
      if (fgStatus !== 'granted') {
        return false;
      }

      if (requireBackground) {
        const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
        return bgStatus === 'granted';
      }

      return true;
    } catch (error) {
      logger.error('Location permission request error:', error);
      return false;
    }
  }

  /**
   * Get current location
   */
  static async getCurrentLocation(
    accuracy: Location.Accuracy = Location.Accuracy.Balanced
  ): Promise<Location.LocationObject | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy,
      });
      return location;
    } catch (error: any) {
      logger.error('Get current location error:', error);
      throw new Error(error.message || 'Failed to get location');
    }
  }

  /**
   * Start foreground location updates (for when app is open)
   * Uses balanced accuracy and longer intervals for battery efficiency
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

      // Start watching position with battery-friendly settings
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced, // NOT High - saves battery
          timeInterval: intervalMs,
          distanceInterval: 100, // 100m minimum movement (was 50m)
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
   * Start high-precision foreground tracking (for active meetups)
   * Uses high accuracy and shorter intervals
   */
  static async startPreciseTracking(
    intervalMs: number = 10000,
    onUpdate?: (location: LocationUpdateResponse | null) => void
  ): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      this.stopLocationUpdates();

      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: intervalMs,
          distanceInterval: 10,
        },
        async (location) => {
          try {
            const { longitude, latitude } = location.coords;
            const result = await this.updateLocation(longitude, latitude);
            if (onUpdate) {
              onUpdate(result);
            }
          } catch (error) {
            logger.error('Precise location update failed:', error);
          }
        }
      );
    } catch (error: any) {
      logger.error('Start precise tracking error:', error);
      throw new Error(error.message || 'Failed to start precise tracking');
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
   * Update user's current location.
   * On failure, queues the update for retry on the next successful call.
   * Backend may skip update if movement < threshold.
   */
  static async updateLocation(longitude: number, latitude: number): Promise<LocationUpdateResponse | null> {
    try {
      const response = await api.post('/location/update', { longitude, latitude });
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update location');
      }

      // Flush any pending updates now that connectivity is back
      this.flushPendingUpdates();

      return response.data.data;
    } catch (error: any) {
      // Queue for retry on network / server errors
      this.enqueuePending(longitude, latitude);
      logger.error('Update location error (queued for retry):', error);
      throw new Error(error.response?.data?.message || error.message || 'Update location failed');
    }
  }

  /**
   * Queue a failed location update for retry.
   * Keeps only the most recent MAX_PENDING entries.
   */
  private static enqueuePending(longitude: number, latitude: number): void {
    this.pendingUpdates.push({ longitude, latitude, timestamp: Date.now() });
    if (this.pendingUpdates.length > this.MAX_PENDING) {
      this.pendingUpdates = this.pendingUpdates.slice(-this.MAX_PENDING);
    }
    logger.debug(`[Location] ${this.pendingUpdates.length} update(s) queued`);
  }

  /**
   * Flush queued location updates in the background.
   * Only sends the most recent queued update (the rest are stale).
   */
  private static flushPendingUpdates(): void {
    if (this.pendingUpdates.length === 0) return;

    // Only the most recent queued point matters
    const latest = this.pendingUpdates[this.pendingUpdates.length - 1];
    this.pendingUpdates = [];

    // Fire-and-forget — don't re-throw or re-queue
    api.post('/location/update', { longitude: latest.longitude, latitude: latest.latitude }).catch((err) => {
      logger.warn('[Location] Failed to flush queued update:', err);
    });
  }

  /**
   * Check if currently tracking
   */
  static isTracking(): boolean {
    return this.locationSubscription !== null;
  }
}

