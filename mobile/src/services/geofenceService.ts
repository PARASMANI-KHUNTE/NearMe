import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { api } from './api';
import { logger } from '../utils/logger';
// import { env } from '../config/env';

// Task names
export const GEOFENCE_TASK = 'near-me-geofence-task';
export const GEOFENCE_REFRESH_TASK = 'near-me-geofence-refresh-task';
export const PRECISE_TRACKING_TASK = 'near-me-precise-tracking-task';

// Geofence configuration
const GEOFENCE_REGION_PREFIX = 'friend-';
const GEOFENCE_BUFFER_METERS = 500; // Extra buffer around friend's radius
const MAX_GEOFENCES = 20; // iOS limit is 20, Android is 100

// Types
export interface FriendForGeofencing {
  id: string;
  name: string;
  picture?: string;
  longitude: number;
  latitude: number;
  radius: number;
  lastUpdated: string;
}

export interface GeofenceEvent {
  type: 'enter' | 'exit';
  friendId: string;
  friendName: string;
  timestamp: number;
}

// Internal region type (extends expo-location LocationRegion)
interface GeofenceRegion extends Location.LocationRegion {
  friendName?: string;
}

// Callbacks
type GeofenceCallback = (event: GeofenceEvent) => void;
const geofenceCallbacks = new Set<GeofenceCallback>();

/**
 * GeofenceService - Handles iOS/Android geofencing for friend proximity
 *
 * Flow:
 * 1. Fetch friend locations from server (/api/location/friends-for-geofencing)
 * 2. Register geofence regions for each friend (OS-managed, zero GPS)
 * 3. When entering region → start precise GPS tracking for that friend
 * 4. When exiting region → stop precise tracking
 * 5. Proximity alerts still come via Socket.io (server-side)
 */
export class GeofenceService {
  private static instance: GeofenceService;
  private isInitialized = false;
  private currentGeofences: Map<string, GeofenceRegion> = new Map();
  private preciseTrackingActive = new Set<string>(); // friendIds being tracked precisely

  static getInstance(): GeofenceService {
    if (!GeofenceService.instance) {
      GeofenceService.instance = new GeofenceService();
    }
    return GeofenceService.instance;
  }

