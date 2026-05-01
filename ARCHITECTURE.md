# NearMe Architecture Documentation

## System Overview

NearMe is a location-based social networking platform that enables users to connect with friends and receive proximity alerts while maintaining privacy. The system consists of three main components:

1. **Server**: Node.js/TypeScript backend with Express, MongoDB, Redis, and Socket.io
2. **Mobile**: React Native cross-platform application
3. **Web**: Modern React web application

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
├─────────────────────────────────────────────────────────────┤
│  Mobile App (React Native)    │    Web App (React)          │
│  - Expo                       │    - Vite                    │
│  - React Navigation           │    - React Router            │
│  - React Native Maps          │    - React Leaflet           │
│  - Expo Location              │    - Browser Geolocation     │
│  - Socket.io Client           │    - Socket.io Client        │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                       │
├─────────────────────────────────────────────────────────────┤
│  Express.js Server                                           │
│  - CORS Middleware                                           │
│  - Rate Limiting                                             │
│  - Request Validation                                        │
│  - Authentication Middleware                                 │
│  - Error Handling                                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                       │
├─────────────────────────────────────────────────────────────┤
│  Service Layer                                               │
│  - AuthService                                              │
│  - FriendService                                             │
│  - LocationService                                           │
│  - NotificationService                                       │
│  - ProximityService                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Access Layer                        │
├─────────────────────────────────────────────────────────────┤
│  MongoDB Models                                              │
│  - User                                                      │
│  - Location                                                  │
│  - FriendRequest                                             │
│  - Notification                                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                      │
├─────────────────────────────────────────────────────────────┤
│  MongoDB (Primary Database)    │    Redis (Cache & Sessions) │
│  - User Data                   │    - Location Cache         │
│  - Location Data               │    - Session Data           │
│  - Friend Relationships        │    - Rate Limiting          │
│  - Notifications               │    - Proximity Cooldowns     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Real-time Communication                    │
├─────────────────────────────────────────────────────────────┤
│  Socket.io Server                                            │
│  - JWT Authentication                                       │
│  - User Connection Management                                │
│  - Event Broadcasting                                       │
│  - Proximity Alerts                                          │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Authentication System

#### Flow
1. User registers/logs in via email/password or Google OAuth
2. Server validates credentials and generates JWT token
3. Client stores token securely (SecureStore on mobile, localStorage on web)
4. Client includes token in Authorization header for subsequent requests
5. Server validates token on protected routes

#### Security Features
- JWT with 30-day expiration
- Secure token storage
- Token refresh mechanism
- Google OAuth integration
- Rate limiting on auth endpoints

### 2. Location System

#### Architecture
```
Client Location Updates
    ↓
Location Service (API)
    ↓
MongoDB (GeoSpatial Queries)
    ↓
Redis (Location Cache)
    ↓
Proximity Service
    ↓
Socket.io (Real-time Alerts)
```

#### Features
- **Movement Threshold**: 50m minimum movement before update
- **Cache TTL**: 1 hour for location data
- **Privacy**: Proximity-based sharing, not exact coordinates
- **Real-time**: Socket.io for instant proximity alerts

#### Data Flow
1. Client sends location update (lat, lng, radius)
2. Server checks Redis cache for last known position
3. If movement > 50m, update MongoDB and Redis cache
4. Trigger proximity detection asynchronously
5. Find nearby friends using GeoSpatial queries
6. Send proximity alerts via Socket.io

### 3. Friend System

#### Relationship Model
```
User A ←→ FriendRequest ←→ User B
    ↓                    ↓
  Accepted            Accepted
    ↓                    ↓
  Friends List       Friends List
```

#### Features
- Send/accept/reject friend requests
- Search users by name or unique ID
- Real-time friend status updates
- Friend proximity notifications

### 4. Notification System

#### Types
- `proximity_alert`: Friend nearby
- `friend_request`: Incoming friend request
- `request_accepted`: Request accepted
- `meet_request`: Meetup request

#### Delivery
- Real-time via Socket.io
- Stored in MongoDB for history
- Mobile push notifications (future)
- Web notifications (future)

### 5. Real-time Communication

#### Socket.io Architecture
```
Client (Socket.io Client)
    ↓
Connection (JWT Auth)
    ↓
Socket.io Server
    ↓
Event Handlers
    ↓
User Socket Map
    ↓
Event Broadcasting
```

#### Events
**Client → Server**
- `location_update`: Send location
- `friend_request`: Send request
- `request_accept`: Accept request
- `request_reject`: Reject request

**Server → Client**
- `proximity_alert`: Proximity notification
- `friend_request`: Incoming request
- `request_accepted`: Request accepted
- `friend_nearby`: Status change

## Data Models

### User
```typescript
{
  _id: ObjectId
  googleId?: string
  uniqueId: string (8-char alphanumeric)
  email: string (unique)
  password?: string (hashed)
  name: string
  picture?: string
  settings: {
    radius: number (default: 5000m)
    locationSharingEnabled: boolean (default: true)
  }
  createdAt: Date
  updatedAt: Date
}
```

