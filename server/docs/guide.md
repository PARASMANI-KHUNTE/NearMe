# NearMe Setup and Usage Guide

## Prerequisites
- Node.js (v18 or higher)
- MongoDB (Running locally or via MongoDB Atlas)
- Google Cloud Console account (for OAuth Client ID)

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   cd NearMe/server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Copy the example environment file and update variables:
   ```bash
   cp .env.example .env
   ```
   **Required variables to update:**
   - `MONGO_URI`: Your MongoDB connection string.
   - `JWT_SECRET`: A secure, random string for signing JWT tokens.
   - `GOOGLE_CLIENT_ID`: OAuth client ID obtained from Google Cloud Console.

## Running the Application

### Development
Start the application using `nodemon` and `ts-node` for real-time compilation:
```bash
npm run dev
```

### Production
Build the TypeScript source and run using PM2 or raw Node:
```bash
npm run build
pm2 start ecosystem.config.js
```

## Running Tests
Run the Jest test suite:
```bash
npm run test
```

## Accessing Documentation
Once the server is running, interactive Swagger API documentation is available at:
`http://localhost:3000/api-docs`