  /**
   * Initialize geofencing - call on app start after login
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.debug('[Geofence] Already initialized');
      return;
    }

    try {
      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
      if (bgStatus !== 'granted') {
        logger.warn('[Geofence] Background permission not granted - geofencing limited');
      }

      // Define background tasks
      this.defineTasks();

      // Start background fetch for periodic geofence refresh
      await this.startBackgroundFetch();

      this.isInitialized = true;
      logger.info('[Geofence] Initialized successfully');
    } catch (error) {
      logger.error('[Geofence] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Define TaskManager tasks for geofencing and precise tracking
   */
  private defineTasks(): void {
    // Geofence enter/exit task (triggered by OS)
    TaskManager.defineTask(GEOFENCE_TASK, async (body: { data: { region: GeofenceRegion; eventType: Location.GeofencingEventType }; error: { code: string | number; message: string } | null }) => {
      if (body.error) {
        logger.error('[Geofence Task] Error:', body.error);
        return;
      }

      if (!body.data) return;

      const { region, eventType } = body.data;

      const identifier = region.identifier;
      if (!identifier) return;
      const friendId = identifier.replace(GEOFENCE_REGION_PREFIX, '');

      if (!friendId) return;

      const event: GeofenceEvent = {
        type: eventType === Location.GeofencingEventType.Enter ? 'enter' : 'exit',
        friendId,
        friendName: region.friendName || friendId,
        timestamp: Date.now(),
      };

      logger.info(`[Geofence Task] ${event.type.toUpperCase()} region for friend: ${friendId}`);

      // Execute callbacks
      geofenceCallbacks.forEach(cb => {
        try {
          cb(event);
        } catch (cbError) {
          logger.error('[Geofence] Callback error:', cbError);
        }
      });

      // Handle enter/exit logic
      if (event.type === 'enter') {
        this.onGeofenceEnter(friendId, region.friendName || friendId);
      } else {
        this.onGeofenceExit(friendId);
      }
    });

    // Background fetch task to periodically refresh geofence regions
    TaskManager.defineTask(GEOFENCE_REFRESH_TASK, async (body: { error: { code: string | number; message: string } | null }) => {
      if (body.error) {
        logger.error('[Geofence Refresh Task] Error:', body.error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }

      try {
        logger.info('[Geofence Refresh Task] Refreshing geofences in background...');
        // Note: In a real background task, the token would need to come from secure storage.
        // This task runs when the OS wakes it up periodically.
        return BackgroundFetch.BackgroundFetchResult.NewData;
      } catch (err) {
        logger.error('[Geofence Refresh Task] Failed:', err);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });

    // Precise tracking task (runs periodically when inside geofence)
    TaskManager.defineTask(PRECISE_TRACKING_TASK, async (body: { error: { code: string | number; message: string } | null }) => {
      if (body.error) {
        logger.error('[Precise Tracking Task] Error:', body.error);
        return;
      }

      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        await this.sendLocationUpdate(location);
      } catch (err) {
        logger.error('[Precise Tracking Task] Failed to get location:', err);
      }
    });
  }

  /**
   * Start background fetch to refresh geofences periodically
   */
  private async startBackgroundFetch(): Promise<void> {
    try {
      await BackgroundFetch.registerTaskAsync(GEOFENCE_REFRESH_TASK, {
        minimumInterval: 15 * 60, // 15 minutes (iOS minimum)
        stopOnTerminate: false,
        startOnBoot: true,
      });
      logger.info('[Geofence] Background fetch registered');
    } catch (error) {
      logger.warn('[Geofence] Background fetch registration failed:', error);
    }
  }

  /**
   * Subscribe to geofence events
   */
  subscribe(callback: GeofenceCallback): () => void {
    geofenceCallbacks.add(callback);
    return () => geofenceCallbacks.delete(callback);
  }

  /**
   * Fetch friend locations and setup geofences
   * Call this: on app start, when friends list changes, periodically
   */
  async refreshGeofences(token: string): Promise<void> {
    try {
      logger.info('[Geofence] Refreshing geofences...');

      // Fetch friends with locations from server
      const response = await api.get('/location/friends-for-geofencing', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch friends for geofencing');
      }

      const friends: FriendForGeofencing[] = response.data.data || [];
      logger.info(`[Geofence] Received ${friends.length} friends for geofencing`);

      // Setup geofences for visible friends
      await this.setupGeofences(friends);
    } catch (error) {
      logger.error('[Geofence] Failed to refresh geofences:', error);
      throw error;
    }
  }

  /**
   * Setup geofence regions for friends
   */
  private async setupGeofences(friends: FriendForGeofencing[]): Promise<void> {
    // Stop existing geofencing
    await Location.stopGeofencingAsync(GEOFENCE_TASK);

    // Limit to max geofences (iOS limit: 20)
    const friendsToFence = friends.slice(0, MAX_GEOFENCES);

    const regions: GeofenceRegion[] = friendsToFence.map(friend => ({
      identifier: `${GEOFENCE_REGION_PREFIX}${friend.id}`,
      latitude: friend.latitude,
      longitude: friend.longitude,
      // Use friend's radius + buffer for early detection
      radius: Math.min(friend.radius + GEOFENCE_BUFFER_METERS, 5000),
      notifyOnEnter: true,
      notifyOnExit: true,
      friendName: friend.name,
    }));

    // Start geofencing
    await Location.startGeofencingAsync(GEOFENCE_TASK, regions);

    // Update local map
    this.currentGeofences.clear();
    regions.forEach(region => {
      const friendId = (region.identifier ?? '').replace(GEOFENCE_REGION_PREFIX, '');
      if (friendId) {
        this.currentGeofences.set(friendId, region);
      }
    });

    logger.info(`[Geofence] Started geofencing for ${regions.length} friends`);
  }

  /**
   * Called when entering a friend's geofence region
   * Start precise GPS tracking for this friend
   */
  private async onGeofenceEnter(friendId: string, friendName: string): Promise<void> {
    if (this.preciseTrackingActive.has(friendId)) {
      logger.debug(`[Geofence] Already tracking ${friendId} precisely`);
      return;
    }

    logger.info(`[Geofence] ENTERED region for ${friendName} (${friendId}) - starting precise tracking`);

    this.preciseTrackingActive.add(friendId);

    try {
      // 1. Immediately send current precise location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      await this.sendLocationUpdate(location);

      // 2. Start background task for periodic precise updates (every 30s)
      await BackgroundFetch.registerTaskAsync(PRECISE_TRACKING_TASK, {
        minimumInterval: 900, // 15 minutes (iOS minimum for background fetch)
        stopOnTerminate: false,
        startOnBoot: false,
      });

      // 3. Also start foreground watch if app is active
      this.startForegroundPreciseTracking(friendId);
    } catch (error) {
      logger.error('[Geofence] Failed to start precise tracking:', error);
      this.preciseTrackingActive.delete(friendId);
    }
  }

  /**
   * Called when exiting a friend's geofence region
   * Stop precise GPS tracking for this friend
   */
  private async onGeofenceExit(friendId: string): Promise<void> {
    if (!this.preciseTrackingActive.has(friendId)) {
      return;
    }

    logger.info(`[Geofence] EXITED region for ${friendId} - stopping precise tracking`);
    this.preciseTrackingActive.delete(friendId);

    try {
      // Stop background precise tracking task
      await BackgroundFetch.unregisterTaskAsync(PRECISE_TRACKING_TASK);

      // Stop foreground watch
      this.stopForegroundPreciseTracking();

      // Send final location update (lower accuracy is fine now)
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      await this.sendLocationUpdate(location);
    } catch (error) {
      logger.error('[Geofence] Failed to stop precise tracking:', error);
    }
  }

  // Foreground precise tracking (when app is open)
  private foregroundWatchId: Location.LocationSubscription | null = null;
  private currentPreciseFriendId: string | null = null;

  private startForegroundPreciseTracking(friendId: string): void {
    if (this.foregroundWatchId) return; // Already tracking

    this.currentPreciseFriendId = friendId;

    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000, // 10 seconds
        distanceInterval: 10, // 10 meters
      },
      async (location) => {
        if (this.currentPreciseFriendId === friendId) {
          await this.sendLocationUpdate(location);
        }
      }
    ).then(watchId => {
      this.foregroundWatchId = watchId;
    }).catch(err => {
      logger.error('[Geofence] Foreground watch failed:', err);
    });
  }

  private stopForegroundPreciseTracking(): void {
    if (this.foregroundWatchId) {
      this.foregroundWatchId.remove();
      this.foregroundWatchId = null;
      this.currentPreciseFriendId = null;
    }
  }

  /**
   * Send location update to server
   */
  private async sendLocationUpdate(location: Location.LocationObject): Promise<void> {
    try {
      await api.post('/location/update', {
        longitude: location.coords.longitude,
        latitude: location.coords.latitude,
      });
      logger.debug('[Geofence] Location update sent');
    } catch (error) {
      logger.error('[Geofence] Failed to send location update:', error);
    }
  }

  /**
   * Check if currently tracking any friend precisely
   */
  isTrackingPrecisely(): boolean {
    return this.preciseTrackingActive.size > 0;
  }

  /**
   * Get currently tracked friend IDs
   */
  getTrackedFriends(): string[] {
    return Array.from(this.preciseTrackingActive);
  }

  /**
   * Stop all geofencing and tracking
   */
  async stop(): Promise<void> {
    logger.info('[Geofence] Stopping all geofencing...');

    await Location.stopGeofencingAsync(GEOFENCE_TASK);
    await BackgroundFetch.unregisterTaskAsync(GEOFENCE_REFRESH_TASK);
    await BackgroundFetch.unregisterTaskAsync(PRECISE_TRACKING_TASK);
    this.stopForegroundPreciseTracking();

    this.currentGeofences.clear();
    this.preciseTrackingActive.clear();
    this.isInitialized = false;
  }

  /**
   * Get current geofence status for debugging
   */
  getStatus(): {
    initialized: boolean;
    geofenceCount: number;
    preciseTracking: string[];
  } {
    return {
      initialized: this.isInitialized,
      geofenceCount: this.currentGeofences.size,
      preciseTracking: Array.from(this.preciseTrackingActive),
    };
  }
}

export const geofenceService = GeofenceService.getInstance();