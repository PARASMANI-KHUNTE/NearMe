import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const BASE_URL = 'http://localhost:3000'; // Replace with actual backend IP later

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  let token = null;
  if (Platform.OS !== 'web') {
    try { token = await SecureStore.getItemAsync('token'); } catch (e) {}
  } else {
    token = localStorage.getItem('token');
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle global errors, e.g., 401 unauthenticated
    return Promise.reject(error);
  }
);
