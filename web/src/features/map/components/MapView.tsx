import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap, Circle, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { UserMarker } from './UserMarker';
import { FriendZone } from './FriendZone';
import { RoutePolyline } from './RoutePolyline';
import { useMapStore } from '../types/mapStore';
import { useUserLocation } from '../hooks/useUserLocation';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { MapPin } from 'lucide-react';
import { useThemeStore } from '../../../store/themeStore';
import { useLocationStore } from '../../../store/locationStore';

interface MapViewProps {
  height?: string;
}

interface MapControllerProps {
  userLocation: { lat: number; lng: number } | null;
  activeRouteGeometry: [number, number][] | null;
}

function MapController({ userLocation, activeRouteGeometry }: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 2 });
    }
  }, [map, userLocation]);

  useEffect(() => {
    if (activeRouteGeometry && activeRouteGeometry.length > 0) {
      const bounds = activeRouteGeometry.reduce(
        (acc, coord) => acc.extend(coord),
        map.getBounds()
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, activeRouteGeometry]);

  return null;
}

function createFriendMarkerIcon(name: string) {
  return L.divIcon({
    className: 'custom-friend-marker',
    html: `
      <div style="
        width: 36px;
        height: 36px;
        background: rgba(245, 158, 11, 0.9);
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        color: white;
        box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
      ">${name.charAt(0).toUpperCase()}</div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

export function MapView({ height = '100%' }: MapViewProps) {
  const { location, error, isLoading } = useUserLocation();
  const { nearbyFriends, activeRoute, setUserLocation } = useMapStore();
  const theme = useThemeStore((state) => state.theme);
  const radius = useLocationStore((state) => state.radius);

  useEffect(() => {
    if (location) {
      setUserLocation(location);
    }
  }, [location, setUserLocation]);

  if (isLoading) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)' }}>
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-[var(--text-muted)] font-medium animate-pulse">Calibrating Satellites...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', color: 'var(--text)', padding: '2rem', textAlign: 'center' }}>
        <div className="space-y-4 max-w-xs">
          <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto">
            <MapPin className="text-error w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold">Location Error</h3>
          <p className="text-[var(--text-muted)] text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const center: [number, number] = location ? [location.lat, location.lng] : [51.505, -0.09];

  const tileUrl =
    theme === 'light'
      ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  return (
    <div style={{ height, borderRadius: '2rem', overflow: 'hidden' }} className="border border-[var(--border)] shadow-2xl">
      <MapContainer
        center={center}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={tileUrl}
        />

        <MapController userLocation={location} activeRouteGeometry={activeRoute?.geometry ?? null} />

        {location && <UserMarker position={{ lat: location.lat, lng: location.lng }} />}

        {/* Detection radius circle */}
        {location && (
          <Circle
            center={[location.lat, location.lng]}
            radius={radius}
            pathOptions={{
              color: '#4F46E5',
              fillColor: '#4F46E5',
              fillOpacity: 0.08,
              weight: 1.5,
              dashArray: '4, 4',
            }}
          />
        )}

        {nearbyFriends.map((friend) => (
          <FriendZone
            key={friend.id}
            id={friend.id}
            position={friend.approximateLocation}
            name={friend.name}
          />
        ))}

        {/* Friend markers with initials */}
        {nearbyFriends.map((friend) => (
          <Marker
            key={`marker-${friend.id}`}
            position={[friend.approximateLocation.lat, friend.approximateLocation.lng]}
            icon={createFriendMarkerIcon(friend.name)}
          >
            <Tooltip direction="top" offset={[0, -18]}>
              <div style={{ textAlign: 'center', padding: '2px 4px' }}>
                <strong>{friend.name}</strong>
                <br />
                <span style={{ fontSize: '11px', color: '#6b7280' }}>
                  {friend.distance ? `~${friend.distance}m away` : 'Nearby friend'}
                </span>
              </div>
            </Tooltip>
          </Marker>
        ))}

        {activeRoute && <RoutePolyline positions={activeRoute.geometry} />}
      </MapContainer>
    </div>
  );
}
