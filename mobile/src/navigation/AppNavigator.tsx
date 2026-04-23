import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import PermissionScreen from '../screens/PermissionScreen';
import { socketService } from '../services/socketService';
import { LocationService } from '../services/locationService';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const { initializeSocketListeners } = useNotificationStore();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      socketService.connect().then(() => {
        initializeSocketListeners();
      });
      LocationService.startLocationUpdates();
    } else {
      socketService.disconnect();
      LocationService.stopLocationUpdates();
    }

    return () => {
      socketService.disconnect();
      LocationService.stopLocationUpdates();
    };
  }, [isAuthenticated]);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <>
            <Stack.Screen name="Permission" component={PermissionScreen} />
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};


