# NearMe - Location-Based Social Networking

A comprehensive location-based social networking application that enables users to connect with friends and receive proximity alerts while maintaining privacy.

## 🏗️ Architecture

NearMe is a monorepo consisting of three main components:

### Server (Node.js/TypeScript + Express)
- **API**: RESTful API with Express.js
- **Database**: MongoDB with GeoSpatial queries for location data
- **Cache**: Redis for session management and location caching
- **Real-time**: Socket.io for instant notifications
- **Authentication**: JWT with Google OAuth support

### Mobile (Expo/React Native)
- **Framework**: React Native with Expo
- **State Management**: Zustand with persistence
- **Navigation**: React Navigation
- **Maps**: React Native Maps
- **Location**: Expo Location API
- **Storage**: Secure storage for sensitive data

### Web (Vite + React)
- **Framework**: React 19 with Vite
- **State Management**: Zustand
- **Routing**: React Router
- **Maps**: React Leaflet with OpenStreetMap
- **Styling**: Tailwind CSS with custom theming

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (LTS recommended)
- MongoDB 4.4+
- Redis 6.0+
- Expo CLI (for mobile development)

### Server Setup

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

### Web Setup

```bash
cd web
cp .env.example .env
npm install
npm run dev
```

### Mobile Setup

```bash
cd mobile
npm install
npm run start
```

## 🔧 Configuration

### Server Environment Variables

```env
NODE_ENV=development
PORT=3000

# Database
MONGO_URI=mongodb://localhost:27017/nearme

# Redis
REDIS_URI=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=30d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
ANDROID_GOOGLE_CLIENT_ID=your-android-client-id
IOS_GOOGLE_CLIENT_ID=your-ios-client-id

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=*
```

### Mobile Environment Variables

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api
EXPO_PUBLIC_SOCKET_URL=http://localhost:3000
EXPO_PUBLIC_WEB_GOOGLE_CLIENT_ID=your-google-client-id
EXPO_PUBLIC_ANDROID_GOOGLE_CLIENT_ID=your-android-client-id
EXPO_PUBLIC_IOS_GOOGLE_CLIENT_ID=your-ios-client-id
```

### Web Environment Variables

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

## 📁 Project Structure

```
nearme/
├── server/                 # Backend API
│   ├── src/
│   │   ├── modules/       # Feature modules
│   │   │   ├── auth/     # Authentication
│   │   │   ├── users/    # User management
│   │   │   ├── friends/  # Friend system
│   │   │   ├── location/ # Location services
│   │   │   └── notifications/ # Notifications
│   │   ├── shared/       # Shared utilities
│   │   │   ├── config/   # Configuration
│   │   │   ├── db/       # Database connections
│   │   │   ├── redis/    # Redis connections
│   │   │   ├── socket/   # Socket.io setup
│   │   │   ├── logger/   # Logging utilities
│   │   │   └── middlewares/ # Express middlewares
│   │   ├── app.ts        # Express app setup
│   │   └── server.ts     # Server entry point
│   ├── package.json
│   └── tsconfig.json
├── mobile/                # React Native app
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── screens/      # Screen components
│   │   ├── navigation/   # Navigation setup
│   │   ├── services/     # API services
│   │   ├── store/        # State management
│   │   ├── hooks/        # Custom hooks
│   │   ├── theme/        # Theme configuration
│   │   └── utils/        # Utility functions
│   ├── package.json
│   └── app.json
└── web/                   # Web application
    ├── src/
    │   ├── components/   # Reusable components
    │   ├── pages/        # Page components
    │   ├── features/     # Feature modules
    │   ├── services/     # API services
    │   ├── store/        # State management
    │   ├── hooks/        # Custom hooks
    │   └── config/       # Configuration
    ├── package.json
    └── vite.config.ts
```

## 🔐 Security Features

### Authentication
- JWT token-based authentication
- Google OAuth integration
- Secure token storage (expo-secure-store on mobile)
- Token refresh mechanism

### Privacy
- Proximity-based location sharing (not exact coordinates)
- User-controlled visibility settings
- Location sharing toggle
- Radius-based detection

### API Security
- Rate limiting
- Input validation with Zod
- CORS configuration
- SQL injection prevention (MongoDB)
- XSS protection

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/google` - Login with Google OAuth
- `GET /api/users/profile` - Get user profile

### Friends
- `GET /api/friends` - Get friends list
- `POST /api/friends/request` - Send friend request
- `POST /api/friends/request/:id/accept` - Accept request
- `POST /api/friends/request/:id/reject` - Reject request
- `DELETE /api/friends/:id` - Remove friend
- `GET /api/friends/search` - Search users

### Location
- `POST /api/location/update` - Update user location
- `GET /api/location/nearby` - Get nearby users
- `GET /api/location/friends-status` - Get friends location status

### Notifications
- `GET /api/notifications` - Get notifications
- `POST /api/notifications/:id/read` - Mark as read

## 🔄 Real-time Features

### Socket.io Events

#### Client → Server
- `location_update` - Send location update
- `friend_request` - Send friend request
- `request_accept` - Accept friend request
- `request_reject` - Reject friend request

#### Server → Client
- `proximity_alert` - Proximity notification
- `friend_request` - Incoming friend request
- `request_accepted` - Request accepted
- `friend_nearby` - Friend status change

## 🧪 Testing

### Server Tests
```bash
cd server
npm test
```

### Web Tests
```bash
cd web
npm test
```

### Mobile Tests
```bash
cd mobile
npm test
```

## 📊 Performance Optimization

### Server
- Redis caching for location data
- MongoDB GeoSpatial indexing
- Connection pooling
- Rate limiting

### Mobile
- Location update throttling (50m movement threshold)
- Offline queue for failed requests
- Local caching with TTL
- Image optimization

### Web
- Code splitting
- Lazy loading
- Service worker for offline support
- Image optimization

## 🚨 Error Handling

### Server
- Custom error classes
- Global error handler
- Structured error responses
- Error logging with Pino

### Mobile
- Retry mechanism with exponential backoff
- Offline queue for failed requests
- User-friendly error messages
- Error boundaries

### Web
- Axios interceptors for error handling
- Global error handler
- User-friendly error messages
- Error boundaries

## 📱 Offline Support

### Mobile
- Request queuing when offline
- Automatic sync when online
- Local caching of user data
- Offline indicators

### Web
- Service worker for offline support
- Request queuing
- Local storage caching
- Offline indicators

## 🎨 Theming

### Mobile
- Dynamic theme switching (day/night)
- Custom color palette
- Consistent spacing system
- Platform-specific styling

### Web
- Dark/light mode support
- CSS custom properties
- Tailwind CSS integration
- Responsive design

## 🔧 Development Tools

### Server
- Nodemon for hot reload
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Swagger for API documentation

### Mobile
- Expo for development
- React Native Debugger
- Flipper for debugging
- TypeScript for type safety

### Web
- Vite for fast development
- React DevTools
- TypeScript for type safety
- ESLint for code quality

## 📦 Deployment

### Server
```bash
cd server
npm run build
npm start
```

### Web
```bash
cd web
npm run build
# Deploy dist/ folder to your hosting service
```

### Mobile
```bash
cd mobile
eas build --platform android
eas build --platform ios
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Expo team for the amazing React Native framework
- Socket.io for real-time communication
- MongoDB for the flexible database
- Redis for fast caching
- OpenStreetMap for map data