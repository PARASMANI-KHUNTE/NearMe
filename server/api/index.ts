import app from '../src/app';
import { connectDB } from '../src/shared/db/connection';

// Ensure DB connection is established (serverless context)
let dbConnected = false;

const ensureDB = async () => {
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
    } catch (error) {
      // Log but don't fail - some endpoints may not need DB
      console.error('DB connection warning:', error);
    }
  }
};

// Mount DB connection middleware at the top
app.use(async (_req, _res, next) => {
  await ensureDB();
  next();
});

// Export the Express app as a Vercel serverless function
export default app;
