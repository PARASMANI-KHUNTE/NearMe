import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import MapView, { Circle, Marker, Callout, UrlTile } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';

const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

interface NearbyUser {
  id: string;
  name: string;
  picture?: string;
  latitude: number;
  longitude: number;
  distance?: number;
  approximate?: boolean;
  precisionMeters?: number;
}

interface NearbyUserResponse {
  id?: string;
  _id?: string;
  name?: string;
  picture?: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
  approximate?: boolean;
  precisionMeters?: number;
}

const MapScreen = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { radius, shareLocation } = useAppStore();
  const { token } = useAuthStore();
  const { theme } = useAppTheme();
  const mapRef = useRef<MapView>(null);

  // Watch location for real-time updates
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          return;
        }

        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(initialLocation);

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (newLocation) => {
            setLocation(newLocation);
          }
        );
      } catch (err) {
        setErrorMsg('Failed to watch location');
      }
    })();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  // Fetch nearby users when location or radius changes
  const fetchNearbyUsers = useCallback(async () => {
    if (!location || !token || !shareLocation) {
      setNearbyUsers([]);
      return;
    }
    try {
      setIsRefreshing(true);
      const { latitude, longitude } = location.coords;

      // First update our own location on server
      await api.post('/location/update', { longitude, latitude });

      // Then fetch nearby users - server expects lat/lng/radius
      const response = await api.get('/location/nearby', {
        params: { lat: latitude, lng: longitude, radius },
      });

      if (response.data.success) {
        const users: NearbyUser[] = (response.data.data || []).map((u: NearbyUserResponse, index: number) => ({
          id: u.id || u._id || `nearby-${index}`,
          name: u.name || 'Friend',
          picture: u.picture,
          latitude: typeof u.latitude === 'number' ? u.latitude : latitude,
          longitude: typeof u.longitude === 'number' ? u.longitude : longitude,
          distance: u.distance,
          approximate: u.approximate,
          precisionMeters: u.precisionMeters,
        }));
        setNearbyUsers(users);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Fetch nearby users error:', message);
    } finally {
      setIsRefreshing(false);
    }
  }, [location, token, shareLocation, radius]);

  useEffect(() => {
    fetchNearbyUsers();
    // Refresh every 60 seconds
    const interval = setInterval(fetchNearbyUsers, 60000);
    return () => clearInterval(interval);
  }, [fetchNearbyUsers]);

  const centerOnUser = () => {
    if (location && mapRef.current) {
      // 1 degree latitude is ~111km. 
      // Calculate delta to show the entire radius circle + some padding
      const delta = (radius * 2.5) / 111320; 
      
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: Math.max(delta, 0.005),
        longitudeDelta: Math.max(delta, 0.005),
      }, 600);
    }
  };

  if (errorMsg) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="location-outline" size={48} color={theme.colors.danger} />
        <Text style={{ color: theme.colors.danger, marginTop: 12, fontWeight: '600' }}>{errorMsg}</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ color: theme.colors.text, marginTop: 12, opacity: 0.6 }}>
          Getting your location...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        mapType={Platform.OS === 'android' ? 'none' : 'standard'}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        <UrlTile
          urlTemplate={OSM_TILE_URL}
          maximumZ={19}
          flipY={false}
          shouldReplaceMapContent={Platform.OS === 'ios'}
          zIndex={-1}
        />

        {/* Detection radius circle */}
        <Circle
          center={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }}
          radius={radius}
          fillColor="rgba(79, 70, 229, 0.08)"
          strokeColor="rgba(79, 70, 229, 0.4)"
          strokeWidth={1.5}
        />

        {/* Nearby user blurred circles */}
        {nearbyUsers.map((u) => (
          <Circle
            key={`circle-${u.id}`}
            center={{ latitude: u.latitude, longitude: u.longitude }}
            radius={u.precisionMeters ?? 200}
            fillColor="rgba(245, 158, 11, 0.18)"
            strokeColor="rgba(245, 158, 11, 0.6)"
            strokeWidth={1}
          />
        ))}

        {/* Nearby user markers */}
        {nearbyUsers.map((u) => (
          <Marker
            key={`marker-${u.id}`}
            coordinate={{ latitude: u.latitude, longitude: u.longitude }}
            tracksViewChanges={false}
          >
            <View style={styles.markerContainer}>
              <View style={styles.markerBubble}>
                <Text style={styles.markerLetter}>{u.name?.[0]?.toUpperCase() || '?'}</Text>
              </View>
              <View style={styles.markerArrow} />
            </View>
            <Callout tooltip>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{u.name}</Text>
                <Text style={styles.calloutDesc}>
                  {u.distance ? `~${u.distance}m away` : 'Nearby friend'}
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Top Info Overlay */}
      <View
        style={[
          styles.overlay,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <Ionicons name="shield-checkmark-outline" size={14} color={theme.colors.secondary} />
        <Text style={[styles.overlayText, { color: theme.colors.secondary }]}>
          Your exact location is never shared
        </Text>
      </View>

      <View style={[styles.attributionBadge, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[styles.attributionText, { color: theme.colors.text }]}>
          Map tiles (c) OpenStreetMap contributors
        </Text>
      </View>

      {/* Nearby Count Badge */}
      {nearbyUsers.length > 0 && (
        <View style={[styles.countBadge, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Ionicons name="people-outline" size={14} color={theme.colors.accent} />
          <Text style={[styles.countText, { color: theme.colors.accent }]}>
            {nearbyUsers.length} nearby
          </Text>
        </View>
      )}

      {/* Recenter Button */}
      <TouchableOpacity
        style={[styles.centerBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        onPress={centerOnUser}
        activeOpacity={0.8}
      >
        <Ionicons name="locate" size={22} color={theme.colors.primary} />
      </TouchableOpacity>

      {/* Refresh Button */}
      <TouchableOpacity
        style={[styles.refreshBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        onPress={fetchNearbyUsers}
        activeOpacity={0.8}
        disabled={isRefreshing}
      >
        {isRefreshing ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <Ionicons name="refresh" size={20} color={theme.colors.primary} />
        )}
      </TouchableOpacity>

      {/* Sharing Disabled Banner */}
      {!shareLocation && (
        <View style={styles.sharingDisabledBanner}>
          <Ionicons name="eye-off-outline" size={16} color="#fff" />
          <Text style={styles.sharingDisabledText}>
            Location sharing is off - enable it to see nearby friends
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  overlay: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  overlayText: {
    fontWeight: '600',
    fontSize: 12,
    flex: 1,
  },
  countBadge: {
    position: 'absolute',
    top: 100,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  attributionBadge: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    alignSelf: 'center',
  },
  attributionText: {
    fontSize: 11,
    textAlign: 'center',
    opacity: 0.75,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
  },
  centerBtn: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  refreshBtn: {
    position: 'absolute',
    bottom: 156,
    right: 16,
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(245,158,11,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  markerLetter: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  markerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(245,158,11,0.9)',
    marginTop: -1,
  },
  sharingDisabledBanner: {
    position: 'absolute',
    bottom: 52,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(79,70,229,0.85)',
  },
  sharingDisabledText: {
    color: '#fff',
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
  },
  calloutContainer: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 2,
  },
  calloutDesc: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default MapScreen;
