import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as Google from 'expo-auth-session/providers/google';
import { Input } from '../../components/Input';
import { useAuthStore } from '../../store/authStore';
import type { SignupScreenProps } from '../../navigation/types';
import { AuthLayout } from '../../components/auth/AuthLayout';
import {
  configureNativeGoogleSignIn,
  getGoogleRedirectUri,
  getMissingGoogleClientIdMessage,
  googleAuthConfig,
  shouldUseNativeGoogleSignIn,
} from '../../config/googleAuth';
import { logger } from '../../utils/logger';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least 1 number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupSchema = z.infer<typeof signupSchema>;

const SignupScreen: React.FC<SignupScreenProps> = ({ navigation }) => {
  const login = useAuthStore((state) => state.login);
  const registerWithEmail = useAuthStore((state) => state.registerWithEmail);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  const { control, handleSubmit, formState: { errors } } = useForm<SignupSchema>({
    resolver: zodResolver(signupSchema),
  });

  useEffect(() => {
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
  useEffect(() => {
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

  const onSubmit = async (data: SignupSchema) => {
    try {
      await registerWithEmail({
        email: data.email,
        password: data.password,
        name: data.name,
      });
    } catch (err) {
      logger.error('Signup error:', err);
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
      logger.info('[GoogleSignIn][Signup] signIn result', {
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
      logger.error('[GoogleSignIn][Signup] native sign-in failed', err);
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

  return (
    <AuthLayout
      title="Create Account"
      primaryLabel="Sign Up"
      onPrimaryPress={handleSubmit(onSubmit)}
      onGooglePress={handleGooglePress}
      googleDisabled={!request || !!getMissingGoogleClientIdMessage()}
      isLoading={isLoading}
      errorMessage={error}
      footerText="Already have an account?"
      footerLinkText="Login"
      onFooterLinkPress={() => navigation.navigate('Login')}
    >
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Name"
            placeholder="Enter your name"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.name?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Email"
            placeholder="Enter your email"
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
            placeholder="Create a password"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.password?.message}
            isPassword
          />
        )}
      />

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Confirm Password"
            placeholder="Confirm your password"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.confirmPassword?.message}
            isPassword
          />
        )}
      />
    </AuthLayout>
  );
};

export default SignupScreen;
