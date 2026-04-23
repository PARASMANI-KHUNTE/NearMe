import type { ThemeMode } from './index';

// Google Maps styling is only supported on Google Maps provider (Android by default).
// Keep these styles intentionally subtle so UI overlays remain readable.

export const mapStyleNight = [
  { elementType: 'geometry', stylers: [{ color: '#1A120B' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#FFF3E0' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#2A1D14' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#3A2A1E' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#4A3323' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#FBBF24' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0B1220' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#A8A29E' }] },
] as const;

export const mapStyleDay = [
  { elementType: 'geometry', stylers: [{ color: '#FFF8EE' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#3B2A16' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#F3D9B1' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#EACCA0' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#7C5A30' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#CDE7FF' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#2D3C4F' }] },
] as const;

export const getMapStyle = (mode: ThemeMode) => (mode === 'night' ? mapStyleNight : mapStyleDay);

