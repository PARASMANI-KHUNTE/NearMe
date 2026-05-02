import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { User } from './authService';

export const TOKEN_KEY = 'auth_token';
export const USER_KEY = 'auth_user';

const canUseSecureStore = Platform.OS !== 'web';

export const setStoredToken = async (token: string): Promise<void> => {
  if (canUseSecureStore) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    return;
  }

  await AsyncStorage.setItem(TOKEN_KEY, token);
};

export const getStoredToken = async (): Promise<string | null> => {
  if (canUseSecureStore) {
    return SecureStore.getItemAsync(TOKEN_KEY);
  }

  return AsyncStorage.getItem(TOKEN_KEY);
};

export const removeStoredToken = async (): Promise<void> => {
  if (canUseSecureStore) {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    return;
  }

  await AsyncStorage.removeItem(TOKEN_KEY);
};

export const setStoredUser = async (user: User): Promise<void> => {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getStoredUser = async (): Promise<User | null> => {
  const userJson = await AsyncStorage.getItem(USER_KEY);
  return userJson ? JSON.parse(userJson) : null;
};

export const removeStoredUser = async (): Promise<void> => {
  await AsyncStorage.removeItem(USER_KEY);
};

export const clearStoredAuth = async (): Promise<void> => {
  await Promise.all([removeStoredToken(), removeStoredUser()]);
};
