import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Text } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '../../components/Input';
import { useAuthStore } from '../../store/authStore';
import type { ForgotPasswordScreenProps } from '../../navigation/types';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { logger } from '../../utils/logger';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
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

type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation, route }) => {
  const forgotPassword = useAuthStore((state) => state.forgotPassword);
  const resetPassword = useAuthStore((state) => state.resetPassword);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  const resetTokenFromRoute = route.params?.token;
  const [step, setStep] = useState<'forgot' | 'reset'>(resetTokenFromRoute ? 'reset' : 'forgot');
  const [userEmail, setUserEmail] = useState('');

  const {
    control: forgotControl,
    handleSubmit: handleForgotSubmit,
    formState: { errors: forgotErrors }
  } = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const {
    control: resetControl,
    handleSubmit: handleResetSubmit,
    setValue: setResetValue,
    formState: { errors: resetErrors }
  } = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: resetTokenFromRoute || '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (resetTokenFromRoute) {
      setStep('reset');
      setResetValue('token', resetTokenFromRoute);
    }
  }, [resetTokenFromRoute, setResetValue]);

  const onForgotSubmit = async (data: ForgotPasswordSchema) => {
    try {
      await forgotPassword(data.email);
      setUserEmail(data.email);
      setStep('reset');
      Alert.alert('Success', 'If an account exists, a reset token has been sent to your email.');
    } catch (err: any) {
      logger.error('Forgot password error:', err);
    }
  };

  const onResetSubmit = async (data: ResetPasswordSchema) => {
    try {
      await resetPassword(data.token, data.password);
      Alert.alert('Success', 'Password has been reset successfully.', [
        { text: 'Login', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (err: any) {
      logger.error('Reset password error:', err);
    }
  };

  const handleForgotPress = useMemo(() => handleForgotSubmit(onForgotSubmit), [handleForgotSubmit]);
  const handleResetPress = useMemo(() => handleResetSubmit(onResetSubmit), [handleResetSubmit]);

  return (
    <AuthLayout
      title={step === 'forgot' ? "Forgot Password" : "Reset Password"}
      primaryLabel={step === 'forgot' ? "Send Token" : "Reset Password"}
      onPrimaryPress={step === 'forgot' ? handleForgotPress : handleResetPress}
      isLoading={isLoading}
      errorMessage={error}
      footerText={step === 'forgot' ? "Remember your password?" : "Back"}
      footerLinkText={step === 'forgot' ? "Login" : "Go Back"}
      onFooterLinkPress={() => step === 'forgot' ? navigation.navigate('Login') : setStep('forgot')}
      hideGoogle={true}
    >
      {step === 'forgot' ? (
        <Controller
          control={forgotControl}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Email"
              placeholder="Enter your email"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={forgotErrors.email?.message}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          )}
        />
      ) : (
        <>
          <Text style={{ color: '#9ca3af', marginBottom: 16, textAlign: 'center' }}>
            Check your email for the reset token. Enter it below with your new password.
          </Text>
          <Controller
            control={resetControl}
            name="token"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Reset Token"
                placeholder="Paste token from email"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={resetErrors.token?.message}
                autoCapitalize="none"
              />
            )}
          />
          <Controller
            control={resetControl}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="New Password"
                placeholder="8+ chars, upper/lowercase, number"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={resetErrors.password?.message}
                isPassword
              />
            )}
          />
          <Controller
            control={resetControl}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Confirm New Password"
                placeholder="Must match above"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={resetErrors.confirmPassword?.message}
                isPassword
              />
            )}
          />
        </>
      )}
    </AuthLayout>
  );
};

export default ForgotPasswordScreen;
