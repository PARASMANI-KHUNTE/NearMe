# Geofencing Implementation for NearMe

## Overview

This document describes the complete geofencing implementation that replaces continuous GPS tracking with OS-managed geofence regions for dramatic battery savings.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     GEOFENCING FLOW                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. App Start / Login                                           │
│       │                                                          │
│       ▼                                                          │
│  2. Initialize GeofenceService                                   │
│       │                                                          │
│       ▼                                                          │
│  3. Fetch Friend Locations (GET /api/location/friends-for-      │
│     geofencing)                                                 │
│       │                                                          │
│       ▼                                                          │
│  4. Register Geofence Regions (OS-managed, ZERO GPS)            │
│       │  • iOS: Up to 20 regions                                │
│       │  • Android: Up to 100 regions                           │
│       │  • Radius = friend's radius + 500m buffer               │
│       ▼                                                          │
│  5. OS Monitors Regions (Background, No App Code Running)       │
│       │                                                          │
│       ├── ENTER Region ──► Start Precise GPS (30s intervals)    │
│       │                            │                             │
│       │                            ▼                             │
│       │                       Send location to server            │
│       │                            │                             │
│       │                            ▼                             │
│       │                       Server runs proximity check        │
│       │                            │                             │
│       │                            ▼                             │
│       │                       Socket.io: proximity_alert         │
│       │                                                          │
│       └── EXIT Region ────► Stop Precise GPS, Revert to Geofence │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Battery Impact Comparison

| Approach | GPS Usage | Battery Drain | Accuracy |
|----------|-----------|---------------|----------|
| **Before (Continuous GPS)** | Every 5-45s | 🔴 Very High | Perfect |
| **After (Geofencing)** | Only when near friend | 🟢 **~90% Less** | Perfect when needed |

## Key Components

