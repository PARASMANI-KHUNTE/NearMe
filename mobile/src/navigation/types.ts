import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Signup: undefined;
  ForgotPassword: { token?: string } | undefined;
  Permission: undefined;
  MainTabs: undefined;
};

export type BottomTabParamList = {
  Home: undefined;
  Map: undefined;
  Friends: undefined;
  Notifications: undefined;
  Profile: undefined;
};

// Types for Native Stack Screens
export type SplashScreenProps = NativeStackScreenProps<RootStackParamList, 'Splash'>;
export type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;
export type SignupScreenProps = NativeStackScreenProps<RootStackParamList, 'Signup'>;
export type ForgotPasswordScreenProps = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;
export type PermissionScreenProps = NativeStackScreenProps<RootStackParamList, 'Permission'>;

// Types for Bottom Tabs
export type HomeScreenProps = BottomTabScreenProps<BottomTabParamList, 'Home'>;
export type MapScreenProps = BottomTabScreenProps<BottomTabParamList, 'Map'>;
export type FriendsScreenProps = BottomTabScreenProps<BottomTabParamList, 'Friends'>;
export type NotificationsScreenProps = BottomTabScreenProps<BottomTabParamList, 'Notifications'>;
export type ProfileScreenProps = BottomTabScreenProps<BottomTabParamList, 'Profile'>;
