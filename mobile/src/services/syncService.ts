import NetInfo from '@react-native-community/netinfo';
import { cacheService, CACHE_KEYS } from './cacheService';
import { api } from './api';
import { logger } from '../utils/logger';

interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  data?: any;
  timestamp: number;
  retryCount: number;
}

class SyncService {
  private syncQueue: SyncOperation[] = [];
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadSyncQueue();
    this.setupNetworkListener();
  }

  /**
   * Setup network state listener
   */
  private setupNetworkListener(): void {
    NetInfo.addEventListener(state => {
      if (state.isConnected && this.syncQueue.length > 0) {
        this.sync();
      }
    });
  }

  /**
   * Load sync queue from storage
   */
  private async loadSyncQueue(): Promise<void> {
    try {
      const queueData = await cacheService.get<SyncOperation[]>('sync_queue');
      if (queueData) {
        this.syncQueue = queueData;
        logger.info(`Loaded ${this.syncQueue.length} pending sync operations`);
      }
    } catch (error) {
      logger.error('Failed to load sync queue:', error);
    }
  }

  /**
   * Save sync queue to storage
   */
  private async saveSyncQueue(): Promise<void> {
    try {
      await cacheService.set('sync_queue', this.syncQueue, 24 * 60 * 60 * 1000); // 24 hours
    } catch (error) {
      logger.error('Failed to save sync queue:', error);
    }
  }

  /**
   * Add operation to sync queue
   */
  async queueOperation(
    type: 'create' | 'update' | 'delete',
    endpoint: string,
    data?: any
  ): Promise<void> {
    const operation: SyncOperation = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      endpoint,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.syncQueue.push(operation);
    await this.saveSyncQueue();
    this.notifyListeners();

    logger.info(`Queued ${type} operation for ${endpoint}`);

    // Try to sync immediately if online
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      this.sync();
    }
  }

  /**
   * Sync all pending operations
   */
  async sync(): Promise<void> {
    if (this.isSyncing || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;
    logger.info(`Starting sync of ${this.syncQueue.length} operations`);

    const failedOperations: SyncOperation[] = [];

    for (const operation of this.syncQueue) {
      try {
        await this.executeOperation(operation);
        logger.info(`Successfully synced ${operation.type} operation for ${operation.endpoint}`);
      } catch (error) {
        logger.error(`Failed to sync operation ${operation.id}:`, error);

        operation.retryCount++;
        if (operation.retryCount < 3) {
          failedOperations.push(operation);
        } else {
          logger.error(`Operation ${operation.id} exceeded max retries, discarding`);
        }
      }
    }

    this.syncQueue = failedOperations;
    await this.saveSyncQueue();
    this.isSyncing = false;
    this.notifyListeners();

    logger.info(`Sync complete. ${failedOperations.length} operations remain queued`);
  }

  /**
   * Execute a single sync operation
   */
  private async executeOperation(operation: SyncOperation): Promise<void> {
    switch (operation.type) {
      case 'create':
        await api.post(operation.endpoint, operation.data);
        break;
      case 'update':
        await api.patch(operation.endpoint, operation.data);
        break;
      case 'delete':
        await api.delete(operation.endpoint);
        break;
    }
  }

  /**
   * Start periodic sync
   */
  startPeriodicSync(intervalMs: number = 60000): void {
    if (this.syncInterval) {
      this.stopPeriodicSync();
    }

    this.syncInterval = setInterval(() => {
      this.sync();
    }, intervalMs);

    logger.info(`Started periodic sync with ${intervalMs}ms interval`);
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      logger.info('Stopped periodic sync');
    }
  }

  /**
   * Get sync status
   */
  getStatus(): {
    isSyncing: boolean;
    queueLength: number;
    isOnline: boolean;
  } {
    return {
      isSyncing: this.isSyncing,
      queueLength: this.syncQueue.length,
      isOnline: false, // Will be updated by network listener
    };
  }

  /**
   * Clear sync queue
   */
  async clearQueue(): Promise<void> {
    this.syncQueue = [];
    await this.saveSyncQueue();
    this.notifyListeners();
    logger.info('Cleared sync queue');
  }

  /**
   * Subscribe to sync status changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  /**
   * Force refresh cached data
   */
  async refreshCache(): Promise<void> {
    try {
      // Refresh user profile
      const profileResponse = await api.get('/users/profile');
      if (profileResponse.data.success) {
        await cacheService.set(CACHE_KEYS.USER_PROFILE, profileResponse.data.data);
      }

      // Refresh friends list
      const friendsResponse = await api.get('/friends');
      if (friendsResponse.data.success) {
        await cacheService.set(CACHE_KEYS.FRIENDS_LIST, friendsResponse.data.data);
      }

      // Refresh notifications
      const notificationsResponse = await api.get('/notifications');
      if (notificationsResponse.data.success) {
        await cacheService.set(CACHE_KEYS.NOTIFICATIONS, notificationsResponse.data.data);
      }

      logger.info('Cache refreshed successfully');
    } catch (error) {
      logger.error('Failed to refresh cache:', error);
    }
  }
}

export const syncService = new SyncService();
