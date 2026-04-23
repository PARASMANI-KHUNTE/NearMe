import { Polyline } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import type { RouteData } from '../../../types';

interface RoutePolylineProps {
  positions: RouteData['geometry'];
}

export function RoutePolyline({ positions }: RoutePolylineProps) {
  const latLngPositions = positions.map((pos) => pos as LatLngExpression);

  return (
    <Polyline
      positions={latLngPositions}
      pathOptions={{
        color: '#38BDF8',
        weight: 4,
        opacity: 0.8,
        lineCap: 'round',
        lineJoin: 'round',
      }}
    />
  );
}