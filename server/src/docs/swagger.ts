import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express, Request, Response, NextFunction } from 'express';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NearMe API',
      version: '1.0.0',
      description: 'Production REST API documentation for NearMe backend — Privacy-First Proximity Social Network',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Provide your JWT bearer token in the Authorization header: Bearer <token>',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Operation failed' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '60d0fe4f5311236168a109ca' },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            name: { type: 'string', example: 'Alex Morgan' },
            picture: { type: 'string', nullable: true },
            uniqueId: { type: 'string', example: 'alex-8492' },
            settings: {
              type: 'object',
              properties: {
                radius: { type: 'number', example: 1000 },
                locationSharingEnabled: { type: 'boolean', example: true },
                invisibleMode: { type: 'boolean', example: false },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    paths: {
      '/api/health': {
        get: {
          summary: 'Service health check',
          tags: ['System'],
          responses: {
            200: {
              description: 'Service status and uptime',
            },
          },
        },
      },
      '/api/auth/register': {
        post: {
          summary: 'Register a new user account',
          tags: ['Auth'],
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name: { type: 'string', example: 'Alex Morgan' },
                    email: { type: 'string', format: 'email', example: 'alex@example.com' },
                    password: { type: 'string', format: 'password', example: 'Pass1234!' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Registration successful. Verification code dispatched.' },
            400: { description: 'Validation error or email already in use' },
          },
        },
      },
      '/api/auth/login': {
        post: {
          summary: 'Authenticate with email and password',
          tags: ['Auth'],
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'alex@example.com' },
                    password: { type: 'string', format: 'password', example: 'Pass1234!' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Authentication successful, returns JWT and user profile' },
            401: { description: 'Invalid credentials or unverified email' },
          },
        },
      },
      '/api/auth/google': {
        post: {
          summary: 'Authenticate via Google OAuth ID token',
          tags: ['Auth'],
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['idToken'],
                  properties: {
                    idToken: { type: 'string', description: 'Google ID token from GSI or mobile SDK' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Google authentication successful' },
            401: { description: 'Invalid Google ID token' },
          },
        },
      },
      '/api/auth/refresh-token': {
        post: {
          summary: 'Refresh expired access token',
          tags: ['Auth'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['refreshToken'],
                  properties: {
                    refreshToken: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'New access token granted' },
            401: { description: 'Invalid or expired refresh token' },
          },
        },
      },
      '/api/users/me': {
        get: {
          summary: 'Fetch current authenticated user profile',
          tags: ['Users'],
          responses: {
            200: { description: 'Current user profile retrieved' },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/api/users/settings': {
        put: {
          summary: 'Update privacy and proximity preferences',
          tags: ['Users'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    radius: { type: 'number', example: 1500 },
                    locationSharingEnabled: { type: 'boolean', example: true },
                    invisibleMode: { type: 'boolean', example: false },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Settings updated successfully' },
          },
        },
      },
      '/api/friends': {
        get: {
          summary: 'List user friends and their proximity status',
          tags: ['Friends'],
          responses: {
            200: { description: 'Friend list returned' },
          },
        },
      },
      '/api/friends/request': {
        post: {
          summary: 'Send a friend request to a user',
          tags: ['Friends'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['targetUserId'],
                  properties: {
                    targetUserId: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Friend request dispatched' },
          },
        },
      },
      '/api/friends/search': {
        get: {
          summary: 'Search users by NearMe unique ID or email',
          tags: ['Friends'],
          parameters: [
            {
              name: 'query',
              in: 'query',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: { description: 'Matching users list' },
          },
        },
      },
      '/api/location/update': {
        post: {
          summary: 'Send client GPS coordinate update',
          tags: ['Location'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['latitude', 'longitude'],
                  properties: {
                    latitude: { type: 'number', example: 37.7749 },
                    longitude: { type: 'number', example: -122.4194 },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Location recorded and proximity checks triggered' },
          },
        },
      },
      '/api/location/nearby': {
        get: {
          summary: 'Get coarse nearby friends within detection radius',
          tags: ['Location'],
          responses: {
            200: { description: 'Nearby friends detected with fuzzy distances' },
          },
        },
      },
      '/api/notifications': {
        get: {
          summary: 'Get notifications list for authenticated user',
          tags: ['Notifications'],
          responses: {
            200: { description: 'Notifications list retrieved' },
          },
        },
      },
      '/api/notifications/{id}/read': {
        patch: {
          summary: 'Mark a specific notification as read',
          tags: ['Notifications'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: { description: 'Notification marked as read' },
          },
        },
      },
      '/api/notifications/read-all': {
        patch: {
          summary: 'Mark all notifications as read',
          tags: ['Notifications'],
          responses: {
            200: { description: 'All notifications marked as read' },
          },
        },
      },
    },
  },
  apis: ['./src/modules/**/*.routes.ts', './src/modules/**/*.controller.ts'],
};

const swaggerSpec = swaggerJSDoc(options);

const swaggerBasicAuth = (req: Request, res: Response, next: NextFunction) => {
  const swaggerUser = process.env.SWAGGER_USER || 'admin';
  const swaggerPass = process.env.SWAGGER_PASS || 'change_this_password_in_production';

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Swagger Docs"');
    res.status(401).send('Authentication required');
    return;
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
  const [username, password] = credentials.split(':');

  if (username === swaggerUser && password === swaggerPass) {
    next();
  } else {
    res.setHeader('WWW-Authenticate', 'Basic realm="Swagger Docs"');
    res.status(401).send('Invalid credentials');
  }
};

export const setupSwagger = (app: Express) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    app.use('/api-docs', swaggerBasicAuth, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  } else {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  }
};
