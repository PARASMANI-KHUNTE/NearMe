import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { logger } from './shared/logger/logger';
import { setupSwagger } from './docs/swagger';
import { errorHandler, notFoundHandler } from './shared/middlewares/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import friendRoutes from './modules/friends/friend.routes';
import locationRoutes from './modules/location/location.routes';
import notificationRoutes from './modules/notifications/notification.routes';

const app: Express = express();

// ─── Security Middlewares ──────────────────────────────────────────────────────
app.use(helmet());

// CORS - configured for production
const allowedOrigin = process.env.CORS_ORIGIN ;
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? allowedOrigin
    : 'http://localhost:5173', // Replace with your local frontend port
  credentials: true,
};

app.use(cors(corsOptions));
// ─── Rate Limiting ───────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // strict limit for auth endpoints
  message: { success: false, message: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ─── Logging Middleware ──────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
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
    autoLogging: {
      ignore: (req) => req.url === '/health',
    },
  })
);

// ─── Body Parsing ──────────────────────────────────────────────────────────────
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

// ─── 404 Handler ───────────────────────────────────────────────────────────────
app.use(notFoundHandler);

// ─── Global Error Handler ────────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
