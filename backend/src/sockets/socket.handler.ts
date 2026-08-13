import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';
import logger from '../utils/logger';

let io: SocketServer;

export const initSocket = (httpServer: HttpServer): SocketServer => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  // Auth middleware for socket connections
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token as string;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
      (socket as Socket & { userId: string; role: string }).userId = decoded.id;
      (socket as Socket & { userId: string; role: string }).role = decoded.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const { userId, role } = socket as Socket & { userId: string; role: string };
    logger.info(`Socket connected: ${userId} (${role})`);

    // Join a room per user for targeted notifications
    socket.join(`user:${userId}`);

    // Coaches join a coach room for broadcast updates
    if (role === 'coach' || role === 'admin') {
      socket.join('coaches');
    }

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${userId}`);
    });
  });

  return io;
};

// Emit a notification to a specific user
export const notifyUser = (userId: string, event: string, data: unknown): void => {
  io?.to(`user:${userId}`).emit(event, data);
};

// Broadcast a performance update to all coaches
export const broadcastPerformanceUpdate = (data: unknown): void => {
  io?.to('coaches').emit('performance:new', data);
};

// Broadcast a payment alert to admins
export const broadcastPaymentAlert = (data: unknown): void => {
  io?.to('coaches').emit('payment:alert', data);
};

export { io };
