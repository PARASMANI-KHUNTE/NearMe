import app from './app';
import http from 'http';
import { connectDB } from './shared/db/connection';
import { initSocket } from './shared/socket/socket';
import { connectRedis } from './shared/redis/connection';
import { logger } from './shared/logger/logger';

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

const startServer = async () => {
  await connectDB();
  await connectRedis();
  server.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
  });
};

startServer();
