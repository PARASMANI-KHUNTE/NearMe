import axios from 'axios';
import type { GeoPosition, RouteData } from '../../../types';

const OSRM_BASE_URL = 'https://router.project-osrm.org';

export async function getRoute(
  start: GeoPosition,
  end: GeoPosition
): Promise<RouteData> {
  const routeUrl = `${OSRM_BASE_URL}/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;

  const response = await axios.get(routeUrl, { timeout: 10000 });

  if (response.data.code !== 'Ok' || !response.data.routes?.length) {
    throw new Error('Unable to calculate route');
  }

  const route = response.data.routes[0];

  return {
    geometry: route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]),
    distance: route.distance,
    duration: route.duration,
  };
}