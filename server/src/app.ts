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

const landingPage = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>NearMe API</title>
    <style>
      :root {
        color-scheme: dark;
        --panel: rgba(36, 27, 18, 0.76);
        --panel-border: rgba(255, 255, 255, 0.12);
        --text: #fff7ed;
        --muted: #fed7aa;
        --accent: #f59e0b;
        --accent-strong: #f97316;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: "Segoe UI", Arial, sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at top left, rgba(249, 115, 22, 0.28), transparent 32%),
          radial-gradient(circle at bottom right, rgba(250, 204, 21, 0.18), transparent 28%),
          linear-gradient(135deg, #120f0d 0%, #1f160f 48%, #0f0a07 100%);
        display: grid;
        place-items: center;
        padding: 24px;
      }
      .shell {
        width: min(980px, 100%);
        border: 1px solid var(--panel-border);
        background: var(--panel);
        backdrop-filter: blur(18px);
        border-radius: 28px;
        overflow: hidden;
        box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35);
      }
      .hero {
        padding: 32px;
        display: grid;
        gap: 28px;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        width: fit-content;
        padding: 8px 14px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.08);
        color: var(--muted);
        font-size: 13px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        font-weight: 700;
      }
      .title {
        margin: 0;
        font-size: clamp(2.4rem, 6vw, 4.8rem);
        line-height: 0.95;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .copy {
        max-width: 60ch;
        color: var(--muted);
        font-size: 1.05rem;
        line-height: 1.7;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 14px;
      }
      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 14px 18px;
        border-radius: 14px;
        text-decoration: none;
        font-weight: 700;
        transition: transform 160ms ease;
      }
      .button:hover {
        transform: translateY(-1px);
      }
      .button-primary {
        color: #1c1917;
        background: linear-gradient(135deg, #facc15, #f59e0b);
      }
      .button-secondary {
        color: var(--text);
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(255, 255, 255, 0.04);
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        border-top: 1px solid rgba(255, 255, 255, 0.08);
      }
      .card {
        padding: 24px 28px 28px;
        border-right: 1px solid rgba(255, 255, 255, 0.08);
      }
      .card:last-child {
        border-right: 0;
      }
      .card h2 {
        margin: 0 0 12px;
        font-size: 1rem;
      }
      .card p {
        margin: 0;
        color: var(--muted);
        line-height: 1.65;
      }
      .logo {
        width: 72px;
        height: 72px;
        border-radius: 22px;
        background: linear-gradient(135deg, var(--accent-strong), var(--accent), #facc15);
        display: grid;
        place-items: center;
        box-shadow: 0 18px 40px rgba(249, 115, 22, 0.3);
      }
      .logo-ring {
        position: relative;
        width: 32px;
        height: 32px;
        border-radius: 999px;
        border: 4px solid white;
      }
      .logo-ring::after {
        content: "";
        position: absolute;
        inset: 9px;
        border-radius: 999px;
        background: white;
      }
      @media (max-width: 760px) {
        .hero {
          padding: 24px;
        }
        .grid {
          grid-template-columns: 1fr;
        }
        .card {
          border-right: 0;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        .card:first-child {
          border-top: 0;
        }
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <section class="hero">
        <div class="logo" aria-hidden="true">
          <div class="logo-ring"></div>
        </div>
        <div class="badge">NearMe backend</div>
        <h1 class="title">Privacy-first proximity API</h1>
        <p class="copy">
          This service powers authentication, friend presence, location sharing, and notification delivery for NearMe.
          Use the health endpoint to confirm uptime and the API docs to inspect available routes.
        </p>
        <div class="actions">
          <a class="button button-primary" href="/docs">Open API docs</a>
          <a class="button button-secondary" href="/health">Check health</a>
        </div>
      </section>
      <section class="grid">
        <article class="card">
          <h2>Auth</h2>
          <p>Register, sign in, verify tokens, and manage secure session flows.</p>
        </article>
        <article class="card">
          <h2>Location</h2>
          <p>Update proximity-safe coordinates and query nearby relationships without exposing exact places.</p>
        </article>
        <article class="card">
          <h2>Alerts</h2>
          <p>Deliver timely notifications when someone in your circle enters a meaningful range.</p>
        </article>
      </section>
    </main>
  </body>
</html>`;

app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    // Add this to prevent Google's scripts from being blocked by Content Security Policy
    contentSecurityPolicy: false,
  }),
);

const allowedOrigin = process.env.CORS_ORIGIN;
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' ? allowedOrigin : 'http://localhost:5173',
  credentials: true,
};

app.use(cors(corsOptions));

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use(
  pinoHttp({
    logger,
    customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
    customErrorMessage: (req, res, err) => `${req.method} ${req.url} ${res.statusCode} - ${err.message}`,
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
      ignore: req => req.url === '/health',
    },
  }),
);

app.use(express.json());

setupSwagger(app);

app.get('/', (_req: Request, res: Response) => {
  res.status(200).type('html').send(landingPage);
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Server is healthy' });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
