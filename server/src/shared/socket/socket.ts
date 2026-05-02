import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { User } from '../../modules/users/user.model';
import { logger } from '../logger/logger';
import { getJwtSecret, getCorsOrigin } from '../config';

let io: SocketIOServer;
const userSocketMap = new Map<string, string>(); // userId -> socketId

export const initSocket = (server: HttpServer) => {
  const corsOrigins = getCorsOrigin();
  
  io = new SocketIOServer(server, {
    cors: {
      origin: corsOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // JWT Authentication Middleware
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.token;
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const jwtSecret = getJwtSecret();
      const decoded = jwt.verify(token as string, jwtSecret) as { id: string };

      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.data.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.user._id.toString();
    logger.info({ userId, socketId: socket.id }, 'Socket connected');

    userSocketMap.set(userId, socket.id);

    socket.on('disconnect', () => {
      logger.info({ userId, socketId: socket.id }, 'Socket disconnected');
      if (userSocketMap.get(userId) === socket.id) {
        userSocketMap.delete(userId);
      }
    });
  });

  return io;
};

// Emit an event to a specific user by userId
export const emitToUser = (userId: string, eventName: string, data: any) => {
  if (!io) return;
  const socketId = userSocketMap.get(userId.toString());
  if (socketId) {
    io.to(socketId).emit(eventName, data);
    logger.debug({ userId, eventName }, 'Socket event emitted');
  }
};
