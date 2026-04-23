import { Circle, Popup } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import type { GeoPosition } from '../../../types';
import { calculateBlurRadius } from '../utils/mapUtils';

interface FriendZoneProps {
  id: string;
  position: GeoPosition;
  name: string;
  baseRadius?: number;
}

export function FriendZone({ position, name, baseRadius = 1000 }: FriendZoneProps) {
  const blurRadius = calculateBlurRadius(baseRadius);

  return (
    <Circle
      center={[position.lat, position.lng] as LatLngExpression}
      radius={blurRadius}
      pathOptions={{
        color: '#4F46E5',
        fillColor: '#4F46E5',
        fillOpacity: 0.15,
        weight: 1,
        dashArray: '4, 4',
      }}
      eventHandlers={{
        mouseover: (e) => {
          e.target.setStyle({ fillOpacity: 0.3 });
        },
        mouseout: (e) => {
          e.target.setStyle({ fillOpacity: 0.15 });
        },
      }}
>
        <Popup>
          <div style={{ padding: '0.25rem' }}>
            <strong>{name}</strong>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>
              Friend is within this area
            </p>
          </div>
        </Popup>
      </Circle>
  );
}