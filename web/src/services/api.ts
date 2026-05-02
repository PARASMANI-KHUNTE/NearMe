import axios, { type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import { env } from '../config/env';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

interface QueuedRequest {
  id: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  url: string;
  data?: unknown;
  config?: AxiosRequestConfig;
  timestamp: number;
}

class ApiService {
  private api: ReturnType<typeof axios.create>;
  private retryDelay = 1000;
  private maxRetries = 3;
  private isOnline = navigator.onLine;
  private offlineQueue: QueuedRequest[] = [];
  private isProcessingQueue = false;

  constructor() {
    this.api = axios.create({
      baseURL: env.apiBaseUrl,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    this.setupInterceptors();
    this.setupNetworkListener();
    this.loadOfflineQueue();
  }

  private setupInterceptors() {
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

    // Request interceptor - attach JWT
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = sessionStorage.getItem('token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors with token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiResponse>) => {
        const config = error.config as (InternalAxiosRequestConfig & {
          _retry?: boolean;
          _retryCount?: number;
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
            const { data } = await axios.post(
              `${this.api.defaults.baseURL}/auth/refresh`,
              {},
              { withCredentials: true }
            );

            const newToken = data.data.token;
            sessionStorage.setItem('token', newToken);

            if (config.headers) {
              config.headers.Authorization = `Bearer ${newToken}`;
            }

            processQueue(null, newToken);
            return this.api.request(config);
          } catch (refreshError) {
            processQueue(new Error('Token refresh failed'), null);
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');

            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        }

        if (error.response?.status === 401 && config._retry) {
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');

          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
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

          const delay = this.retryDelay * Math.pow(2, config._retryCount - 1);
          console.log(`Retrying request (${config._retryCount}/${this.maxRetries}) after ${delay}ms`);

          return new Promise((resolve) =>
            setTimeout(() => resolve(this.api.request(config)), delay)
          );
        }

        // Handle offline scenario
        if (!this.isOnline && this.canQueueRequest(config)) {
          console.log('Device offline, queuing request');
          await this.queueRequest(config);
          return Promise.reject(new Error('Device offline - request queued'));
        }

        return Promise.reject(error);
      }
    );
  }

  private setupNetworkListener() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('Network status changed: online');

      if (this.offlineQueue.length > 0) {
        this.processOfflineQueue();
      }
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Network status changed: offline');
    });
  }

  private shouldRetry(error: AxiosError): boolean {
    return (
      !error.response || // Network error
      error.code === 'ECONNABORTED' || // Timeout
      (error.response?.status ?? 0) >= 500 // 5xx
    );
  }

  private canQueueRequest(config: InternalAxiosRequestConfig): boolean {
    const method = config.method?.toUpperCase();
    return method === 'POST' || method === 'PATCH' || method === 'DELETE';
  }

  private async queueRequest(config: InternalAxiosRequestConfig): Promise<void> {
    const queuedRequest: QueuedRequest = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      method: config.method?.toUpperCase() as QueuedRequest['method'],
      url: config.url || '',
      data: config.data,
      config: {
        headers: config.headers,
        params: config.params,
      },
      timestamp: Date.now(),
    };

    this.offlineQueue.push(queuedRequest);
    this.saveOfflineQueue();
  }

  private async processOfflineQueue(): Promise<void> {
    if (this.isProcessingQueue || this.offlineQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    console.log(`Processing ${this.offlineQueue.length} queued requests`);

    const failedRequests: QueuedRequest[] = [];

    for (const request of this.offlineQueue) {
      try {
        await this.executeRequest(request);
      } catch (error) {
        console.error('Failed to process queued request:', request.id, error);
        failedRequests.push(request);
      }
    }

    this.offlineQueue = failedRequests;
    this.saveOfflineQueue();
    this.isProcessingQueue = false;

    console.log(`Queue processing complete. ${failedRequests.length} requests remain queued`);
  }

  private async executeRequest(request: QueuedRequest): Promise<unknown> {
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

  private saveOfflineQueue(): void {
    try {
      localStorage.setItem('offline_queue', JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  private loadOfflineQueue(): void {
    try {
      const queueData = localStorage.getItem('offline_queue');
      if (queueData) {
        this.offlineQueue = JSON.parse(queueData);
        console.log(`Loaded ${this.offlineQueue.length} queued requests`);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }

  get instance() {
    return this.api;
  }

  getQueueStatus(): { length: number; isProcessing: boolean } {
    return {
      length: this.offlineQueue.length,
      isProcessing: this.isProcessingQueue,
    };
  }

  clearQueue(): void {
    this.offlineQueue = [];
    this.saveOfflineQueue();
  }
}

const apiService = new ApiService();
export const api = apiService.instance;

// Error handler helper
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || 'An error occurred';
  }
  return 'An unexpected error occurred';
}

export default apiService;
