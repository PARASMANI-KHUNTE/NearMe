import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinkingOptions, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Location from 'expo-location';

import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useAppStore } from '../store/useAppStore';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import PermissionScreen from '../screens/PermissionScreen';
import { socketService } from '../services/socketService';
import { logger } from '../utils/logger';

const Stack = createNativeStackNavigator();

const linking: LinkingOptions<any> = {
  prefixes: ['nearme://'],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: 'login',
          Signup: 'signup',
          ForgotPassword: 'reset-password',
        },
      },
      Permission: 'permission',
      MainTabs: {
        screens: {
          Home: 'home',
          Map: 'map',
          Friends: 'friends',
          Notifications: 'notifications',
          Profile: 'profile',
        },
      },
    },
  },
};

const SplashScreen = () => (
  <View style={styles.splash}>
    <Text style={styles.splashText}>NearMe</Text>
    <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 20 }} />
  </View>
);

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  splashText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6366f1',
  },
});

export const AppNavigator = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const user = useAuthStore((state) => state.user);
  const initializeSocketListeners = useNotificationStore((state) => state.initializeSocketListeners);
  const shareLocation = useAppStore((state) => state.shareLocation);
  const [shouldShowPermissionGate, setShouldShowPermissionGate] = React.useState(false);

  logger.debug('[Navigator] render', {
    isAuthenticated,
    isLoading,
    hasUser: !!user,
    shareLocation,
    shouldShowPermissionGate,
    routeBranch: isLoading ? 'Splash' : !isAuthenticated ? 'Auth' : shouldShowPermissionGate ? 'Permission' : 'MainTabs',
  });

  // Get store functions outside of render to avoid circular dependencies
  const checkAuth = useCallback(() => {
    const authState = useAuthStore.getState();

    if (authState.isLoading || authState.isAuthenticated) {
      logger.debug('[Navigator] checkAuth skipped', {
        isLoading: authState.isLoading,
        isAuthenticated: authState.isAuthenticated,
      });
      return;
    }

    logger.debug('[Navigator] checkAuth callback invoked');
    authState.checkAuth();
  }, []);

  const syncPrefs = useCallback((settings: any) => {
    logger.debug('[Navigator] syncPrefs callback invoked', settings);
    useAppStore.getState().syncPreferences(settings);
  }, []);

  useEffect(() => {
    logger.debug('[Navigator] checkAuth effect start');
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user?.settings) {
      logger.debug('[Navigator] syncing user settings from auth store', user.settings);
      syncPrefs(user.settings);
    } else {
      logger.debug('[Navigator] no user settings to sync');
    }
  }, [user, syncPrefs]);

  useEffect(() => {
    const syncPermissionGate = async () => {
      logger.debug('[Navigator] permission gate effect start', { isAuthenticated, isLoading, shareLocation });

      if (!isAuthenticated || isLoading) {
        logger.debug('[Navigator] permission gate disabled by auth/loading state');
        setShouldShowPermissionGate(false);
        return;
      }

      if (!shareLocation) {
        logger.debug('[Navigator] permission gate disabled because sharing is off');
        setShouldShowPermissionGate(false);
        return;
      }

      const { status } = await Location.getForegroundPermissionsAsync();
      logger.debug('[Navigator] permission status resolved', status);
      setShouldShowPermissionGate(status !== 'granted');
    };

    void syncPermissionGate();
  }, [isAuthenticated, isLoading, shareLocation]);

  // Delay service connections to let UI settle
  useEffect(() => {
    if (!isAuthenticated || isLoading) {
      logger.debug('[Navigator] skipping delayed service start', { isAuthenticated, isLoading });
      return;
    }

    const timer = setTimeout(() => {
      logger.info('[Navigator] Starting services after delay...');

      socketService.connect()
        .then(() => {
          logger.info('[Navigator] Socket connected');
          initializeSocketListeners();
        })
        .catch(err => logger.warn('[Navigator] Socket skip:', err.message));

    }, 2000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading]);

  // Cleanup on logout
  useEffect(() => {
    return () => {
      socketService.disconnect();
    };
  }, []);

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoading ? (
          <Stack.Screen name="Splash" component={SplashScreen} />
        ) : !isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : shouldShowPermissionGate ? (
          <Stack.Screen name="Permission" component={PermissionScreen} />
        ) : (
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
