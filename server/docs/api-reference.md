# API Reference

For testing interactive endpoints, use the Swagger UI hosted on `/api-docs` when running the server.

## Authentication Routes
**Base URL:** `/api/auth`
- `POST /google`: Authenticates a user securely using a Google `idToken`. Returns a `token` (JWT) and a `user` object.

## User Routes
**Base URL:** `/api/users`
Requires JWT Authorization Header: `Bearer <token>`

- `GET /profile`: Retrieves the authenticated user's profile and settings.
- `PATCH /settings`: Updates the user's distance tolerance (`radius`) and opt-out toggle (`locationSharingEnabled`).

## Friends Routes
**Base URL:** `/api/friends`
Requires JWT Authorization Header: `Bearer <token>`

- `GET /`: Retrieves an array of all active/accepted friends.
- `POST /request`: Sends a friend request. Requires `recipientId` in Body.
- `POST /request/:requestId/accept`: Accepts a pending request.
- `POST /request/:requestId/reject`: Rejects a pending request.

## Location Routes
**Base URL:** `/api/location`
Requires JWT Authorization Header: `Bearer <token>`

- `POST /update`: Upserts the user's current geo-coordinates. Automatically resets the 1-hour expiration timer.
  - **Body Example:**
    ```json
    {
      "longitude": -122.4194,
      "latitude": 37.7749
    }
    ```

## WebSockets
**Connection Endpoint:** `ws://<domain>`
Requires sending the JWT via auth handshake:
```javascript
const socket = io('ws://localhost:3000', {
  auth: { token: 'YOUR_JWT_TOKEN' }
})
```

**Emitted Events (Server -> Client):**
- `proximity_alert`: Fired when a mutual friend enters the configured radius. Contains approximate distancing.
- `friend_request`: (Planned) Fired when an incoming request is opened.
