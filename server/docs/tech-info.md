# Technical Information

## Technology Stack
- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** MongoDB
- **ODM:** Mongoose
- **Real-time Engine:** Socket.io
- **Authentication:** `google-auth-library` and JSON Web Tokens (JWT)
- **Validation:** Zod
- **Logger:** Pino & pino-http
- **Testing:** Jest + Supertest
- **API Documentation:** Swagger UI (OpenAPI 3.0)

## Architecture
The application uses a **Modular Monolith** pattern organized into feature-based modules:
- `/modules/auth`: Handles Google OAuth login and JWT distribution.
- `/modules/users`: Manages profile retrieval and proximity/privacy settings.
- `/modules/friends`: Manages bi-directional friend requests and active friend listings.
- `/modules/location`: Receives constant GPS polling, stores state, and acts as the entry-point to the proximity system.
- `/modules/proximity`: Isolated service layer that handles complex `$near` spatial querying and mutual consent calculations.
- `/modules/notifications`: Generates alerts and emits them over WebSockets.

## Key Design Patterns & Optimizations
1. **Movement Threshold Cache:** The API caches the last processed coordinates in an LRU/Map structure. It avoids expensive database spatial lookups unless a user moves more than 50 meters.
2. **Event-Driven Proximity:** Proximity checks are triggered asynchronously `(fire-and-forget)` from the location routes.
3. **Spam Prevention (Cooldowns):** The Proximity Service tracks notification dispatch times across dyads (`userA_userB`) and mutes redundant alerts occurring within 10 minutes.
4. **Spatial Indexing:** MongoDB's `2dsphere` index is applied to the Location schema.
5. **Time-To-Live (TTL):** A MongoDB TTL index automatically destroys location data after 1 hour of silence to maintain privacy and prune the heap.
