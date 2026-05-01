import React from 'react';
import { Alert, Text, TouchableOpacity } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
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
  const isExpoGo = Constants.executionEnvironment === 'storeClient';

  const redirectUri = isExpoGo
    ? 'https://auth.expo.io/@parasmani/nearme'
    : AuthSession.makeRedirectUri({
        native: 'nearme:/oauth2redirect',
      });

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_WEB_GOOGLE_CLIENT_ID || '',
    androidClientId: process.env.EXPO_PUBLIC_ANDROID_GOOGLE_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_IOS_GOOGLE_CLIENT_ID,
    redirectUri,
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
    promptAsync({ showTitle: true });
  };

  const onSubmit = async (data: LoginSchema) => {
    try {
      await loginWithEmail(data.email, data.password);
    } catch (err: any) {
      console.error('Email login error:', err);
    }
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