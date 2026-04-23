# NearMe Features

## 1. Google OAuth Single Sign-On (SSO)
Users are authenticated securely via Google tokens seamlessly verified on the backend, generating stateless JWT session variables.

## 2. Dynamic Privacy Rules
Users maintain strict governance over their footprint. Systemic visibility is altered via:
- Configurable radius matching. Users are only matched if their proximity satisfies **both** actors' configured limits.
- Master Location Sharing toggles. All background jobs automatically cull disabled users out of the spatial pipeline to respect global bounds.

## 3. Real-Time Proximity Mapping Engine
A dedicated service intersects incoming coordinate grids against accepted `FriendRequest` schemas using geospatial queries. Real-time updates evaluate Haversine algorithmic ranges to detect collision points dynamically.

## 4. Hardware/Network Optimization
The backend refuses computationally heavy DB routines unless the user successfully displaces themselves further than 50 meters from their last known node.

## 5. WebSockets Stream
Notifications are pumped directly into the local application environments through an authorized Socket tunnel, maintaining a 10-minute cooldown cache to eradicate notification spam.

## 6. Self-Healing Database
Location histories expire via native MongoDB TTL constraints after 1 hour, neutralizing stale tracking bugs implicitly.
