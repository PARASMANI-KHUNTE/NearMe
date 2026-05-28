import { logger } from '../utils/logger';

interface OSMRRouteResponse {
  code: string;
  routes: {
    geometry: {
      coordinates: [number, number][];
      type: string;
    };
    distance: number;
    duration: number;
  }[];
}

export interface RouteData {
  geometry: [number, number][];
  distance: number;
  duration: number;
}

export class OSRMService {
  private static baseUrl = 'https://router.project-osrm.org/route/v1';

  static async getRoute(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number
  ): Promise<RouteData | null> {
    try {
      const url = `${this.baseUrl}/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      const data: OSMRRouteResponse = await response.json();

      if (data.code !== 'Ok' || !data.routes.length) {
        logger.error('OSRM route error:', data.code);
        return null;
      }

      const route = data.routes[0];
      const coordinates = route.geometry.coordinates.map(
        (coord: [number, number]): [number, number] => [coord[1], coord[0]]
      );

      return {
        geometry: coordinates,
        distance: route.distance,
        duration: route.duration,
      };
    } catch (error) {
      logger.error('OSRM request failed:', error);
      return null;
    }
  }
}
