import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { logger } from './shared/logger/logger';
import { setupSwagger } from './docs/swagger';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import friendRoutes from './modules/friends/friend.routes';
import locationRoutes from './modules/location/location.routes';
import notificationRoutes from './modules/notifications/notification.routes';

const app: Express = express();

// ─── Logging Middleware ──────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    // Only log the fields we care about — suppress full req/res dumps
    customSuccessMessage: (req, res) =>
      `${req.method} ${req.url} ${res.statusCode}`,
    customErrorMessage: (req, res, err) =>
      `${req.method} ${req.url} ${res.statusCode} — ${err.message}`,
    serializers: {
      req(req) {
        return {
          method: req.method,
          url: req.url,
          remoteAddress: req.remoteAddress,
        };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
    // Suppress health-check noise
    autoLogging: {
      ignore: (req) => req.url === '/health',
    },
  })
);

// ─── Core Middlewares ────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── API Docs ────────────────────────────────────────────────────────────────
setupSwagger(app);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/notifications', notificationRoutes);

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Server is healthy' });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err, url: req.url, method: req.method }, err.message);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

export default app;
