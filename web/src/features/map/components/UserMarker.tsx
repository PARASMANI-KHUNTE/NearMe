import { Marker } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import L from 'leaflet';
import type { GeoPosition } from '../../../types';

interface UserMarkerProps {
  position: GeoPosition;
}

const userIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `
    <div style="
      width: 20px;
      height: 20px;
      background: #4F46E5;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(79, 70, 229, 0.5);
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export function UserMarker({ position }: UserMarkerProps) {
  return (
    <Marker
      position={[position.lat, position.lng] as LatLngExpression}
      icon={userIcon}
    />
  );
}