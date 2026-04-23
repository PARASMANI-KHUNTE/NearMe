import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { env } from '../config/env';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';

class ApiService {
  private api: AxiosInstance;
  private retryDelay = 1000; // Start with 1 second
  private maxRetries = 3;

  constructor() {
    this.api = axios.create({
      baseURL: env.API_BASE_URL,
      timeout: 10000, // 10 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private async setupInterceptors() {
    // Request interceptor: attach JWT token
    this.api.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        try {
          const token = await SecureStore.getItemAsync(TOKEN_KEY);
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Error retrieving token:', error);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor: handle errors and retries
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const config = error.config as (InternalAxiosRequestConfig & { _retry?: boolean; _retryCount?: number });

        // Handle 401 errors
        if (error.response?.status === 401) {
          // Token expired or invalid
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          // TODO: Trigger logout in auth store
          console.log('Token expired, cleared from storage');
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
          console.log(`Retrying request (${config._retryCount}/${this.maxRetries}) after ${delay}ms`);

          return new Promise((resolve) =>
            setTimeout(() => resolve(this.api.request(config)), delay)
          );
        }

        // Global error handling
        this.handleGlobalError(error);

        return Promise.reject(error);
      }
    );
  }

  private shouldRetry(error: any): boolean {
    // Retry on network errors, timeouts, or 5xx server errors
    return (
      !error.response || // Network error
      error.code === 'ECONNABORTED' || // Timeout
      (error.response.status >= 500 && error.response.status < 600) // 5xx
    );
  }

  private handleGlobalError(error: any): void {
    // Global error handling logic
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      console.error(`API Error ${status}:`, data?.message || error.message);

      // You can emit events or update global state here
      // For example, show toast notifications
    } else if (error.request) {
      // Network error
      console.error('Network Error:', error.message);
    } else {
      // Other error
      console.error('Request Error:', error.message);
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
}

export const api = new ApiService().instance;