### Location
```typescript
{
  _id: ObjectId
  userId: ObjectId (ref: User)
  location: {
    type: 'Point'
    coordinates: [longitude, latitude]
  }
  expiresAt: Date (TTL index)
  createdAt: Date
  updatedAt: Date
}
```

### FriendRequest
```typescript
{
  _id: ObjectId
  requesterId: ObjectId (ref: User)
  recipientId: ObjectId (ref: User)
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: Date
  updatedAt: Date
}
```

### Notification
```typescript
{
  _id: ObjectId
  recipientId: ObjectId (ref: User)
  senderId?: ObjectId (ref: User)
  type: 'proximity_alert' | 'friend_request' | 'meet_request'
  content: string
  metadata?: any
  read: boolean (default: false)
  createdAt: Date
}
```

## API Design

### RESTful Conventions
- `GET /resource` - List resources
- `GET /resource/:id` - Get single resource
- `POST /resource` - Create resource
- `PATCH /resource/:id` - Update resource
- `DELETE /resource/:id` - Delete resource

### Response Format
```typescript
{
  success: boolean
  data?: any
  message?: string
}
```

### Error Handling
```typescript
{
  success: false
  message: string
  // Development only
  stack?: string
  details?: any
}
```

## Security Architecture

### Authentication Flow
```
1. User submits credentials
2. Server validates credentials
3. Server generates JWT token
4. Server returns token to client
5. Client stores token securely
6. Client includes token in requests
7. Server validates token on protected routes
```

### Authorization
- Role-based access control (future)
- Resource ownership checks
- API rate limiting
- Input validation

### Privacy Protection
- Proximity-based location sharing
- User-controlled visibility
- Data encryption at rest (future)
- Data encryption in transit (HTTPS)

## Performance Optimization

### Caching Strategy
- **Redis**: Location data, sessions, rate limiting
- **Client-side**: User profile, friends list, notifications
- **CDN**: Static assets (web)

### Database Optimization
- GeoSpatial indexing for location queries
- Compound indexes for common queries
- Connection pooling
- Query optimization

### Real-time Optimization
- Socket.io rooms for targeted broadcasting
- Event throttling
- Connection pooling
- Message batching (future)

## Scalability Considerations

### Horizontal Scaling
- Stateless API servers
- Redis cluster for caching
- MongoDB replica sets
- Load balancing

### Vertical Scaling
- Database indexing
- Query optimization
- Caching strategies
- Connection pooling

### Future Enhancements
- Microservices architecture
- Event-driven architecture
- Message queues (RabbitMQ/Kafka)
- GraphQL API

## Monitoring & Logging

### Logging
- Structured logging with Pino
- Log levels: error, warn, info, debug
- Request/response logging
- Error tracking

### Monitoring (Future)
- Application performance monitoring
- Error tracking (Sentry)
- Uptime monitoring
- User analytics

## Deployment Architecture

### Development
- Local development environment
- Docker containers (future)
- Hot reload

### Staging
- Staging environment
- Feature flags
- A/B testing (future)

### Production
- Load balancer
- Multiple API servers
- Database clustering
- CDN for static assets
- SSL/TLS encryption

## Technology Stack

### Server
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB
- **Cache**: Redis
- **Real-time**: Socket.io
- **Authentication**: JWT + Google OAuth
- **Validation**: Zod
- **Logging**: Pino

### Mobile
- **Framework**: React Native
- **Build Tool**: Expo
- **Language**: TypeScript
- **State**: Zustand
- **Navigation**: React Navigation
- **Maps**: React Native Maps
- **Location**: Expo Location
- **Storage**: SecureStore, AsyncStorage

### Web
- **Framework**: React 19
- **Build Tool**: Vite
- **Language**: TypeScript
- **State**: Zustand
- **Routing**: React Router
- **Maps**: React Leaflet
- **Styling**: Tailwind CSS
- **Real-time**: Socket.io Client

## Development Workflow

### Git Workflow
- Main branch for production
- Feature branches for new features
- Pull requests for code review
- CI/CD pipeline (future)

### Code Quality
- TypeScript for type safety
- ESLint for linting
- Prettier for formatting
- Husky for git hooks (future)

### Testing Strategy
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical flows (future)

## Future Enhancements

### Planned Features
- Group proximity detection
- Event planning and coordination
- In-app messaging
- Voice/video calls
- Location history
- Analytics dashboard
- Admin panel
- Multi-language support

### Technical Improvements
- GraphQL API
- Microservices architecture
- Event-driven architecture
- Advanced caching strategies
- Machine learning for proximity prediction
- Blockchain for identity verification (future)

## Maintenance & Support

### Regular Tasks
- Dependency updates
- Security patches
- Performance monitoring
- Log analysis
- User feedback analysis

### Emergency Procedures
- Server downtime
- Security breaches
- Data corruption
- Performance degradation

## Documentation

### Code Documentation
- JSDoc comments for complex functions
- TypeScript interfaces for data structures
- README files for each module

### API Documentation
- Swagger/OpenAPI specification
- Endpoint documentation
- Request/response examples
- Error codes

### User Documentation
- Getting started guide
- Feature documentation
- FAQ
- Troubleshooting guide