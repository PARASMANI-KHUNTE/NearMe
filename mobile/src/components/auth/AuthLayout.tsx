import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Button } from '../Button';

type Props = {
  title: string;
  children: React.ReactNode;
  primaryLabel: string;
  onPrimaryPress: () => void;
  onGooglePress?: () => void;
  googleLabel?: string;
  googleDisabled?: boolean;
  isLoading?: boolean;
  errorMessage?: string | null;
  footerText: string;
  footerLinkText: string;
  onFooterLinkPress: () => void;
  hideGoogle?: boolean;
};

export const AuthLayout: React.FC<Props> = ({
  title,
  children,
  primaryLabel,
  onPrimaryPress,
  onGooglePress,
  googleLabel = 'Continue with Google',
  googleDisabled = false,
  isLoading = false,
  errorMessage,
  footerText,
  footerLinkText,
  onFooterLinkPress,
  hideGoogle = false,
}) => {
  const { theme } = useAppTheme();

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { padding: theme.spacing.lg }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.text,
              marginBottom: theme.spacing.xl,
              fontSize: theme.typography.h1.fontSize,
            },
          ]}
        >
          {title}
        </Text>

        {children}

        <Button
          title={primaryLabel}
          onPress={onPrimaryPress}
          isLoading={isLoading}
          style={{ marginTop: theme.spacing.md }}
        />

        {onGooglePress && !hideGoogle ? (
          <>
            <View style={[styles.dividerContainer, { marginVertical: theme.spacing.lg }]}>
              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
              <Text style={[styles.dividerText, { color: theme.colors.text, paddingHorizontal: theme.spacing.md }]}>
                or
              </Text>
              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            </View>

            <Button
              title={googleLabel}
              onPress={onGooglePress}
              variant="outline"
              isLoading={isLoading}
              disabled={googleDisabled || isLoading}
            />
          </>
        ) : null}

        {errorMessage ? (
          <Text
            style={{
              color: theme.colors.danger,
              textAlign: 'center',
              marginTop: theme.spacing.md,
              fontSize: theme.typography.caption.fontSize,
            }}
          >
            {errorMessage}
          </Text>
        ) : null}

        <View style={[styles.footer, { marginTop: theme.spacing.lg }]}>
          <Text style={{ color: theme.colors.text }}>{footerText}</Text>
          <TouchableOpacity onPress={onFooterLinkPress} activeOpacity={0.8}>
            <Text style={[styles.link, { color: theme.colors.accent }]}>{footerLinkText}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    opacity: 0.6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  link: {
    fontWeight: 'bold',
  },
});

