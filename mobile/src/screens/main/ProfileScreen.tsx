import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Switch, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../../components/Button';
import { useAppTheme } from '../../hooks/useAppTheme';

const ProfileScreen = () => {
  const { user, logout, invisibleMode, setInvisibleMode, shareLocation, setShareLocation, themeMode, toggleThemeMode } = useAppStore();
  const { theme: appTheme, isDay } = useAppTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, backgroundColor: appTheme.colors.background }]}> 
      <Text style={[styles.header, { color: appTheme.colors.text }]}>Profile</Text>
      
      <View style={[styles.card, { backgroundColor: appTheme.colors.surface, borderColor: appTheme.colors.border }]}> 
        <View style={[styles.avatar, { backgroundColor: appTheme.colors.primary }]}> 
          <Text style={[styles.avatarText, { color: appTheme.colors.text }]}>{user?.name?.[0] || 'U'}</Text>
        </View>
        <Text style={[styles.name, { color: appTheme.colors.text }]}>{user?.name}</Text>
        <Text style={[styles.email, { color: appTheme.colors.text }]}>{user?.email}</Text>
      </View>

      <View style={[styles.section, { backgroundColor: appTheme.colors.surface, borderColor: appTheme.colors.border }]}> 
        <View style={styles.row}>
          <View style={styles.labelRow}>
            <Ionicons name="locate-outline" size={18} color={appTheme.colors.accent} />
            <Text style={[styles.label, { color: appTheme.colors.text }]}>Share Location</Text>
          </View>
          <Switch
            value={shareLocation}
            onValueChange={setShareLocation}
            trackColor={{ false: appTheme.colors.border, true: appTheme.colors.primary }}
          />
        </View>
        
        <View style={styles.row}>
          <View style={styles.labelRow}>
            <Ionicons name="eye-off-outline" size={18} color={appTheme.colors.accent} />
            <Text style={[styles.label, { color: appTheme.colors.text }]}>Invisible Mode</Text>
          </View>
          <Switch
            value={invisibleMode}
            onValueChange={setInvisibleMode}
            trackColor={{ false: appTheme.colors.border, true: appTheme.colors.primary }}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.labelRow}>
            <Ionicons name={isDay ? 'sunny-outline' : 'moon-outline'} size={18} color={appTheme.colors.accent} />
            <Text style={[styles.label, { color: appTheme.colors.text }]}>Theme ({themeMode})</Text>
          </View>
          <Switch
            value={isDay}
            onValueChange={toggleThemeMode}
            trackColor={{ false: appTheme.colors.border, true: appTheme.colors.primary }}
          />
        </View>
      </View>
      <Text style={[styles.privacyMsg, { color: appTheme.colors.secondary }]}>Your exact location is never shared</Text>

      <View style={{ flex: 1 }} />

      <Button title="Logout" onPress={logout} variant="danger" />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  header: {
    fontSize: theme.typography.h1.fontSize,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  card: {
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  avatarText: {
    fontSize: theme.typography.h1.fontSize,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  name: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  email: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    opacity: 0.7,
  },
  section: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  label: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  privacyMsg: {
    color: theme.colors.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    fontStyle: 'italic',
  }
});

export default ProfileScreen;
