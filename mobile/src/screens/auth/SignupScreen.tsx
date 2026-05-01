import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import { Input } from '../../components/Input';
import { useAuthStore } from '../../store/authStore';
import type { SignupScreenProps } from '../../navigation/types';
import { AuthLayout } from '../../components/auth/AuthLayout';

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
  const { login, registerWithEmail, isLoading, error, clearError } = useAuthStore();
  const { control, handleSubmit, formState: { errors } } = useForm<SignupSchema>({
    resolver: zodResolver(signupSchema),
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
      console.error('Signup error:', err);
    }
  };

  const handleGooglePress = () => {
    clearError();
    promptAsync({ showTitle: true });
  };

  return (
    <AuthLayout
      title="Create Account"
      primaryLabel="Sign Up"
      onPrimaryPress={handleSubmit(onSubmit)}
      onGooglePress={handleGooglePress}
      googleDisabled={!request}
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
