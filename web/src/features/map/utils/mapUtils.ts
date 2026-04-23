import type { GeoPosition } from '../../../types';

export function calculateBlurRadius(baseRadius: number): number {
  return Math.max(300, Math.min(500, baseRadius * 0.3));
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)}km`;
  }
  return `${Math.round(meters)}m`;
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }
  return `${minutes}min`;
}

export function isValidCoordinate(pos: GeoPosition | null): boolean {
  if (!pos) return false;
  return (
    typeof pos.lat === 'number' &&
    typeof pos.lng === 'number' &&
    pos.lat >= -90 && pos.lat <= 90 &&
    pos.lng >= -180 && pos.lng <= 180
  );
}

export function clampZoom(zoom: number): number {
  return Math.max(3, Math.min(18, zoom));
}

export function getZoomForRadius(radiusMeters: number): number {
  if (radiusMeters <= 500) return 16;
  if (radiusMeters <= 1000) return 15;
  if (radiusMeters <= 2000) return 14;
  if (radiusMeters <= 5000) return 13;
  return 12;
}