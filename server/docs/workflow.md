# System Workflow

## 1. Authentication Workflow
1. Mobile app requests OAuth `idToken` from Google.
2. App sends `idToken` to `/api/auth/google`.
3. Server validates token. Upserts MongoDB user profile.
4. Server generates an internal JWT and passes it back with the User object.

## 2. Location Tracking Workflow (The Node Loop)
1. At interval (e.g. 5 minutes), the mobile app posts coordinates to `/api/location/update`.
2. `LocationService` checks `lastProcessedLocationMap`.
   - If displacement < 50m → the Server terminates the chain cleanly and returns standard 200.
   - If displacement > 50m → the DB document is upserted, and `expiresAt` is pushed back by 1 hour.
3. The API triggers an asynchronous promise into the `ProximityService`.

## 3. Real-Time Proximity Match Workflow
1. The `ProximityService` resolves the User's active friends array.
2. Triggers an aggregated `$near` intercept restricted by the user's `settings.radius`.
3. For each hit:
   - Validates that the targeted Friend allows `locationSharingEnabled`.
   - Validates the precise Haversine distance conforms to the targeted Friend's `radius` limitation.
4. If mutual conditions exist, a cross-check triggers inside `lastNotifiedMap` (10-minute cooldown).
5. If allowed, writes a `Notification` envelope and emits a WebSocket packet simultaneously to both affected Users holding the `approximate distance`.
