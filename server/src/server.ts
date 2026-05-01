import http from 'http';
import net from 'net';
import app from './app';
import { getPort } from './shared/config';
import { connectDB } from './shared/db/connection';
import { logger } from './shared/logger/logger';
import { connectRedis } from './shared/redis/connection';
import { initSocket } from './shared/socket/socket';

const PORT = getPort();

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

const ensurePortAvailable = (port: number, host = '0.0.0.0') =>
  new Promise<void>((resolve, reject) => {
    const portProbe = net.createServer();

    portProbe.once('error', reject);
    portProbe.once('listening', () => {
      portProbe.close(error => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });

    portProbe.listen(port, host);
  });

const startServer = async () => {
  try {
    await ensurePortAvailable(PORT);
    await connectDB();
    await connectRedis();

    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    const startupError = error as NodeJS.ErrnoException;

    if (startupError.code === 'EADDRINUSE') {
      logger.error(
        `Port ${PORT} is already in use. Stop the existing process or change PORT in server/.env before starting the dev server.`,
      );
    } else {
      logger.error(startupError, 'Server failed to start');
    }

    process.exit(1);
  }
};

startServer();
