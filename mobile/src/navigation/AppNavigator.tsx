import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinkingOptions, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useAppStore } from '../store/useAppStore';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import PermissionScreen from '../screens/PermissionScreen';
import { socketService } from '../services/socketService';

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
  const { isAuthenticated, isLoading, user, checkAuth } = useAuthStore();
  const { initializeSocketListeners } = useNotificationStore();
  const syncPreferences = useAppStore((state) => state.syncPreferences);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    syncPreferences(user?.settings);
  }, [syncPreferences, user]);

  // Delay service connections to let UI settle
  useEffect(() => {
    if (!isAuthenticated || isLoading) return;
    
    const timer = setTimeout(() => {
      console.log('[Navigator] Starting services after delay...');
      
      socketService.connect()
        .then(() => {
          console.log('[Navigator] Socket connected');
          initializeSocketListeners();
        })
        .catch(err => console.log('[Navigator] Socket skip:', err.message));
        
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


