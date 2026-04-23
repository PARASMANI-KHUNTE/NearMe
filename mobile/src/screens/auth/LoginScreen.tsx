import React, { useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { Input } from '../../components/Input';
import { useAuthStore } from '../../store/authStore';
import type { LoginScreenProps } from '../../navigation/types';
import { AuthLayout } from '../../components/auth/AuthLayout';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginSchema = z.infer<typeof loginSchema>;

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { login, loginWithEmail, isLoading, error, clearError } = useAuthStore();
  const { control, handleSubmit, formState: { errors } } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  // Google OAuth setup
  // Debug environment variables
  useEffect(() => {
    console.log('--- Auth Config Diagnostics ---');
    console.log('Web Client ID:', process.env.EXPO_PUBLIC_WEB_GOOGLE_CLIENT_ID);
    console.log('Android Client ID:', process.env.EXPO_PUBLIC_ANDROID_GOOGLE_CLIENT_ID);
  }, []);

  // Google OAuth setup - use native flow for mobile
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_IOS_GOOGLE_CLIENT_ID || process.env.EXPO_PUBLIC_WEB_GOOGLE_CLIENT_ID || '',
    scopes: ['openid', 'email', 'profile'],
  });

  // Handle OAuth response
  useEffect(() => {
    if (response?.type === 'success') {
      const params = AuthSession.TokenResponse.fromURL(response.url);
      const idToken = params.id_token;

      if (idToken) {
        handleGoogleLogin(idToken);
      }
    }
  }, [response]);

  const handleGoogleLogin = async (idToken: string) => {
    try {
      await login(idToken);
      // Navigation will be handled by auth state change
    } catch (err) {
      Alert.alert('Login Failed', 'Google authentication failed. Please try again.');
    }
  };

  const onSubmit = async (data: LoginSchema) => {
    try {
      await loginWithEmail(data.email, data.password);
    } catch (err) {
      console.error('Email login error:', err);
    }
  };

  const handleGooglePress = () => {
    clearError();
    // Use native browser, not proxy - for development and production
    promptAsync({ useProxy: false });
  };

  return (
    <AuthLayout
      title="Welcome Back"
      primaryLabel="Login"
      onPrimaryPress={handleSubmit(onSubmit)}
      onGooglePress={handleGooglePress}
      googleDisabled={!request}
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
            placeholder="Enter your password"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.password?.message}
            isPassword
          />
        )}
      />
    </AuthLayout>
  );
};

export default LoginScreen;
