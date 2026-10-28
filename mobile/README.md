# NearMe Mobile Application

Native cross-platform mobile application for NearMe built with Expo SDK 55, React Native 0.83, React 19, Zustand, and React Navigation.

## Features

- **Battery-Optimized Geolocation**: Balanced accuracy foreground tracking and background geofencing with 900s polling intervals.
- **Offline Resilient Queue**: Failed location updates are buffered in memory and flushed automatically when connectivity is restored.
- **Dynamic Theming**: Dynamic day/night warm palette system across all main screens.
- **Secure Platform Storage**: `expo-secure-store` with transparent fallback for web and dev environments.
- **Native Google Sign-In**: Integrated `@react-native-google-signin/google-signin` with native Google Play Services.

## Architecture

```
mobile/
├── src/
│   ├── components/        # Reusable UI widgets (Button, Input, AuthLayout)
│   ├── config/            # Environment resolution
│   ├── hooks/             # Custom React hooks (useAppTheme)
│   ├── navigation/        # React Navigation native stacks and bottom tabs
│   ├── screens/           # Main and Auth screens (Home, Map, Friends, Notifications, Profile)
│   ├── services/          # API, Auth, LocationService (offline queue), Geofencing, Socket.io
│   ├── store/             # Zustand stores (useAppStore, authStore, notificationStore)
│   ├── theme/             # Palette and map style tokens
│   └── utils/             # Platform-aware logger and helpers
├── app.json               # Expo configuration & plugins
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app or Android Studio / Xcode for native runtimes

### Setup & Run

1. Navigate to mobile directory:
   ```bash
   cd mobile
   ```

2. Copy environment file:
   ```bash
   cp .env.example .env
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run development server:
   ```bash
   npm run start
   ```

5. Typecheck code:
   ```bash
   npm run typecheck
   ```
