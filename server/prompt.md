You are a senior backend engineer. Build a production-grade backend system for a mobile application called "NearMe".

NearMe is a privacy-first proximity-based social app that notifies users when friends come within a configurable radius using geo-location.

Follow ALL instructions strictly. Generate clean, modular, scalable code with tests and documentation.

---

## 🧱 TECH STACK

* Node.js (TypeScript)
* Express.js
* MongoDB (Mongoose)
* Socket.io (real-time)
* Google OAuth using google-auth-library
* JWT (jsonwebtoken)
* Zod (validation)
* Pino (logging)
* Jest + Supertest (testing)
* Swagger (OpenAPI docs)
* dotenv (env management)

OPTIONAL:

* Redis (caching)
* BullMQ (jobs)

---

## 🏗️ ARCHITECTURE

Pattern: Modular Monolith (feature-based)

Each module must include:

* controller
* service
* repository (data layer)
* routes
* validation schema

---

## 📁 PROJECT STRUCTURE

src/
├── modules/
│    ├── auth/
│    ├── users/
│    ├── friends/
│    ├── location/
│    ├── proximity/
│    ├── notifications/
│
├── shared/
│    ├── db/
│    ├── logger/
│    ├── middlewares/
│    ├── utils/
│
├── config/
├── docs/
├── tests/
├── app.ts
└── server.ts

---

## ⚙️ STEP 1: PROJECT SETUP

* Initialize TypeScript project
* Setup ESLint + Prettier
* Setup tsconfig
* Setup environment config (.env)
* Create Express app with middleware:

  * JSON parser
  * CORS
  * error handler

---

## ⚙️ STEP 2: DATABASE SETUP

* Connect MongoDB using Mongoose
* Create connection utility
* Enable logging for DB events

---

## 🔐 STEP 3: AUTH MODULE (GOOGLE OAUTH)

* Use google-auth-library

Flow:

1. Accept idToken from frontend
2. Verify token using Google client
3. Extract user info (email, name, picture)
4. Create user if not exists
5. Generate JWT
6. Return JWT + user

Routes:
POST /auth/google

---

## 👤 STEP 4: USERS MODULE

* Get profile
* Update settings:

  * radius
  * location sharing

---

## 👥 STEP 5: FRIENDS MODULE

* Send request
* Accept/reject
* List friends

---

## 📍 STEP 6: LOCATION MODULE

* Update location API
* Store GeoJSON:
  {
  type: "Point",
  coordinates: [lng, lat]
  }

IMPORTANT:

* Add 2dsphere index
* Add TTL index for expiry

---

## 📏 STEP 7: PROXIMITY ENGINE

Logic:

* On location update:

  * Query nearby users using $near
  * Filter only friends
  * Check radius match

If match:

* Trigger notification

---

## 🔔 STEP 8: NOTIFICATIONS

* Store notification in DB
* Emit via Socket.io

---

## ⚡ STEP 9: SOCKET.IO

* Setup socket server
* Authenticate via JWT
* Map userId → socketId
* Emit events:

  * proximity_alert
  * friend_request
  * meet_request

---

## 🔐 STEP 10: MIDDLEWARES

* JWT auth middleware
* Error handler
* Request validation (Zod)
* Rate limiting

---

## 📡 STEP 11: API RESPONSE FORMAT

{
success: boolean,
data: object,
message: string
}

---

## 🧠 STEP 12: PRIVACY RULES

* Do NOT expose exact location
* Only send approximate distance
* If user disables location → exclude from queries

---

## 🧪 STEP 13: TESTING (VERY IMPORTANT)

Use:

* Jest
* Supertest

Write tests for:

* Auth (Google login)
* Friend requests
* Location update
* Proximity detection

Create:
tests/
├── auth.test.ts
├── friends.test.ts
├── location.test.ts

---

## 📘 STEP 14: DOCUMENTATION

Use Swagger (OpenAPI)

* Setup Swagger UI
* Document ALL endpoints:

  * auth
  * users
  * friends
  * location
  * notifications

Include:

* request schema
* response schema
* example payloads

Expose docs at:
/api-docs

---

## 📦 STEP 15: LOGGER

* Use Pino
* Log:

  * requests
  * errors
  * DB events

---

## 🚀 STEP 16: FINAL INTEGRATION

* Connect all modules
* Ensure clean routing
* Add health check endpoint:
  GET /health

---

## 🎯 FINAL REQUIREMENTS

* Fully working backend
* Modular clean code
* Production-ready structure
* Proper error handling
* Tests passing
* Swagger docs working

---

## ⚠️ IMPORTANT

Generate step-by-step:

1. Setup
2. DB
3. Auth
4. Friends
5. Location + proximity
6. Socket
7. Tests
8. Docs

DO NOT skip steps.
DO NOT generate everything in one chunk.
