import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Pressable,
  Modal,
  Animated,
  Easing,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { theme } from '../../theme';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/Button';
import { LocationService } from '../../services/locationService';
import { UserService } from '../../services/userService';
import { api } from '../../services/api';

const RADIUS_OPTIONS = [100, 500, 1000, 2000, 3000, 5000];

const HomeScreen = () => {
  const { shareLocation, setShareLocation, radius, setRadius, syncPreferences } = useAppStore();
  const { user, token, setUser } = useAuthStore();
  const [isRadiusModalOpen, setIsRadiusModalOpen] = useState(false);
  const [selectedRadius, setSelectedRadius] = useState(radius);
  const [nearbyCount, setNearbyCount] = useState<number | null>(null);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(16)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.94)).current;

  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: 380,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [contentOpacity, contentTranslateY]);

  useEffect(() => {
    setSelectedRadius(radius);
  }, [radius]);

  // Fetch nearby users count
  const fetchNearbyCount = useCallback(async () => {
    if (!token || !shareLocation) {
      setNearbyCount(0);
      return;
    }

    try {
      setIsLoadingNearby(true);
      const location = await LocationService.getCurrentLocation();
      if (!location) return;

      const { latitude, longitude } = location.coords;

      await api.post('/location/update', { longitude, latitude });

      const response = await api.get('/location/nearby', {
        params: { lat: latitude, lng: longitude, radius },
      });

      if (response.data.success) {
        setNearbyCount(Array.isArray(response.data.data) ? response.data.data.length : 0);
      }
    } catch (err) {
      console.error('Failed to fetch nearby count:', err);
      setNearbyCount(null);
    } finally {
      setIsLoadingNearby(false);
    }
  }, [radius, shareLocation, token]);

  // Start location tracking when sharing is enabled
  useEffect(() => {
    if (shareLocation && token) {
      LocationService.startLocationUpdates(60000, () => {
        fetchNearbyCount();
      }).catch((error) => {
        console.log('[Home] Location updates skipped:', error.message);
      });
    } else {
      LocationService.stopLocationUpdates();
    }

    return () => {
      LocationService.stopLocationUpdates();
    };
  }, [fetchNearbyCount, shareLocation, token]);

  useEffect(() => {
    if (token) fetchNearbyCount();
  }, [fetchNearbyCount, token]);

  // Save settings to server
  const handleShareLocationToggle = async (value: boolean) => {
    const previousValue = shareLocation;
    setShareLocation(value);
    try {
      setIsSavingSettings(true);
      const updatedUser = await UserService.updateSettings({ locationSharingEnabled: value });
      setUser(updatedUser);
      syncPreferences(updatedUser.settings);
      if (!value) {
        setNearbyCount(0);
      }
    } catch (err) {
      console.error('Failed to update location sharing setting:', err);
      setShareLocation(previousValue);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const openRadiusModal = () => {
    setSelectedRadius(radius);
    setIsRadiusModalOpen(true);
    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(modalScale, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeRadiusModal = () => {
    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(modalScale, {
        toValue: 0.94,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(() => setIsRadiusModalOpen(false));
  };

  const selectRadius = async (value: number) => {
    setRadius(value);
    setSelectedRadius(value);
    try {
      const updatedUser = await UserService.updateSettings({ radius: value });
      setUser(updatedUser);
      syncPreferences(updatedUser.settings);
    } catch (err) {
      console.error('Failed to update radius setting:', err);
    }
  };

  const handleSliderChange = (value: number) => {
    setSelectedRadius(Math.round(value));
  };

  const handleSliderComplete = async (value: number) => {
    const rounded = Math.round(value);
    setRadius(rounded);
    setSelectedRadius(rounded);
    try {
      const updatedUser = await UserService.updateSettings({ radius: rounded });
      setUser(updatedUser);
      syncPreferences(updatedUser.settings);
    } catch (err) {
      console.error('Failed to update radius:', err);
    }
  };

  const formatRadius = (value: number) =>
    value >= 1000 ? `${(value / 1000).toFixed(1)}km` : `${value}m`;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: contentOpacity,
          transform: [{ translateY: contentTranslateY }],
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.header}>Home</Text>
        <Text style={styles.userGreeting}>
          Hi, {user?.name?.split(' ')[0] || 'there'} 👋
        </Text>
      </View>

      {/* Location Sharing Card */}
      <View style={styles.sectionGlass}>
        <View style={styles.row}>
          <View style={styles.titleRow}>
            <Ionicons name="locate-outline" size={18} color={theme.colors.accent} />
            <Text style={styles.label}>Share Location</Text>
          </View>
          <View style={styles.switchRow}>
            {isSavingSettings && (
              <ActivityIndicator size="small" color={theme.colors.accent} style={{ marginRight: 8 }} />
            )}
            <Switch
              value={shareLocation}
              onValueChange={handleShareLocationToggle}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={shareLocation ? theme.colors.accent : theme.colors.text}
            />
          </View>
        </View>
        <Text style={styles.subText}>
          {shareLocation
            ? '✅ Your location is visible to friends'
            : '🚫 You are currently hidden from everyone'}
        </Text>
      </View>

      {/* Alert Radius Card */}
      <View style={styles.sectionGlass}>
        <View style={styles.titleRow}>
          <Ionicons name="radio-outline" size={18} color={theme.colors.accent} />
          <Text style={styles.label}>Alert Radius</Text>
        </View>
        <Pressable style={styles.radiusSelector} onPress={openRadiusModal}>
          <View style={styles.radiusValueWrap}>
            <Text style={styles.radiusValue}>{formatRadius(radius)}</Text>
            <Text style={styles.radiusHint}>Tap to change detection window</Text>
          </View>
          <Ionicons name="chevron-down" size={20} color={theme.colors.text} />
        </Pressable>
      </View>

      {/* Nearby Friends Card */}
      <View style={styles.card}>
        <View style={styles.cardIconRow}>
          <Ionicons name="people-outline" size={28} color={theme.colors.secondary} />
        </View>
        <Text style={styles.cardTitle}>Nearby Friends</Text>
        {isLoadingNearby ? (
          <ActivityIndicator size="small" color={theme.colors.accent} style={{ marginVertical: 8 }} />
        ) : (
          <Text style={styles.cardCount}>
            {nearbyCount === null
              ? 'Detecting...'
              : nearbyCount === 0
              ? 'No friends detected in your radius'
              : `${nearbyCount} friend${nearbyCount > 1 ? 's' : ''} nearby`}
          </Text>
        )}
        <Button
          title={shareLocation ? 'Refresh Nearby' : 'Enable Location to Detect'}
          onPress={shareLocation ? fetchNearbyCount : () => handleShareLocationToggle(true)}
          style={styles.pingButton}
          variant="secondary"
        />
      </View>

      {/* Status Banner */}
      <View style={[styles.statusBanner, shareLocation ? styles.statusActive : styles.statusInactive]}>
        <Ionicons
          name={shareLocation ? 'shield-checkmark-outline' : 'eye-off-outline'}
          size={16}
          color={shareLocation ? theme.colors.secondary : theme.colors.border}
        />
        <Text style={[styles.statusText, shareLocation ? styles.statusTextActive : styles.statusTextInactive]}>
          {shareLocation
            ? 'Your exact location is never shared — only approximate proximity'
            : 'Location sharing is disabled'}
        </Text>
      </View>

      {/* Radius Modal */}
      <Modal visible={isRadiusModalOpen} transparent animationType="none" onRequestClose={closeRadiusModal}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeRadiusModal} />
          <Animated.View
            style={[
              styles.modalCard,
              {
                opacity: modalOpacity,
                transform: [{ scale: modalScale }],
              },
            ]}
          >
            <Text style={styles.modalTitle}>Choose your radius</Text>
            <Text style={styles.modalSubTitle}>
              Only approximate proximity is used for alerts.
            </Text>

            <View style={styles.sliderWrap}>
              <Text style={styles.sliderValue}>{formatRadius(selectedRadius)}</Text>
              <Slider
                minimumValue={100}
                maximumValue={5000}
                step={50}
                value={selectedRadius}
                onValueChange={handleSliderChange}
                onSlidingComplete={handleSliderComplete}
                minimumTrackTintColor={theme.colors.accent}
                maximumTrackTintColor={theme.colors.border}
                thumbTintColor={theme.colors.primary}
              />
              <View style={styles.sliderRangeRow}>
                <Text style={styles.sliderRangeText}>100m</Text>
                <Text style={styles.sliderRangeText}>5km</Text>
              </View>
            </View>

            {RADIUS_OPTIONS.map((option) => {
              const isSelected = option === selectedRadius;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
                  onPress={() => selectRadius(option)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalOptionText}>{formatRadius(option)}</Text>
                  {isSelected ? (
                    <Ionicons name="checkmark-circle" size={22} color={theme.colors.secondary} />
                  ) : (
                    <Ionicons name="ellipse-outline" size={22} color={theme.colors.border} />
                  )}
                </TouchableOpacity>
              );
            })}

            <Button title="Done" onPress={closeRadiusModal} style={{ marginTop: 16 }} />
          </Animated.View>
        </View>
      </Modal>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  header: {
    fontSize: theme.typography.h1.fontSize,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  userGreeting: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.accent,
    opacity: 0.9,
  },
  sectionGlass: {
    marginBottom: theme.spacing.lg,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.14)',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: theme.typography.h3.fontSize,
    color: theme.colors.text,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  subText: {
    color: theme.colors.text,
    opacity: 0.7,
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.small.fontSize,
  },
  radiusSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.5)',
  },
  radiusValueWrap: {
    flexDirection: 'column',
  },
  radiusValue: {
    color: theme.colors.text,
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '700',
  },
  radiusHint: {
    color: theme.colors.accent,
    fontSize: theme.typography.small.fontSize,
    marginTop: 2,
  },
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.25)',
  },
  cardIconRow: {
    marginBottom: theme.spacing.sm,
  },
  cardTitle: {
    fontSize: theme.typography.h3.fontSize,
    color: theme.colors.text,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  cardCount: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    opacity: 0.8,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  pingButton: {
    width: '100%',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
  },
  statusActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  statusInactive: {
    backgroundColor: 'rgba(100, 116, 139, 0.08)',
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  statusText: {
    flex: 1,
    fontSize: theme.typography.small.fontSize,
  },
  statusTextActive: {
    color: theme.colors.secondary,
  },
  statusTextInactive: {
    color: theme.colors.border,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.65)',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  modalCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.97)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  modalTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.h2.fontSize,
    fontWeight: '700',
  },
  modalSubTitle: {
    color: theme.colors.accent,
    opacity: 0.85,
    marginTop: 6,
    marginBottom: theme.spacing.md,
    fontSize: theme.typography.small.fontSize,
  },
  sliderWrap: {
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.4)',
    marginBottom: theme.spacing.sm,
  },
  sliderValue: {
    color: theme.colors.text,
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  sliderRangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  sliderRangeText: {
    color: theme.colors.text,
    opacity: 0.65,
    fontSize: theme.typography.small.fontSize,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalOptionSelected: {
    borderColor: theme.colors.secondary,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
  },
  modalOptionText: {
    color: theme.colors.text,
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
  },
});

export default HomeScreen;
