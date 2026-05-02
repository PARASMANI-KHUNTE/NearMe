import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type { ConfigureParams } from '@react-native-google-signin/google-signin';

type GoogleAuthConfig = {
  clientId?: string;
  androidClientId?: string;
  iosClientId?: string;
  expoClientId?: string;
  expoUsername?: string;
  expoSlug?: string;
  androidPackage?: string;
  iosBundleIdentifier?: string;
};

const readEnv = (value?: string): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const isExpoGo = Constants.executionEnvironment === 'storeClient';
const isWeb = Platform.OS === 'web';

export const shouldUseNativeGoogleSignIn = !isExpoGo && !isWeb;

export const googleAuthConfig: GoogleAuthConfig = {
  clientId: readEnv(process.env.EXPO_PUBLIC_WEB_GOOGLE_CLIENT_ID),
  androidClientId: readEnv(process.env.EXPO_PUBLIC_ANDROID_GOOGLE_CLIENT_ID),
  iosClientId: readEnv(process.env.EXPO_PUBLIC_IOS_GOOGLE_CLIENT_ID),
  expoClientId: readEnv(process.env.EXPO_PUBLIC_EXPO_GO_GOOGLE_CLIENT_ID),
  expoUsername:
    readEnv(process.env.EXPO_PUBLIC_EXPO_USERNAME) ||
    readEnv((Constants.expoConfig as { owner?: string } | null)?.owner),
  expoSlug:
    readEnv(process.env.EXPO_PUBLIC_EXPO_SLUG) ||
    readEnv((Constants.expoConfig as { slug?: string } | null)?.slug),
  androidPackage: readEnv((Constants.expoConfig as { android?: { package?: string } } | null)?.android?.package),
  iosBundleIdentifier: readEnv((Constants.expoConfig as { ios?: { bundleIdentifier?: string } } | null)?.ios?.bundleIdentifier),
};

export const getGoogleRedirectUri = (): string | undefined => {
  if (isExpoGo) {
    if (!googleAuthConfig.expoUsername || !googleAuthConfig.expoSlug) {
      return undefined;
    }

    return `https://auth.expo.io/@${googleAuthConfig.expoUsername}/${googleAuthConfig.expoSlug}`;
  }

  const nativeScheme =
    Platform.OS === 'android'
      ? googleAuthConfig.androidPackage
      : Platform.OS === 'ios'
        ? googleAuthConfig.iosBundleIdentifier
        : undefined;

  if (!nativeScheme) {
    return undefined;
  }

  return AuthSession.makeRedirectUri({
    native: `${nativeScheme}:/oauthredirect`,
  });
};

export const getMissingGoogleClientIdMessage = (): string | null => {
  if (shouldUseNativeGoogleSignIn && !googleAuthConfig.clientId) {
    return 'Missing EXPO_PUBLIC_WEB_GOOGLE_CLIENT_ID in the mobile build environment. Native Google sign-in needs the web client ID to return an ID token.';
  }

  if (Platform.OS === 'android' && !googleAuthConfig.androidClientId) {
    return 'Missing EXPO_PUBLIC_ANDROID_GOOGLE_CLIENT_ID in the mobile build environment.';
  }

  if (Platform.OS === 'ios' && !googleAuthConfig.iosClientId) {
    return 'Missing EXPO_PUBLIC_IOS_GOOGLE_CLIENT_ID in the mobile build environment.';
  }

  if (Platform.OS === 'web' && !googleAuthConfig.clientId) {
    return 'Missing EXPO_PUBLIC_WEB_GOOGLE_CLIENT_ID in the mobile build environment.';
  }

  if (isExpoGo && !googleAuthConfig.expoClientId) {
    return 'Missing EXPO_PUBLIC_EXPO_GO_GOOGLE_CLIENT_ID for Expo Go Google sign-in.';
  }

  if (isExpoGo && (!googleAuthConfig.expoUsername || !googleAuthConfig.expoSlug)) {
    return 'Missing EXPO_PUBLIC_EXPO_USERNAME or EXPO_PUBLIC_EXPO_SLUG for Expo Go Google sign-in.';
  }

  return null;
};

let nativeGoogleConfigured = false;

export const configureNativeGoogleSignIn = (): void => {
  if (!shouldUseNativeGoogleSignIn || nativeGoogleConfigured) {
    return;
  }

  const { GoogleSignin } = require('@react-native-google-signin/google-signin') as {
    GoogleSignin: { configure: (options: ConfigureParams) => void };
  };

  GoogleSignin.configure({
    scopes: ['profile', 'email'],
    webClientId: googleAuthConfig.clientId,
    iosClientId: googleAuthConfig.iosClientId,
  });

  nativeGoogleConfigured = true;
};
