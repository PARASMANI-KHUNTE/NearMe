import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { env } from '../config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { clearStoredAuth, getStoredToken } from './authStorage';
import { logger } from '../utils/logger';
const OFFLINE_QUEUE_KEY = 'offline_queue';

interface QueuedRequest {
  id: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  url: string;
  data?: any;
  config?: any;
  timestamp: number;
}

class ApiService {
  private api: AxiosInstance;
  private retryDelay = 1000; // Start with 1 second
  private maxRetries = 3;
  private isOnline = true;
  private offlineQueue: QueuedRequest[] = [];
  private isProcessingQueue = false;

  constructor() {
    logger.info('Api initializing', { baseURL: env.API_BASE_URL, socketURL: env.SOCKET_URL });

    this.api = axios.create({
      baseURL: env.API_BASE_URL,
      timeout: 10000, // 10 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.setupNetworkListener();
    this.loadOfflineQueue();
  }

  private async setupInterceptors() {
    let isRefreshing = false;
    let failedQueue: Array<{
      resolve: (value?: unknown) => void;
      reject: (reason?: unknown) => void;
    }> = [];

    const processQueue = (error: Error | null, token: string | null = null) => {
      failedQueue.forEach((prom) => {
        if (error) {
          prom.reject(error);
        } else {
          prom.resolve(token);
        }
      });
      failedQueue = [];
    };

    // Request interceptor: attach JWT token
    this.api.interceptors.request.use(
        async (config: InternalAxiosRequestConfig) => {
        logger.debug('Api request start', { method: config.method?.toUpperCase(), baseURL: config.baseURL, url: config.url });

        try {
          const token = await getStoredToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          logger.error('Error retrieving token:', error);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor: handle errors with token refresh
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const config = error.config as (InternalAxiosRequestConfig & {
          _retry?: boolean;
          _retryCount?: number
        });

        logger.error('Api response error', {
          method: config?.method?.toUpperCase(),
          baseURL: config?.baseURL,
          url: config?.url,
          code: error.code,
          message: error.message,
          status: error.response?.status,
        });

        if (error.response?.status === 401 && !config._retry) {
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                if (config.headers) {
                  config.headers.Authorization = `Bearer ${token}`;
                }
                return this.api.request(config);
              })
              .catch((err) => Promise.reject(err));
          }

          config._retry = true;
          isRefreshing = true;

          try {
            const { default: axiosImport } = await import('axios');
            const { data } = await axiosImport.post(
              `${this.api.defaults.baseURL}/auth/refresh`,
              {},
              { withCredentials: true }
            );

            const newToken = data.data.token;
            const { setStoredToken } = await import('./authStorage');
            await setStoredToken(newToken);

            if (config.headers) {
              config.headers.Authorization = `Bearer ${newToken}`;
            }

            processQueue(null, newToken);
            return this.api.request(config);
          } catch (refreshError) {
            processQueue(new Error('Token refresh failed'), null);
            await clearStoredAuth();
            try {
              const { useAuthStore } = await import('../store/authStore');
              await useAuthStore.getState().logout();
            } catch (logoutError) {
              logger.error('Failed to clear auth state after refresh failure:', logoutError);
            }
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        }

        if (error.response?.status === 401 && config._retry) {
          await clearStoredAuth();
          try {
            const { useAuthStore } = await import('../store/authStore');
            await useAuthStore.getState().logout();
          } catch (logoutError) {
            logger.error('Failed to clear auth state after 401:', logoutError);
          }
          return Promise.reject(error);
        }

        // Retry logic for network errors or 5xx
        if (
          !config._retry &&
          this.shouldRetry(error) &&
          (config._retryCount || 0) < this.maxRetries
        ) {
          config._retry = true;
          config._retryCount = (config._retryCount || 0) + 1;

          const delay = this.retryDelay * Math.pow(2, config._retryCount - 1); // Exponential backoff
          logger.info(`Retrying request (${config._retryCount}/${this.maxRetries}) after ${delay}ms`);

          return new Promise((resolve) =>
            setTimeout(() => resolve(this.api.request(config)), delay)
          );
        }

        // Handle offline scenario
        if (!this.isOnline && this.canQueueRequest(config)) {
          logger.info('Device offline, queuing request');
          await this.queueRequest(config);
          return Promise.reject(new Error('Device offline - request queued'));
        }

        // Global error handling
        this.handleGlobalError(error);

        return Promise.reject(error);
      }
    );
  }

  private setupNetworkListener() {
    NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected ?? false;
      logger.info('Network status changed:', this.isOnline ? 'online' : 'offline');

      if (this.isOnline && this.offlineQueue.length > 0) {
        this.processOfflineQueue();
      }
    });
  }

  private shouldRetry(error: any): boolean {
    // Retry on network errors, timeouts, or 5xx server errors
    return (
      !error.response || // Network error
      error.code === 'ECONNABORTED' || // Timeout
      (error.response.status >= 500 && error.response.status < 600) // 5xx
    );
  }

  private canQueueRequest(config: InternalAxiosRequestConfig): boolean {
    // Only queue POST, PATCH, DELETE requests (not GET)
    const method = config.method?.toUpperCase();
    return method === 'POST' || method === 'PATCH' || method === 'DELETE';
  }

  private async queueRequest(config: InternalAxiosRequestConfig): Promise<void> {
    const queuedRequest: QueuedRequest = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      method: config.method?.toUpperCase() as any,
      url: config.url || '',
      data: config.data,
      config: {
        headers: config.headers,
        params: config.params,
      },
      timestamp: Date.now(),
    };

    this.offlineQueue.push(queuedRequest);
    await this.saveOfflineQueue();
  }

  private async processOfflineQueue(): Promise<void> {
    if (this.isProcessingQueue || this.offlineQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    logger.info(`Processing ${this.offlineQueue.length} queued requests`);

    const failedRequests: QueuedRequest[] = [];

    for (const request of this.offlineQueue) {
      try {
        await this.executeRequest(request);
      } catch (error) {
        logger.error('Failed to process queued request:', request.id, error);
        failedRequests.push(request);
      }
    }

    this.offlineQueue = failedRequests;
    await this.saveOfflineQueue();
    this.isProcessingQueue = false;

    logger.info(`Queue processing complete. ${failedRequests.length} requests remain queued`);
  }

  private async executeRequest(request: QueuedRequest): Promise<any> {
    switch (request.method) {
      case 'POST':
        return this.api.post(request.url, request.data, request.config);
      case 'PATCH':
        return this.api.patch(request.url, request.data, request.config);
      case 'DELETE':
        return this.api.delete(request.url, request.config);
      default:
        throw new Error(`Unsupported method: ${request.method}`);
    }
  }

  private async saveOfflineQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.offlineQueue));
    } catch (error) {
      logger.error('Failed to save offline queue:', error);
    }
  }

  private async loadOfflineQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      if (queueData) {
        this.offlineQueue = JSON.parse(queueData);
        logger.info(`Loaded ${this.offlineQueue.length} queued requests`);
      }
    } catch (error) {
      logger.error('Failed to load offline queue:', error);
    }
  }

  private handleGlobalError(error: any): void {
    // Global error handling logic
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      logger.error(`API Error ${status}:`, data?.message || error.message);

      // You can emit events or update global state here
      // For example, show toast notifications
    } else if (error.request) {
      // Network error
      logger.error('Network Error:', error.message);
    } else {
      // Other error
      logger.error('Request Error:', error.message);
    }
  }

  // Expose axios instance methods
  get instance(): AxiosInstance {
    return this.api;
  }

  // Helper methods for common operations
  async get<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return this.api.get(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.api.post(url, data, config);
  }

  async patch<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.api.patch(url, data, config);
  }

  async delete<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return this.api.delete(url, config);
  }

  // Get queue status
  getQueueStatus(): { length: number; isProcessing: boolean } {
    return {
      length: this.offlineQueue.length,
      isProcessing: this.isProcessingQueue,
    };
  }

  // Clear offline queue
  async clearQueue(): Promise<void> {
    this.offlineQueue = [];
    await this.saveOfflineQueue();
  }
}

// Create a proxy to lazy-initialize the ApiService on first use
let apiInstance: AxiosInstance | null = null;

export const api = new Proxy({} as AxiosInstance, {
  get: (target, prop) => {
    if (!apiInstance) {
      apiInstance = new ApiService().instance;
    }
    return (apiInstance as any)[prop];
  },
  apply: (target, thisArg, argumentsList) => {
    if (!apiInstance) {
      apiInstance = new ApiService().instance;
    }
    return (apiInstance as any)(...argumentsList);
  }
});
