import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabParamList } from './types';
import { useAppTheme } from '../hooks/useAppTheme';
import { useNotificationStore } from '../store/notificationStore';

// Screens
import HomeScreen from '../screens/main/HomeScreen';
import MapScreen from '../screens/main/MapScreen';
import FriendsScreen from '../screens/main/FriendsScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

const Tab = createBottomTabNavigator<BottomTabParamList>();

export const MainTabNavigator = () => {
  const { theme, isDay } = useAppTheme();
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  const getTabIcon = (routeName: keyof BottomTabParamList, focused: boolean) => {
    const iconMap: Record<keyof BottomTabParamList, keyof typeof Ionicons.glyphMap> = {
      Home: focused ? 'home' : 'home-outline',
      Map: focused ? 'map' : 'map-outline',
      Friends: focused ? 'people' : 'people-outline',
      Notifications: focused ? 'notifications' : 'notifications-outline',
      Profile: focused ? 'person-circle' : 'person-circle-outline',
    };

    return iconMap[routeName];
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDay ? 'rgba(255, 255, 255, 0.98)' : 'rgba(42, 29, 20, 0.98)',
          borderTopColor: isDay ? 'rgba(243, 217, 177, 0.85)' : 'rgba(74, 51, 35, 0.95)',
          borderTopWidth: 1,
          height: 66,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: isDay ? 'rgba(59, 42, 22, 0.65)' : 'rgba(255, 243, 224, 0.62)',
        tabBarIcon: ({ focused, color, size }) => {
          const routeName = route.name as keyof BottomTabParamList;
          return <Ionicons name={getTabIcon(routeName, focused)} size={size + 1} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Friends" component={FriendsScreen} />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};