### 1. Server: New Endpoint
```
GET /api/location/friends-for-geofencing
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "id": "friend-id",
      "name": "John",
      "picture": "url",
      "longitude": -122.4194,
      "latitude": 37.7749,
      "radius": 5000,
      "lastUpdated": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### 2. Mobile: GeofenceService (`mobile/src/services/geofenceService.ts`)

**Core Features:**
- OS-managed geofencing (iOS CoreLocation / Android GeofencingApi)
- Automatic precise GPS activation on region enter
- Automatic precise GPS deactivation on region exit
- Background fetch for periodic geofence refresh (15 min)
- Foreground precise tracking when app is open
- Event callbacks for UI updates

**Configuration:**
```typescript
const GEOFENCE_BUFFER_METERS = 500;        // Extra buffer around friend radius
const MAX_GEOFENCES = 20;                  // iOS limit
const PRECISE_TRACKING_INTERVAL = 30000;   // 30 seconds when inside region
const FOREGROUND_WATCH_INTERVAL = 60000;   // 1 minute for map updates
```

### 3. Integration Points

#### HomeScreen
- Initializes geofencing on mount when `shareLocation=true`
- Shows geofence status (active count, precise tracking count)
- Refreshes nearby count on geofence enter events

#### MapScreen
- Uses low-frequency foreground watch (1min/100m) for map centering only
- Initializes geofencing when visible
- Shows geofence status overlay
- Still fetches nearby users for map markers

#### AppNavigator
- Initializes geofencing after login (2s delay)
- Cleans up on logout
- Handles background permission requests

#### PermissionScreen
- Requests background location permission when sharing enabled
- Guides user to Settings if denied

### 4. LocationService Updates (`mobile/src/services/locationService.ts`)

**New Methods:**
- `startPreciseTracking()` - High accuracy, 10s intervals for meetups
- `startLocationUpdates()` - Now defaults to 60s/100m (battery friendly)
- `isTracking()` - Check if currently tracking

**Changes:**
- Default interval: 45s → 60s
- Distance interval: 50m → 100m
- Accuracy: Balanced (not High)

## Permissions

### iOS (`app.config.js`)
```javascript
infoPlist: {
  NSLocationWhenInUseUsageDescription: 'NearMe needs your location...',
  NSLocationAlwaysAndWhenInUseUsageDescription: 'NearMe uses background location...',
  NSLocationAlwaysUsageDescription: 'NearMe uses background location...',
  UIBackgroundModes: ['location', 'fetch'],
}
```

### Android (`app.config.js`)
```javascript
permissions: [
  'ACCESS_FINE_LOCATION',
  'ACCESS_COARSE_LOCATION',
  'ACCESS_BACKGROUND_LOCATION',
  'FOREGROUND_SERVICE',
  'FOREGROUND_SERVICE_LOCATION',
],
```

### Required Plugins
```javascript
plugins: [
  'expo-background-fetch',
  'expo-location',
  // ... existing plugins
]
```

## Testing

### Manual Testing

1. **Build Development Client**
   ```bash
   cd mobile
   npx expo run:android  # or run:ios
   ```

2. **Test with Two Devices**
   - Device A: Login as User A, enable location sharing
   - Device B: Login as User B, enable location sharing, add as friend
   - Move Device B near Device A
   - Observe: Geofence triggers → precise tracking → proximity alert

3. **Debug Console Commands**
   ```javascript
   // In React Native debugger console:
   import { geofenceService } from './src/services/geofenceService';
   
   // Check status
   geofenceService.getStatus();
   
   // Force refresh
   const token = useAuthStore.getState().token;
   geofenceService.refreshGeofences(token);
   
   // Manual stop
   geofenceService.stop();
   ```

### Automated Test (`geofenceService.test.ts`)
```typescript
import { runFullTest } from './services/geofenceService.test';
const token = useAuthStore.getState().token;
await runFullTest(token);
```

## Server-Side Proximity (Unchanged)

The server-side proximity engine in `proximity.service.ts` remains the same:
- Triggered by `LocationService.handleLocationUpdate()`
- Runs `ProximityService.handleLocationUpdate()` asynchronously
- Checks mutual consent, distance, and cooldown
- Emits `proximity_alert` via Socket.io

## Migration Notes

### Removed/Deprecated
- `HomeScreen`: Continuous `LocationService.startLocationUpdates(45000)`
- `MapScreen`: Continuous `Location.watchPositionAsync(5000ms)`
- Client-side polling for nearby users (now push-only via Socket.io)

### Fallback Behavior
If geofencing fails (permissions, OS limits), falls back to:
- `LocationService.startLocationUpdates(60000)` - 1 min intervals

## Troubleshooting

### Geofences Not Triggering
1. Check background permission granted
2. Verify friend has valid location (updated < 1hr ago)
3. Check iOS 20-region limit not exceeded
4. Verify `UIBackgroundModes` includes `location`

### Precise Tracking Not Starting
1. Check `BackgroundFetch` task registered
2. Verify `PRECISE_TRACKING_TASK` defined in TaskManager
3. Check network connectivity for location updates

### Battery Still High
1. Verify `Accuracy.Balanced` used (not High)
2. Check `timeInterval` ≥ 60000ms for foreground
3. Ensure geofences stopped when `shareLocation=false`

## Future Enhancements

1. **Smart Geofence Sizing**: Adjust buffer based on friend's movement patterns
2. **Predictive Prefetching**: Pre-fetch locations for likely nearby friends
3. **Bluetooth Beacon Backup**: Use BLE for indoor proximity
4. **Server-Side Geofence Management**: Push geofence updates via Socket.io

## Files Modified

### Server
- `server/src/modules/location/location.controller.ts` - Added `getFriendsForGeofencing`
- `server/src/modules/location/location.routes.ts` - Added route

### Mobile
- `mobile/src/services/geofenceService.ts` - **NEW** Core geofencing service
- `mobile/src/services/geofenceService.test.ts` - **NEW** Test utilities
- `mobile/src/services/locationService.ts` - Updated for battery efficiency
- `mobile/src/screens/main/HomeScreen.tsx` - Integrated geofencing
- `mobile/src/screens/main/MapScreen.tsx` - Integrated geofencing
- `mobile/src/navigation/AppNavigator.tsx` - Initialize on login
- `mobile/src/screens/PermissionScreen.tsx` - Request background permission
- `mobile/app.config.js` - Added permissions, plugins, Info.plist