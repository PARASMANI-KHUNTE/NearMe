import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/authStore';
import { useAppTheme } from '../../hooks/useAppTheme';
import { UserService } from '../../services/userService';
import { socketService } from '../../services/socketService';

const ProfileScreen = () => {
  const { invisibleMode, setInvisibleMode, shareLocation, setShareLocation, themeMode, toggleThemeMode, syncPreferences } = useAppStore();
  const { user, logout, token, setUser } = useAuthStore();
  const { theme: appTheme, isDay } = useAppTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState(user);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Refresh profile from server on mount
  useEffect(() => {
    if (token) {
      UserService.getProfile()
        .then(updated => setProfileUser(updated))
        .catch(() => setProfileUser(user));
    }
  }, [token]);

  const handleSettingToggle = useCallback(
    async (
      settingKey: 'locationSharingEnabled' | 'invisibleMode',
      currentValue: boolean,
      localSetter: (v: boolean) => void
    ) => {
      const newValue = !currentValue;
      localSetter(newValue);
      setIsSaving(settingKey);
      try {
        if (settingKey === 'locationSharingEnabled') {
          const updatedUser = await UserService.updateSettings({ locationSharingEnabled: newValue } as any);
          setProfileUser(updatedUser);
          setUser(updatedUser);
          syncPreferences(updatedUser.settings);
        } else if (settingKey === 'invisibleMode') {
          const updatedUser = await UserService.updateSettings({ invisibleMode: newValue } as any);
          setProfileUser(updatedUser);
          setUser(updatedUser);
          syncPreferences(updatedUser.settings);
        }
      } catch (err: any) {
        // Revert on error
        localSetter(currentValue);
        Alert.alert('Error', 'Failed to update setting. Please try again.');
      } finally {
        setIsSaving(null);
      }
    },
    [setUser, syncPreferences]
  );

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          socketService.disconnect();
          await logout();
        },
      },
    ]);
  };

  const displayUser = profileUser || user;

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, backgroundColor: appTheme.colors.background },
      ]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.header, { color: appTheme.colors.text }]}>Profile</Text>

        {/* Profile Card */}
        <View style={[styles.card, { backgroundColor: appTheme.colors.surface, borderColor: appTheme.colors.border }]}>
          {displayUser?.picture ? (
            <Image source={{ uri: displayUser.picture }} style={styles.avatarImg} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: appTheme.colors.primary }]}>
              <Text style={[styles.avatarText, { color: '#fff' }]}>
                {displayUser?.name?.[0]?.toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          <Text style={[styles.name, { color: appTheme.colors.text }]}>{displayUser?.name}</Text>
          <Text style={[styles.email, { color: appTheme.colors.text }]}>{displayUser?.email}</Text>
          {displayUser?.settings && (
            <View style={styles.settingsHint}>
              <Ionicons name="radio-outline" size={14} color={appTheme.colors.accent} />
              <Text style={[styles.settingsHintText, { color: appTheme.colors.accent }]}>
                Detection radius: {displayUser.settings.radius >= 1000
                  ? `${(displayUser.settings.radius / 1000).toFixed(1)}km`
                  : `${displayUser.settings.radius}m`}
              </Text>
            </View>
          )}
        </View>

        {/* Settings Section */}
        <Text style={[styles.sectionTitle, { color: appTheme.colors.text }]}>Settings</Text>
        <View style={[styles.section, { backgroundColor: appTheme.colors.surface, borderColor: appTheme.colors.border }]}>
          {/* Share Location */}
          <View style={styles.row}>
            <View style={styles.labelRow}>
              <Ionicons name="locate-outline" size={18} color={appTheme.colors.accent} />
              <View style={{ marginLeft: 10 }}>
                <Text style={[styles.label, { color: appTheme.colors.text }]}>Share Location</Text>
                <Text style={[styles.labelSub, { color: appTheme.colors.text }]}>
                  Visible to friends when enabled
                </Text>
              </View>
            </View>
            <View style={styles.switchWrap}>
              {isSaving === 'locationSharingEnabled' && (
                <ActivityIndicator size="small" color={appTheme.colors.accent} style={{ marginRight: 8 }} />
              )}
              <Switch
                value={shareLocation}
                onValueChange={() =>
                  handleSettingToggle('locationSharingEnabled', shareLocation, setShareLocation)
                }
                trackColor={{ false: appTheme.colors.border, true: appTheme.colors.primary }}
                thumbColor={shareLocation ? appTheme.colors.accent : '#aaa'}
              />
            </View>
          </View>

          <View style={styles.divider} />

          {/* Invisible Mode */}
          <View style={styles.row}>
            <View style={styles.labelRow}>
              <Ionicons name="eye-off-outline" size={18} color={appTheme.colors.accent} />
              <View style={{ marginLeft: 10 }}>
                <Text style={[styles.label, { color: appTheme.colors.text }]}>Invisible Mode</Text>
                <Text style={[styles.labelSub, { color: appTheme.colors.text }]}>
                  Hidden from all proximity alerts
                </Text>
              </View>
            </View>
            <Switch
              value={invisibleMode}
              onValueChange={() =>
                handleSettingToggle('invisibleMode', invisibleMode, setInvisibleMode)
              }
              trackColor={{ false: appTheme.colors.border, true: appTheme.colors.primary }}
              thumbColor={invisibleMode ? appTheme.colors.accent : '#aaa'}
            />
          </View>

          <View style={styles.divider} />

          {/* Dark/Light Mode */}
          <View style={styles.row}>
            <View style={styles.labelRow}>
              <Ionicons
                name={isDay ? 'sunny-outline' : 'moon-outline'}
                size={18}
                color={appTheme.colors.accent}
              />
              <View style={{ marginLeft: 10 }}>
                <Text style={[styles.label, { color: appTheme.colors.text }]}>
                  {isDay ? 'Light Mode' : 'Dark Mode'}
                </Text>
                <Text style={[styles.labelSub, { color: appTheme.colors.text }]}>
                  Toggle app appearance
                </Text>
              </View>
            </View>
            <Switch
              value={isDay}
              onValueChange={toggleThemeMode}
              trackColor={{ false: appTheme.colors.border, true: appTheme.colors.primary }}
              thumbColor={isDay ? appTheme.colors.accent : '#aaa'}
            />
          </View>
        </View>

        {/* Privacy Note */}
        <View style={styles.privacyBox}>
          <Ionicons name="shield-checkmark-outline" size={16} color={appTheme.colors.secondary} />
          <Text style={[styles.privacyMsg, { color: appTheme.colors.secondary }]}>
            Your exact location is never stored or shared. Only approximate proximity is used.
          </Text>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    opacity: 0.6,
  },
  settingsHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(56,189,248,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.2)',
  },
  settingsHintText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.5,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(100,116,139,0.15)',
    marginHorizontal: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  labelSub: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 1,
  },
  privacyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(34,197,94,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.15)',
    marginBottom: 20,
  },
  privacyMsg: {
    flex: 1,
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    marginBottom: 32,
  },
  logoutText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default ProfileScreen;
