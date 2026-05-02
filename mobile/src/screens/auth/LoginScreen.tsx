import React from 'react';
import { Alert, Text, TouchableOpacity } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as Google from 'expo-auth-session/providers/google';
import { Input } from '../../components/Input';
import { useAuthStore } from '../../store/authStore';
import type { LoginScreenProps } from '../../navigation/types';
import { AuthLayout } from '../../components/auth/AuthLayout';
import {
  configureNativeGoogleSignIn,
  getGoogleRedirectUri,
  getMissingGoogleClientIdMessage,
  googleAuthConfig,
  shouldUseNativeGoogleSignIn,
} from '../../config/googleAuth';
import { logger } from '../../utils/logger';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginSchema = z.infer<typeof loginSchema>;

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const login = useAuthStore((state) => state.login);
  const loginWithEmail = useAuthStore((state) => state.loginWithEmail);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  const { control, handleSubmit, formState: { errors } } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  React.useEffect(() => {
    configureNativeGoogleSignIn();
  }, []);

  const redirectUri = getGoogleRedirectUri();

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: googleAuthConfig.clientId,
    androidClientId: googleAuthConfig.androidClientId,
    iosClientId: googleAuthConfig.iosClientId,
    expoClientId: googleAuthConfig.expoClientId,
    ...(redirectUri ? { redirectUri } : {}),
  } as any);

  // Handle OAuth response
  React.useEffect(() => {
    if (response?.type === 'success') {
      const params = (response as any).params;
      const idToken = params?.id_token;

      if (idToken) {
        handleGoogleLogin(idToken);
      }
    }
  }, [response]);

  const handleGoogleLogin = async (idToken: string) => {
    try {
      await login(idToken);
    } catch (err) {
      // Error handled by store
    }
  };

  const handleGooglePress = () => {
    clearError();
    const missingClientIdMessage = getMissingGoogleClientIdMessage();
    if (missingClientIdMessage) {
      Alert.alert('Google Sign-In Configuration', missingClientIdMessage);
      return;
    }

    if (shouldUseNativeGoogleSignIn) {
      void handleNativeGoogleSignIn();
      return;
    }

    promptAsync({ showTitle: true });
  };

  const handleNativeGoogleSignIn = async () => {
    const {
      GoogleSignin,
      isCancelledResponse,
      isErrorWithCode,
      isSuccessResponse,
      statusCodes,
    } = require('@react-native-google-signin/google-signin') as typeof import('@react-native-google-signin/google-signin');

    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const result = await GoogleSignin.signIn();
      logger.info('[GoogleSignIn][Login] signIn result', {
        type: result.type,
        hasIdToken: isSuccessResponse(result) ? !!result.data.idToken : false,
        email: isSuccessResponse(result) ? result.data.user.email : undefined,
      });

      if (isCancelledResponse(result)) {
        return;
      }

      if (!isSuccessResponse(result)) {
        throw new Error('Google Sign-In did not complete successfully.');
      }

      const signInToken = result.data.idToken;
      const tokenResponse = signInToken ? null : await GoogleSignin.getTokens();
      const idToken = signInToken || tokenResponse?.idToken;

      if (!idToken) {
        throw new Error('Google Sign-In did not return an ID token.');
      }

      await handleGoogleLogin(idToken);
    } catch (err) {
      logger.error('[GoogleSignIn][Login] native sign-in failed', err);
      if (isErrorWithCode(err)) {
        if (err.code === statusCodes.IN_PROGRESS || err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          Alert.alert('Google Sign-In', err.message);
          return;
        }
      }

      const message = err instanceof Error ? err.message : 'Google Sign-In failed';
      Alert.alert('Google Sign-In', message);
    }
  };

  const onSubmit = async (data: LoginSchema) => {
    try {
      await loginWithEmail(data.email, data.password);
    } catch (err: any) {
      logger.error('Email login error:', err);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      primaryLabel="Login"
      onPrimaryPress={handleSubmit(onSubmit)}
      onGooglePress={handleGooglePress}
      googleDisabled={!request || !!getMissingGoogleClientIdMessage()}
      isLoading={isLoading}
      errorMessage={error}
      footerText="Don't have an account?"
      footerLinkText="Sign Up"
      onFooterLinkPress={() => navigation.navigate('Signup')}
    >
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Email"
            placeholder="you@example.com"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.email?.message}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Password"
            placeholder="Enter password"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.password?.message}
            isPassword
          />
        )}
      />
      <TouchableOpacity
        onPress={() => navigation.navigate('ForgotPassword')}
        style={{ alignSelf: 'flex-end', marginTop: 8 }}
      >
        <Text style={{ color: '#38bdf8', fontWeight: '500' }}>Forgot Password?</Text>
      </TouchableOpacity>
    </AuthLayout>
  );
};

export default LoginScreen;
