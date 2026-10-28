import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { AuthService } from '../../services/authService';
import { VerifyEmailScreenProps } from '../../navigation/types';

const VerifyEmailScreen: React.FC<VerifyEmailScreenProps> = ({ route, navigation }) => {
  const { email } = route.params;
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (code.length < 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await AuthService.verifyEmail(email, code);
      Alert.alert(
        'Success',
        'Your email has been verified. You can now log in.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setIsResending(true);

    try {
      await AuthService.resendVerification(email);
      Alert.alert('Success', 'A new verification code has been sent to your email.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout
      title="Verify Email"
      primaryLabel="Verify Account"
      onPrimaryPress={handleVerify}
      isLoading={isSubmitting}
      errorMessage={error || undefined}
      footerText="Back to"
      footerLinkText="Login"
      onFooterLinkPress={() => navigation.navigate('Login')}
      googleDisabled={true}
      hideGoogle={true}
    >
      <View style={styles.iconContainer}>
        <View style={styles.iconWrapper}>
          <Ionicons name="mail-outline" color="#818CF8" size={32} />
        </View>
        <Text style={styles.subtitle}>
          We've sent a 6-digit code to{'\n'}
          <Text style={styles.emailText}>{email}</Text>
        </Text>
      </View>

      <Input
        label="Verification Code"
        placeholder="000000"
        value={code}
        onChangeText={(text) => setCode(text.replace(/\D/g, ''))}
        keyboardType="number-pad"
        maxLength={6}
        icon={<Ionicons name="checkmark-circle-outline" color="#94A3B8" size={20} />}
        style={styles.codeInput}
      />

      <TouchableOpacity 
        style={styles.resendContainer} 
        onPress={handleResend}
        disabled={isResending}
      >
        <Text style={[styles.resendText, isResending && styles.disabledText]}>
          {isResending ? 'Resending...' : "Didn't receive the code? Resend"}
        </Text>
      </TouchableOpacity>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(129, 140, 248, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  emailText: {
    color: '#F8FAFC',
    fontWeight: '600',
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 10,
    fontWeight: 'bold',
  },
  resendContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  resendText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledText: {
    opacity: 0.5,
  },
});

export default VerifyEmailScreen;
