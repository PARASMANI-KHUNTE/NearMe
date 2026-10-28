# NearMe Web Application

Modern, responsive web client for NearMe built with React 19, TypeScript, Vite, Tailwind CSS v4, Zustand, and React-Leaflet.

## Features

- **Responsive Modern UI**: Glassmorphic styling, Tailwind CSS v4, dark/light theme support.
- **Interactive Proximity Maps**: React-Leaflet integration displaying coarse friend proximity zones with custom radar animations.
- **Real-Time Synchronization**: Socket.io client with automatic exponential reconnection and token refresh synchronization.
- **Resilient Auth**: Secure JWT storage with auto-refresh interceptors, Google Sign-In with `@google/genai` web credentials, and custom 404 page.

## Architecture

```
web/
├── src/
│   ├── app/               # Root app layout, providers, and router config
│   ├── components/        # Reusable UI primitives (Button, Card, Input, ErrorBoundary)
│   ├── config/            # Environment variable bindings
│   ├── pages/             # Route views (Auth, Dashboard, Friends, Map, Profile, 404)
│   ├── services/          # Axios HTTP client, Socket.io service, Google OAuth
│   ├── store/             # Zustand state stores (auth, proximity, notifications)
│   ├── styles/            # Tailwind CSS and theme design tokens
│   ├── App.tsx            # Root application shell
│   └── main.tsx           # Entry point
├── index.html             # HTML entry with Open Graph & SEO meta tags
├── vite.config.ts         # Vite build configuration
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- Backend server running (default: `http://localhost:3000`)

### Setup & Run

1. Navigate to web directory:
   ```bash
   cd web
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
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```
