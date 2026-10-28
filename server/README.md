# NearMe Backend API

Production-ready modular Node.js/TypeScript REST API and real-time Socket.io service for NearMe — Privacy-First Proximity Social Network.

## Features

- **Authentication**: JWT-based auth with refresh token rotation and Google OAuth verification via Google Auth Library.
- **Privacy-First Geolocation**: 2dsphere geospatial MongoDB queries with coarse/fuzzy distance calculations. Exact coordinates are protected.
- **Resilient Real-time Proximity**: Socket.io real-time engine with Redis-backed proximity cooldowns and graceful in-memory fallbacks.
- **Production Hardening**: SHA-256 hashed password reset tokens, centralized Zod validation, granular rate limiting, structured Pino logging, and secure HTTP headers via Helmet.
- **OpenAPI / Swagger**: Interactive API documentation at `/api-docs` (with optional HTTP basic auth in production).

## Architecture

```
server/
├── src/
│   ├── modules/
│   │   ├── auth/          # Registration, login, Google OAuth, password reset
│   │   ├── users/         # Profile management, privacy settings
│   │   ├── friends/       # Friend requests, accepts, rejects, user search
│   │   ├── location/      # GPS coordinate updates, nearby queries
│   │   ├── proximity/     # Proximity detection engine, Redis cooldowns
│   │   └── notifications/ # Notification dispatch and read state management
│   ├── shared/
│   │   ├── db/            # Mongoose MongoDB connection
│   │   ├── redis/         # Redis connection client
│   │   ├── socket/        # Socket.io authentication & event handlers
│   │   ├── logger/        # Structured Pino logger
│   │   └── middlewares/   # JWT auth, rate limiters, error handling
│   ├── docs/              # Swagger / OpenAPI specification
│   ├── app.ts             # Express app & route mounting
│   └── server.ts          # HTTP & WebSocket bootstrap
├── package.json
└── tsconfig.json
```

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- MongoDB 5.0+ (running locally or MongoDB Atlas)
- Redis 6.0+ (optional; service falls back to in-memory gracefully)

### Setup & Run

1. Clone and navigate to server directory:
   ```bash
   cd server
   ```

2. Copy environment file and configure variables:
   ```bash
   cp .env.example .env
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run in development mode:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   npm start
   ```

## Documentation

Interactive Swagger documentation is available locally at:
[http://localhost:3000/api-docs](http://localhost:3000/api-docs)
