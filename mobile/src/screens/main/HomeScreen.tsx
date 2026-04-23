import React, { useEffect, useRef, useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { theme } from '../../theme';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../../components/Button';

const RADIUS_OPTIONS = [500, 1000, 2000];

const HomeScreen = () => {
  const { shareLocation, setShareLocation, radius, setRadius } = useAppStore();
  const [isRadiusModalOpen, setIsRadiusModalOpen] = useState(false);
  const [selectedRadius, setSelectedRadius] = useState(radius);
  const nearbyFriendsCount = 2; // Mock data

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(16)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.94)).current;

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

  const selectRadius = (value: number) => {
    setRadius(value);
    setSelectedRadius(value);
  };

  const handleSliderChange = (value: number) => {
    setSelectedRadius(value);
    setRadius(value);
  };

  const formatRadius = (value: number) => (value >= 1000 ? `${value / 1000}km` : `${value}m`);

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
      <Text style={styles.header}>Home</Text>

      <View style={styles.sectionGlass}>
        <View style={styles.row}>
          <View style={styles.titleRow}>
            <Ionicons name="locate-outline" size={18} color={theme.colors.accent} />
            <Text style={styles.label}>Share Location</Text>
          </View>
          <Switch
            value={shareLocation}
            onValueChange={setShareLocation}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          />
        </View>
        <Text style={styles.subText}>
          {shareLocation ? 'Your location is visible to friends' : 'You are currently hidden'}
        </Text>
      </View>

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

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nearby Friends</Text>
        <Text style={styles.cardCount}>You have {nearbyFriendsCount} friends nearby</Text>
        <Button
          title="Ping Nearby Friends" 
          onPress={() => alert('Pinging...')} 
          style={styles.pingButton}
          variant="secondary"
        />
      </View>

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
            <Text style={styles.modalSubTitle}>Only approximate proximity is used for alerts.</Text>

            <View style={styles.sliderWrap}>
              <Text style={styles.sliderValue}>{formatRadius(selectedRadius)}</Text>
              <Slider
                minimumValue={500}
                maximumValue={2000}
                step={100}
                value={selectedRadius}
                onValueChange={handleSliderChange}
                minimumTrackTintColor={theme.colors.accent}
                maximumTrackTintColor={theme.colors.border}
                thumbTintColor={theme.colors.primary}
              />
              <View style={styles.sliderRangeRow}>
                <Text style={styles.sliderRangeText}>500m</Text>
                <Text style={styles.sliderRangeText}>2km</Text>
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
  header: {
    fontSize: theme.typography.h1.fontSize,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
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
    marginTop: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.25)',
  },
  cardTitle: {
    fontSize: theme.typography.h3.fontSize,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  cardCount: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    opacity: 0.8,
    marginBottom: theme.spacing.lg,
  },
  pingButton: {
    width: '100%',
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
